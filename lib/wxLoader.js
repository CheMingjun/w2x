/**
 * Created by CheMingjun on 2017/1/15.
 */
'use strict';
var path = require('path'), fs = require('fs'), util = require('./util');
var lessC = require('less');
var config = require('./config');
var appConfig;
var proPath = function (_filePath, _extName) {
        var fname = _filePath.substring(_filePath.lastIndexOf('/') + 1);
        fname = fname.substring(0, fname.lastIndexOf('.'));

        var ti = _filePath.indexOf(config.srcPath) + config.srcPath.length;
        var root = _filePath.substring(0, ti),
            curPath = _filePath.substring(ti + 1);
        curPath = curPath.substring(0, curPath.lastIndexOf('/'));

        var targetPath = path.join(root, config.build.target, curPath);
        return path.join(targetPath, fname + _extName);
    }, transWxHtmlFilePath = function (_filePath) {
        var pageConfig = appConfig['pages'][_filePath];
        if (pageConfig && pageConfig.lib) {//from component library
            _filePath = path.join(appConfig.rootFilePath, pageConfig.appPath + '.wx.html');
        }
        return _filePath;
    }
    /**
     * 解析 wx.html file
     * @param _filePath
     * @param _extName
     * @returns {*}
     */
    , parse = function (_content, _filePath, _mainFilePath, _params, _isMainFile) {
        if (_content) {
            var rtn = appConfig['pages'][_filePath];
            if (!rtn) {
                rtn = {req: [], mainFilePath: _mainFilePath};
                appConfig['pages'][_filePath] = rtn;
            } else if (!rtn.req) {
                rtn.req = [];
                rtn.mainFilePath = _mainFilePath;
            }
            var uuid = rtn.uuid ? rtn.uuid : (rtn.uuid = (_isMainFile ? '_' : util.uuid()));

            var wxss = '', wxml = '', script = 'var _ = {};';

            var reg = /<style[\s\S]*?>([\s\S]+)<\/style>/ig, tary;
            while (tary = reg.exec(_content)) {
                var css = tary[1];
                if (css) {
                    if (!_isMainFile) {
                        lessC.render('.' + uuid + '{' + css + '}', function (e, _rtn) {
                            if (e) {
                                throw e;
                            }
                            css = _rtn.css;
                        });
                    }
                    wxss += css;
                }
            }

            reg = /<template([\s\S]*?)>([\s\S]+)<\/template>/ig;
            while (tary = reg.exec(_content)) {
                var html = tary[2];
                if (html) {
                    html = html.replace(/(\s+wx)-(\w+)/gi, function (_ts, _b, _e) {
                        return _b + ':' + _e;
                    }).replace(/{{([^}]+)}}/gi, function (_ts, _var) {//替换{{}}变量
                        _var = _var.replace(/(\.?)([a-zA-Z_]+)/gi, function (_ts, _dot, _var) {
                            if (_dot === '') {
                                var val = _params[_var];
                                if (val) {
                                    if (val.type === 'var') {
                                        return val.val;
                                    } else {
                                        return val.val;
                                    }
                                } else if (!/^(item|index)$/.test(_var)) {
                                    return uuid + '.' + _var;
                                } else {
                                    return _var;
                                }
                            } else {
                                return _ts;
                            }
                        });
                        return '{{' + _var + '}}';
                    }).replace(/(\s+:\w+\s*=['"])([^'"]*)(['"])/gi, function (_0, _b, _fn, _e) {//替换:handler=""
                        return _b + uuid + '.' + _fn + _e;
                    }).replace(/(bind|catch)(tap|longtap|touchend|touchcancel|touchmove|touchstart|submit|input|scroll)=(['"])/gi, function (_ts, _m, _t, _quo) {
                        return _m + _t + '=' + _quo + uuid;
                    })

                    var nss = tary[1];

                    var pt = /xmlns:([\w]+)\s*=['"]([^'"]+)['"]+/ig, t, nsReg = {};
                    while (t = pt.exec(nss)) {
                        let nm = t[2], lib;
                        if (/^\.{1,2}\/\S*\*$/.test(nm)) {//relative path,like:./*
                            lib = {coms: {}};
                            var dirPath = path.join(_filePath.substring(0, _filePath.lastIndexOf(path.sep)), nm.substring(0, nm.length - 1));
                            var files = fs.readdirSync(dirPath)
                                .filter(function (_nm) {
                                    if (/\.wx\.html$/.test(_nm)) {
                                        lib.coms[_nm.substring(0, _nm.indexOf('.'))] = {filePath: path.join(dirPath, _nm)};
                                    }
                                });
                        } else {
                            lib = appConfig.libs[nm];
                        }

                        if (!lib) {
                            throw new Error('No component lib[' + t[2] + '] defined in app.json.');
                        }

                        nsReg[t[1]] = lib;
                    }
                    for (var ns in nsReg) {
                        var lib = nsReg[ns], pt = new RegExp('<' + ns + ':(\\w+)((\\s*:?\\w+\\s*=\\s*[\'"][^\'"]*[\'"])*)\\s*/?>(([\\s\\S]*)</' + ns + ':(\\w+)>)?', 'ig');
                        html = html.replace(pt, function (_ts, _name, _params) {
                            var comDef = lib.coms[_name];
                            if (!comDef) {
                                throw new Error('No Component[name=' + _name + '] found in lib[' + lib.name + '].');
                            }
                            var params = {};
                            if (_params) {
                                var tary = _params.trim().split(/\s/g);
                                tary.forEach(function (_ts) {
                                    if (_ts !== '') {
                                        var pt = /(:?[\w]+)\s*=['"]([^'"]+)['"]/ig;
                                        var t = pt.exec(_ts);
                                        if (t.length >= 3) {
                                            if (t[1].charAt(0) === ':') {//当前Page中的method引用
                                                params[t[1].substring(1)] = {type: 'method', val: t[2]};
                                            } else {
                                                if (t[2].indexOf('{{') == 0) {//当前Page中的data型引用
                                                    params[t[1]] = {type: 'var', val: t[2].substring(2, t[2].length - 2)};
                                                } else {//普通值
                                                    params[t[1]] = {type: 'val', val: '"' + t[2] + '"'};
                                                }
                                            }
                                        } else {
                                            throw new Error('Param[' + _ts + '] format error.');
                                        }
                                    }
                                })
                            }

                            var implFilePath = comDef.filePath;

                            rtn.req.push(implFilePath);

                            var obj = parse(fs.readFileSync(implFilePath, 'utf8'), implFilePath, _mainFilePath, params);
                            if (obj.wxss) {
                                wxss += obj.wxss;
                            }
                            if (obj.script) {
                                script += `
                                var tm = require('${implFilePath}');
                                _['${appConfig['pages'][implFilePath].uuid}'] = [tm,${JSON.stringify(params)}];
                                if(typeof tm._ ==='object'){
                                    for(var uid in tm._){
                                        _[uid] = tm._[uid];
                                    }
                                }
                                `;
                            }
                            return obj.wxml;
                        })
                    }
                    wxml = _isMainFile ? html : '<view class="' + uuid + '">' + html + '</view>';
                }
            }

            reg = /<script[\s\S]*?>([\s\S]+)<\/script>/ig;
            var tary, myScript = '';
            while (tary = reg.exec(_content)) {
                myScript = tary[1];
            }

            rtn.wxss = wxss;
            rtn.wxml = wxml;
            rtn.script = myScript + script + `
                     module.exports._ = _;
                    `;
            return rtn;
        }
    }

