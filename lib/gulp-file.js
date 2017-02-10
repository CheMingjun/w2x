/**
 * 小程序W2X模型|脚手架gulp-file
 *
 * Created by CheMingjun on 2017/1/7.
 */
var path = require('path'), fs = require('fs'), util = require('util');
var co = require('co');
var gulp = require('gulp'), rename = require('gulp-rename');
var webpack = require('webpack'), ExtractTextPlugin = require("extract-text-webpack-plugin");

var config = require('./config'), myUtil = require('./util');

var jsEntry = {}, appExtCfg = {};

/**
 * 编译的路径准备（可在config.js中配置)
 * srcPath 源码位置
 * buildTmpPath 临时文件位置
 * buildTargetPath 编译目标位置
 */
var srcPath = path.join(process.cwd(), '../' + config.srcPath),
    buildTmpPath = path.join(srcPath, config.build.temp),
    buildTargetPath = path.join(srcPath, config.build.target);

//---------------------------------------------------------------------------------------------------------

gulp.on('err', function (_e) {
    log(_e.err);
})
/**
 * 开发阶段的task
 */
gulp.task('dev', function () {
    log('编译微信小程序开始...');

    //webpack打包
    var doWebpack = function (_cb) {
        //log(JSON.stringify(jsEntry));
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
    //逻辑同步执行
    //清除临时、目标文件夹
    //准备工作
    //执行webpack
    co(function*() {
        yield myUtil.file.remove(buildTmpPath);
        yield myUtil.file.remove(buildTargetPath);
        yield prepare();
        yield doWebpack();
    }).then(function (data) {
    }, function (err) {
        console.log(err);
        throw err;
    })
});

//---------------------------------------------------------------------------------------------------------

var getPath = function (_path) {
    return _path ? path.join(srcPath, _path) : _path;
}
var webpackConfig = function (_entry, _appCfg, _build) {
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
                    test: /\.wx.html/, loader: "./wxHtmlLoader.js", options: {//自定义loader
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
/**
 * 日志处理
 * @param _msg
 */
var log = function (_msg) {
    console.log(typeof _msg === 'object' ? _msg : ('[W2X][' + require('moment')().format("MM-DD HH:mm:ss") + ']' + _msg));
}
//----------------------------------------------------------------------------------------------------------

/**
 *编译前的准备工作
 */
var prepare = function*() {
    var rootFilePath = srcPath;
    appExtCfg.rootFilePath = rootFilePath;

    //处理app.json
    var appJson = require(getPath('app.json'));

    //处理app.json中配置的组件库
    var regLibs = appExtCfg['libs'] = {};
    var libs = appJson.libs;
    if (libs) {
        for (var nm in libs) {
            var jsPath = path.join(rootFilePath, libs[nm]), dirPath = jsPath.substring(0, jsPath.lastIndexOf('/'));
            var libObj = require(jsPath);
            if (typeof libObj === 'object') {
                //注册该组件库
                //组件库中的页面，会在编译的时候转换为app中的唯一路径
                //to变量是为之后加载该组件库时,回调pages对象提供入参
                // 保持pages对应实际pagePath不变（app.json中定义的pages路径）
                var to = regLibs[nm] = {
                    name: nm,
                    filePath: path.join(rootFilePath, libs[nm])
                };
                //注册组件库中的组件
                if (typeof libObj.components === 'object') {
                    var coms = {};
                    for (var cn in libObj.components) {
                        coms[cn] = {filePath: path.join(dirPath, libObj.components[cn])};
                    }
                    to.coms = coms;
                }
                //注册页面,分配唯一的pagePath
                to['param'] = {}
                if (typeof libObj.pages === 'object') {
                    to.pages = [];
                    for (var ppath in libObj.pages) {
                        //计算唯一pagePath
                        let pid = myUtil.uuid(), pagePath = 'pages/' + pid;
                        to.pages.push({
                            pagePath: pagePath,
                            filePath: path.join(dirPath, ppath)
                        });
                        to['param'][pagePath] = {
                            pagePath: pagePath
                        }
                    }
                }
            } else {
                throw new Error('W2X lib register js format error,should be an object{components:{},pages:{},api:{}}.');
            }
        }
    }

    //构造app.js中的代码
    //以page(*.wx.html)作为webpack的entry
    var appScript = 'var __ = {};';//ext for app.js
    var pages = appJson.pages;
    if (pages) {
        var to = appExtCfg['pages'] = {};
        for (let ti = 0; ti < pages.length; ti++) {
            let _page = pages[ti];
            var tpath = path.join(rootFilePath, _page + '.wx.html');
            if (fs.existsSync(tpath)) {
                to[tpath] = {filePath: tpath, pagePath: _page};
                jsEntry[_page] = [yield writePageJSTmpFile(_page, tpath)];
            } else {
                throw new Error('No page file[' + tpath + '] found.');
            }
        }

        //处理组件库中的pages
        if (appExtCfg['libs']) {//search in library
            for (var nm in appExtCfg['libs']) {
                var _lib = appExtCfg['libs'][nm];
                if (_lib.pages) {
                    for (let ti = 0; ti < _lib.pages.length; ti++) {
                        let _page = _lib.pages[ti];
                        if (fs.existsSync(_page.filePath)) {
                            to[_page.filePath] = {filePath: _page.filePath, pagePath: _page.pagePath, lib: _lib};
                            jsEntry[_page.pagePath] = [yield writePageJSTmpFile(_page.pagePath, _page.filePath)];
                        } else {
                            throw new Error('No page file[' + _page.filePath + '] found.');
                        }
                    }
                }

                var param = {pages: {}};
                if (_lib.param) {
                    for (let nm in _lib.param) {
                        let tpath = _lib.param[nm].pagePath;
                        param.pages[nm] = tpath.substring(tpath.indexOf('/') + 1);//直接传递相对路径
                    }
                }

                //将组件库对应的api作为临时变量保存
                appScript +=
                    `(function(){
                        var param = ${JSON.stringify(param)},r = require("${_lib.filePath}");
                        if(r.api){
                            if (typeof r.pages ==='object') {
                                for (var pt in r.pages) {
                                    r.pages[pt](param.pages[pt]);
                                }
                            }
                            __["${nm}"] = r.api;
                        }
                    })();
                    `;
            }
        }

        /**
         * 写page对应js的临时文件,作为entry文件
         *
         * W2X的主要技术原理是通过各种代理实现各类作用域隔离的
         * W2X代理了各类对象，如 data,setData,onload,*.wx.html中对应的methods等等
         *
         * @param _pagePath app.json中对应的path
         * @param _filePath
         * @returns {*}
         */
        function* writePageJSTmpFile(_pagePath, _filePath) {
            let jsPath = path.join(buildTmpPath, _pagePath + '.js');
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
        },setProperty:function(_k,_v){
            var t = _params[_k];
            if(t){
                if(t.type==='var'){
                    if(t.val.indexOf('.')!==-1){
                        var tt = t.val.split('.');
                        if(tt.length===2){
                            var to = {};
                            var tto = to[tt[0]] = {};
                            tto[tt[1]] = _v;
                            var ori = th.data[tt[0]];
                            for(var nm in ori){
                                if(typeof tto[nm]==='undefined'){
                                    tto[nm] = ori[nm];
                                }
                            }
                            th.setData(to);
                            return;
                        }
                    }
                }
                throw new Error('Error type of property['+_k+'].');
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
                        return th[_id+n].apply(th,Array.prototype.slice.call(arguments));
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
                        return f.methods[n].apply(p.call(this, _uid,params),Array.prototype.slice.call(arguments));
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

    //写文件
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
                //填充app.json内容
                appJson.pages.push(page.pagePath);//add page from library
            }
        }
    }

    //写app.json
    var bdPath = path.join(buildTargetPath, 'app.json');
    yield myUtil.file.create(bdPath);
    fs.writeFileSync(bdPath, JSON.stringify(appJson));

    //写app.wxss
    tc = fs.readFileSync(path.join(srcPath, 'app.wxss'), 'utf-8');
    if (tc) {
        var bdPath = path.join(buildTargetPath, 'app.wxss');
        yield myUtil.file.create(bdPath);
        fs.writeFileSync(bdPath, tc);
    }
}

var buildJs = function*(_filePath) {
    var content = fs.readFileSync(_filePath, 'utf-8');
    var dirPath = _filePath.substring(srcPath.length);
    var bdPath = path.join(buildTargetPath, dirPath);
    yield myUtil.file.create(bdPath);
    fs.writeFileSync(bdPath, content);
}

//-------------------------------------------------------------------------------------

// process.nextTick(function () {
//     gulp.start('dev');
// })