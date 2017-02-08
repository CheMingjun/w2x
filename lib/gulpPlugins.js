/**
 * Created by CheMingjun on 2017/1/16.
 */
var path = require('path'), fs = require('fs'), util = require('util');

var gutil = require('gulp-util');
var through = require('through2');
var myUtil = require('./util');

module.exports = {
    appJson: function (_appConfig,srcPath,buildTargetPath) {
        return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                this.push(file);
                return cb();
            }
            _appConfig.rootFilePath = file.base;

            var js = '';

            var content = file.contents.toString();
            var json = JSON.parse(content);

            var regLibs = _appConfig['libs'] = {};
            var libs = json.libs;
            if (libs) {
                for (var nm in libs) {
                    var jsPath = path.join(file.base, libs[nm]), dirPath = jsPath.substring(0, jsPath.lastIndexOf('/'));
                    var fn = require(jsPath);
                    if (typeof fn === 'function') {
                        var to = regLibs[nm] = {
                            name: nm,
                            filePath: path.join(file.base, libs[nm])
                        };
                        fn({
                            reg: function (_reg) {
                                var rtn = {};
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

            var pages = json.pages;
            if (pages) {
                var to = _appConfig['pages'] = {};
                pages.forEach(function (_page) {
                    var tpath = path.join(file.base, _page + '.wx.html');
                    if (fs.existsSync(tpath)) {
                        to[tpath] = {filePath: tpath, appPath: _page};
                        js += 'require("' + tpath + '");';
                    }
                })
                if (_appConfig['libs']) {
                    for (var nm in _appConfig['libs']) {
                        var _lib = _appConfig['libs'][nm];
                        if (_lib.pages) {
                            _lib.pages.forEach(function (_page) {
                                if (fs.existsSync(_page.filePath)) {
                                    to[_page.filePath] = {filePath: _page.filePath, appPath: _page.appPath, lib: _lib};
                                    js += 'require("' + _page.filePath + '");';
                                } else {
                                    throw new Error('No page[' + _page.path + '] found.');
                                }
                            })
                        }
                    }
                }
            }

            file.contents = new Buffer(js);
            this.push(file);
            cb();

            //-------------------------------------------------------------------------------------

            var tc = fs.readFileSync(path.join(srcPath,'app.js'), 'utf-8');
            if (tc) {
                var bdPath = path.join(buildTargetPath, 'app.js');
                util.file.create(bdPath);
                fs.writeFileSync(bdPath, tc);
            }
            tc = fs.readFileSync(path.join(srcPath,'app.json'), 'utf-8');
            if (tc) {
                var appJson = JSON.parse(tc);
                var pages = appExtCfg['pages'];
                if (pages) {
                    pages.forEach(function (_page) {
                        appJson.pages.push('pages/' + _page.id);//添加自定义页面
                    })
                }

                var bdPath = path.join(buildTargetPath, 'app.json');
                util.file.create(bdPath);
                fs.writeFileSync(bdPath, tc);
            }
            tc = fs.readFileSync(getPath('app.wxss'), 'utf-8');
            if (tc) {
                var bdPath = path.join(buildTargetPath, 'app.wxss');
                util.file.create(bdPath);
                fs.writeFileSync(bdPath, tc);
            }

        });
    }
}