module.exports = function (_source, map) {
    var obj, proRoot = function (_filePath, _to) {
        if (_to) {
            var inLib = false;
            _filePath = transWxHtmlFilePath(_filePath);

            var tpath = _filePath.substring(0, _filePath.lastIndexOf('.'));
            if (_to.wxss) {
                var bdPath = proPath(tpath, '.wxss');
                util.file.create(bdPath)(function () {
                    fs.writeFileSync(bdPath, _to.wxss);
                });
            }
            if (_to.wxml) {
                var bdPath = proPath(tpath, '.wxml');
                util.file.create(bdPath)(function () {
                    fs.writeFileSync(bdPath, _to.wxml);
                });
            }
            return _to.script;
        }
    };

    var curFilePath = this.resourcePath;
    appConfig = this.loaders[0].options.appConfig;
    var pages = appConfig['pages'];
    var rtnScript = '';
    var mfPath = pages[curFilePath].mainFilePath, curWxHtmlFilePath = transWxHtmlFilePath(curFilePath);
    if (!mfPath || mfPath === curWxHtmlFilePath) {//root
        obj = parse(_source, curFilePath, curWxHtmlFilePath, {}, true);
        rtnScript = proRoot(curWxHtmlFilePath, obj);
    } else {
        obj = parse(_source, curFilePath, mfPath, {});
        rtnScript = obj.script;
    }

    return rtnScript;
}