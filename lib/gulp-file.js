/**
 * Created by CheMingjun on 2017/1/7.
 */
var path = require('path'), fs = require('fs'), util = require('util');
var co = require('co');
var gulp = require('gulp'),
    gulpWatch = require('gulp-watch'),
    gulpSequence = require('gulp-sequence'),
    rename = require('gulp-rename');

var webpack = require('webpack'),
    ExtractTextPlugin = require("extract-text-webpack-plugin");

var config = require('./config'), myUtil = require('./util'), buildUtil = require('./buildUtil');

var getPath = function (_path) {
    return _path ? path.join(srcPath, _path) : _path;
}, log = function (_msg) {
    console.log(typeof _msg === 'object' ? _msg : ('[' + require('moment')().format("HH:mm:ss") + ']' + _msg));
}, webpackConfig = function (_entry, _appCfg, _build) {
    return {
        watch: true,
        entry: _entry,
        output: {
            path: _build,
            filename: '[name].js',
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/
                },
                {test: /\.css$/, loader: "css-loader"},
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: 'url',
                    options: {
                        limit: 10000,
                        name: '[name].[ext]?[hash]'
                    }
                }, {
                    test: /\.wx.html/, loader: "./wxLoader.js", options: {
                        appConfig: _appCfg
                    }
                },
            ]
        },
        plugins: [
            new ExtractTextPlugin('styles.css'),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                'process.env.VUE_ENV': '"server"'
            })
        ],
        devtool: 'source-map'
    }
};

//----------------------------------------------------------------------------------------------------------

var srcPath = path.join(process.cwd(), '../' + config.srcPath),
    buildTmpPath = path.join(srcPath, config.build.temp),
    buildTargetPath = path.join(srcPath, config.build.target);

var jsEntry = {}, appExtCfg = {};
var buildJs = function*(_filePath) {
    var content = fs.readFileSync(_filePath, 'utf-8');
    var dirPath = _filePath.substring(srcPath.length);
    var bdPath = path.join(buildTargetPath, dirPath);
    yield myUtil.file.create(bdPath);
    fs.writeFileSync(bdPath, content);
}, prepare = function*() {
    var rootFilePath = srcPath;
    appExtCfg.rootFilePath = rootFilePath;

    var appJson = require(getPath('app.json'));

    var regLibs = appExtCfg['libs'] = {};
    var libs = appJson.libs;
    if (libs) {
        for (var nm in libs) {
            var jsPath = path.join(rootFilePath, libs[nm]), dirPath = jsPath.substring(0, jsPath.lastIndexOf('/'));
            var fn = require(jsPath);
            if (typeof fn === 'function') {
                var to = regLibs[nm] = {
                    name: nm,
                    filePath: path.join(rootFilePath, libs[nm])
                };
                fn({
                    reg: function (_reg) {
                        var rtn = to['param'] = {};
                        if (typeof _reg.coms === 'object') {
                            var coms = {};
                            for (var cn in _reg.coms) {
                                coms[cn] = {filePath: path.join(dirPath, _reg.coms[cn])};
                            }
                            to.coms = coms;
                        }
                        if (util.isArray(_reg.pages)) {
                            to.pages = [];
                            _reg.pages.forEach(function (_pagePath) {
                                let pid = myUtil.uuid(), appPath = 'pages/' + pid;
                                to.pages.push({
                                    appPath: appPath,
                                    filePath: path.join(dirPath, _pagePath)
                                });
                                rtn[_pagePath] = {
                                    appPath: appPath
                                }
                            })
                        }
                        return rtn;
                    }
                })
            }
        }
    }

    var appScript = 'var __ = {};';//ext for app.js
    var pages = appJson.pages;
    if (pages) {
        var to = appExtCfg['pages'] = {};
        for (let ti = 0; ti < pages.length; ti++) {
            let _page = pages[ti];
            var tpath = path.join(rootFilePath, _page + '.wx.html');
            if (fs.existsSync(tpath)) {
                to[tpath] = {filePath: tpath, appPath: _page};
                jsEntry[_page] = [yield writeTempFile(_page, tpath)];
            }
        }

        if (appExtCfg['libs']) {//search in library
            for (var nm in appExtCfg['libs']) {
                var _lib = appExtCfg['libs'][nm];
                if (_lib.pages) {
                    for (let ti = 0; ti < _lib.pages.length; ti++) {
                        let _page = _lib.pages[ti];
                        if (fs.existsSync(_page.filePath)) {
                            to[_page.filePath] = {filePath: _page.filePath, appPath: _page.appPath, lib: _lib};
                            jsEntry[_page.appPath] = [yield writeTempFile(_page.appPath, _page.filePath)];
                        } else {
                            throw new Error('No page[' + _page.path + '] found.');
                        }
                    }
                }

                var param = {pages: {}};
                if (_lib.param) {
                    for (let nm in _lib.param) {
                        let tpath = _lib.param[nm].appPath;
                        param.pages[nm] = tpath.substring(tpath.indexOf('/') + 1);//直接传递相对路径
                    }
                }
                appScript += '__["' + nm + '"] = require("' + _lib.filePath + '")({reg:function(){return ' + JSON.stringify(param) + ';}});';
            }
        }

        function* writeTempFile(_appPath, _filePath) {
            let jsPath = path.join(buildTmpPath, _appPath + '.js');
            yield myUtil.file.create(jsPath);
            fs.writeFileSync(jsPath, `
var obj = {data: {}}, p = function (_id,_params) {
    var th = this, to = {
        data:{},
        setData: function (_obj) {
            var o = {};
            o[_id] = _obj;
            var ori = th.data[_id];
            for(var nm in ori){
                if(typeof _obj[nm]==='undefined'){
                    _obj[nm] = ori[nm];
                }
            }
            th.setData(o);
        },getProperty:function(_k){
            var t = _params[_k];
            if(t){
                if(t.type==='var'){
                    if(t.val.charAt(0)==='"'){
                        return t.val.substring(1,t.val.length-1);
                    }else if(t.val.indexOf('.')!==-1){
                        var tt = t.val.split('.');
                        if(tt.length===2){
                            var ttt = th.data[tt[0]];
                            return typeof ttt==='object'?ttt[tt[1]]:null;
                        }
                    }
                    throw new Error('Error type of property['+_k+'].');
                }else if(t.type==='method'){
                    var mn = t.val.replace(/\\./g,'');
                    return th[mn];
                }
            }
        }
    };
    var t = this.data[_id];
    if(t){
        for(var nm in t){
            to.data[nm] = t[nm];
        }
    }
    to.libs = getApp().__;
    to.__proto__ = this;
    
    var f = th[_id];
    if(f){
        if (f.methods) {
            for (var n in f.methods) {
                (function(n){
                    to[n] = function () {
                        th[_id+n].apply(th,Array.prototype.slice.call(arguments));
                    }
                 })(n);
            }
        }
    }
    
    return to;
}, lfns = [];
var rjs = require('${_filePath}');
var _ = rjs._;
_['_'] = [rjs];
for(var uid in _){
       (function(_uid,_m){
       var f = _m[0],params = _m[1]||null;
       obj[_uid] = f;
        if (f.data) {
            obj.data[_uid] = f.data;
        }
        if (f.methods) {
            for (var n in f.methods) {
                (function(n){
                    obj[_uid + n] = function () {
                        f.methods[n].apply(p.call(this, _uid,params),Array.prototype.slice.call(arguments));
                    }
                 })(n);
            }
        }
        if (f.onLoad) {
            lfns.push(function () {
                f.onLoad.call(p.call(this, _uid,params));
            });
        }
})(uid,_[uid]);
}
console.log(rjs);

if(lfns.length>0){
    obj.onLoad = function(){
        var th = this;
        lfns.forEach(function(_fn){
            _fn.call(th);
        });
    }
}
Page(obj);
                `);
            return jsPath;
        }
    }

    //----------------------------------------------------------------------------------------------
    // var ignore = [buildTmpPath, buildTargetPath, path.join(srcPath, 'node_modules')];
    // var jsFileAry = myUtil.file.search(srcPath, '.js', ignore);
    // if (jsFileAry) {
    //     for (var ti = 0; ti < jsFileAry.length; ti++) {
    //         yield buildJs(jsFileAry[ti]);
    //     }
    // }

    //-------------------------------------------------------------------------------------
    var tc = fs.readFileSync(getPath('app.js'), 'utf-8');
    if (tc) {
        tc = tc.replace(/\s*App\s*\(\s*\{\s*/g, function (_ts) {
            return _ts + '__:__,\n';
        });
        tc = appScript + '\n' + tc;

        let bdPath = path.join(buildTmpPath, 'app.js');
        yield myUtil.file.create(bdPath);
        fs.writeFileSync(bdPath, tc);
        jsEntry['app'] = [bdPath];
    }

    var pages = appExtCfg['pages'];
    if (pages) {
        for (let nm in pages) {
            let page = pages[nm];
            if (page.lib) {
                appJson.pages.push(page.appPath);//add page from library
            }
        }
    }

    var bdPath = path.join(buildTargetPath, 'app.json');
    yield myUtil.file.create(bdPath);
    fs.writeFileSync(bdPath, JSON.stringify(appJson));

    tc = fs.readFileSync(path.join(srcPath, 'app.wxss'), 'utf-8');
    if (tc) {
        var bdPath = path.join(buildTargetPath, 'app.wxss');
        yield myUtil.file.create(bdPath);
        fs.writeFileSync(bdPath, tc);
    }
}

//-------------------------------------------------------------------------------------

gulp.on('err', function (_e) {
    log(_e.err);
})

gulp.task('dev', function () {
    log('编译微信小程序开始...');
    var doWebpack = function (_cb) {
        log(JSON.stringify(jsEntry));
        return function (_cb) {
            webpack(webpackConfig(jsEntry, appExtCfg, buildTargetPath),
                function (error, stats) {
                    if (error) {
                        log('编译发生错误:' + error);
                        _cb(error);
                    }
                    if (stats.hasErrors()) {
                        var cm = stats.compilation;
                        if (cm.errors && cm.errors.length > 0) {
                            cm.errors.forEach(function (_err) {
                                log('编译发生错误:' + (_err.message || _err));
                                _cb(_err);
                            })
                        } else {
                            log(stats.toJson()['error']);
                            _cb(stats.toJson()['error']);
                        }
                        return;
                    } else {
                        // var msg = stats.toJson();
                        // console.log(msg);
                    }
                    log('编译完成,耗时[' + (stats.endTime - stats.startTime) + ' ms].');
                    _cb && _cb();
                });
        }
    }

    co(function*() {
        yield myUtil.file.remove(buildTmpPath);
        yield myUtil.file.remove(buildTargetPath);
        yield prepare();
        yield doWebpack();
    }).then(function (data) {
        // setTimeout(function () {
        //     gulpWatch([path.join(srcPath, './**/*.js'), '!' + buildTmpPath + '/**/*', '!' + buildTargetPath + '/**/*'], function (_file) {
        //         co(function*() {
        //             yield buildJs(_file.path)
        //         });
        //         log('文件[' + _file.path + ']内容发生变更.');
        //     });
        // }, 3000)
    }, function (err) {
        console.log(err);
        throw err;
    })
});

// process.nextTick(function () {
//     gulp.start('dev');
// })