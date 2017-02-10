/**
 * 小程序W2X模型|脚手架 *.wx.html loader
 *
 * Created by CheMingjun on 2017/1/7.
 */
'use strict';
var path = require('path'), fs = require('fs'), util = require('./util');
var lessC = require('less');
var config = require('./config');
var appConfig;

//--------------------------------------------------------------------------------------------------

module.exports = function (_source, map) {
    //webpack configuration 中配置的appConfig参数
    appConfig = this.loaders[0].options.appConfig;
    var pages = appConfig['pages'];
    //当前文件路径
    var curPath = this.resourcePath;
    var mfPath = pages[curPath].mainFilePath, curWxHtmlFilePath = transWxHtmlFilePath(curPath);
    var rtnScript = '';
    var obj;
    if (!mfPath || mfPath === curWxHtmlFilePath) {//解析page根文件
        obj = parse(_source, curPath, curWxHtmlFilePath, {}, true);
        rtnScript = proRoot(curWxHtmlFilePath, obj);
    } else {//解析依赖的组件wx.html文件
        obj = parse(_source, curPath, mfPath, {});
        rtnScript = obj.script;
    }

    /**
     * 处理根文件
     * @param _filePath
     * @param _to
     */
    function proRoot(_filePath, _to) {
        if (_to) {
            var inLib = false;
            _filePath = transWxHtmlFilePath(_filePath);

            var tpath = _filePath.substring(0, _filePath.lastIndexOf('.'));
            //处理wxss
            if (_to.wxss) {
                var bdPath = proPath(tpath, '.wxss');
                util.file.create(bdPath)(function () {
                    fs.writeFileSync(bdPath, _to.wxss);
                });
            }
            //处理wxml
            if (_to.wxml) {
                var bdPath = proPath(tpath, '.wxml');
                util.file.create(bdPath)(function () {
                    fs.writeFileSync(bdPath, _to.wxml);
                });
            }
            return _to.script;
        }
    };

    return rtnScript;
}

//--------------------------------------------------------------------------------------------------
/**
 * 解析 *.wx.html file
 * 当前版本使用了简单的正则扫描的处理方式，之后重构成为基于AST解析的方式
 * 核心思路:对style\template\script分别处理，返回结构化对象
 *
 * @param _filePath
 * @param _extName
 * @returns {*}
 */
var parse = function (_content, _filePath, _mainFilePath, _params, _isMainFile) {
    if (_content) {
        var rtn = appConfig['pages'][_filePath];
        if (!rtn) {
            rtn = {req: [], mainFilePath: _mainFilePath};
            appConfig['pages'][_filePath] = rtn;
        } else if (!rtn.req) {
            rtn.req = [];
            rtn.mainFilePath = _mainFilePath;
        }
        //构造用于作用域隔离的id，根文件使用符号_
        var uuid = rtn.uuid ? rtn.uuid : (rtn.uuid = (_isMainFile ? '_' : util.uuid()));

        var wxss = '', wxml = '', script = 'var _ = {};';

        //处理style（wxss）
        var reg = /<style[\s\S]*?>([\s\S]+)<\/style>/ig, tary;
        while (tary = reg.exec(_content)) {
            var css = tary[1];
            if (css) {
                if (!_isMainFile) {
                    //通过uuid实现css的隔离
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

        //处理template（wxml）
        reg = /<template([\s\S]*?)>([\s\S]+)<\/template>/ig;
        while (tary = reg.exec(_content)) {
            var html = tary[2];
            if (html) {
                //扫描wx-*的属性
                // 在小程序中，标准的用法是 wx:*，如 wx:for，
                // 但是在html中会在IDE（如webstorm）中提示语法错误，
                // 故采用wx-*，如 wx-for的形式来避免，当然，使用wx:for也是合法的
                html = html.replace(/(\s+wx)-(\w+)/gi, function (_ts, _b, _e) {
                    return _b + ':' + _e;
                });

                //替换{{}}变量，进行作用域隔离
                //注意，此处忽略以$开头的变量，比如以下代码：
                //<button wx-key="uniqueItem" wx-for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx-for-item="$sku" wx-for-index="$i">
                //{{$sku}} {{$i}} test
                //</button>
                html = html.replace(/{{([^$}]+)}}/gi, function (_ts, _var) {
                    _var = _var.replace(/(\.?)([a-zA-Z_]+)/gi, function (_ts, _dot, _var) {
                        if (_dot === '') {//只针对*.*形式的变量进行处理
                            var val = _params[_var];
                            if (val) {
                                if (val.type === 'var') {
                                    return val.val;
                                } else {
                                    return val.val;
                                }
                            } else {
                                return _var;
                            }
                        } else {
                            return _ts;
                        }
                    });
                    return '{{' + _var + '}}';
                });
                //替换形如 :property="{{}}"的变量引用
                //以:开头代表中对当前页面中methods中的方法引用
                html = html.replace(/(\s+:\w+\s*=['"])([^'"]*)(['"])/gi, function (_0, _b, _fn, _e) {
                    return _b + uuid + '.' + _fn + _e;
                });
                //替换各类事件
                html = html.replace(/(bind|catch)(tap|longtap|touchend|touchcancel|touchmove|touchstart|submit|input|scroll)=(['"])/gi, function (_ts, _m, _t, _quo) {
                    return _m + _t + '=' + _quo + uuid;
                })

                var nss = tary[1];

                //扫描对组件库的引用
                var pt = /xmlns:([\w]+)\s*=['"]([^'"]+)['"]+/ig, t, nsReg = {};
                while (t = pt.exec(nss)) {
                    let nm = t[2], lib;

                    //支持通过相对路径的方式对组件进行引用，如下例中的xmlns:demo="./*"：
                    //<template xmlns:demo="./*">
                    //  <demo:toolbar btns="{{btns}}"/>
                    //</template>
                    if (/^\.{1,2}\/\S*\*$/.test(nm)) {//relative path,like:./*
                        lib = {coms: {}};
                        var dirPath = path.join(_filePath.substring(0, _filePath.lastIndexOf(path.sep)), nm.substring(0, nm.length - 1));
                        fs.readdirSync(dirPath)
                            .filter(function (_nm) {
                                if (/\.wx\.html$/.test(_nm)) {
                                    lib.coms[_nm.substring(0, _nm.indexOf('.'))] = {filePath: path.join(dirPath, _nm)};
                                }
                            });
                    } else {
                        lib = appConfig.libs[nm];
                    }

                    if (!lib) {
                        throw new Error('No W2X lib[' + t[2] + '] defined in app.json.');
                    }

                    nsReg[t[1]] = lib;
                }

                //对组件库分别进行处理
                for (var ns in nsReg) {
                    var lib = nsReg[ns], pt = new RegExp('<' + ns + ':(\\w+)((\\s*:?\\w+\\s*=\\s*[\'"][^\'"]*[\'"])*)\\s*/?>(([\\s\\S]*)</' + ns + ':(\\w+)>)?', 'ig');
                    html = html.replace(pt, function (_ts, _name, _params) {
                        var comDef = lib.coms[_name];
                        if (!comDef) {
                            throw new Error('No Component[name=' + _name + '] found in lib[' + lib.name + '].');
                        }

                        //处理参数列表
                        var params = {};
                        if (_params) {
                            var tary = _params.trim().split(/\s/g);
                            tary.forEach(function (_ts) {
                                if (_ts !== '') {
                                    var pt = /(:?[\w]+)\s*=['"]([^'"]+)['"]/ig;
                                    var t = pt.exec(_ts);
                                    if (t.length >= 3) {
                                        //当前Page中的method引用
                                        if (t[1].charAt(0) === ':') {
                                            params[t[1].substring(1)] = {type: 'method', val: t[2]};
                                        } else {
                                            //当前Page中的data型引用
                                            if (t[2].indexOf('{{') == 0) {
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

                        //递归处理
                        var obj = parse(fs.readFileSync(implFilePath, 'utf8'), implFilePath, _mainFilePath, params);
                        //合并wxss
                        if (obj.wxss) {
                            wxss += obj.wxss;
                        }
                        //合并脚本
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
                //封装wxml
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

var proPath = function (_filePath, _extName) {
    var fname = _filePath.substring(_filePath.lastIndexOf('/') + 1);
    fname = fname.substring(0, fname.lastIndexOf('.'));

    var ti = _filePath.indexOf(config.srcPath) + config.srcPath.length;
    var root = _filePath.substring(0, ti),
        curPath = _filePath.substring(ti + 1);
    curPath = curPath.substring(0, curPath.lastIndexOf('/'));

    var targetPath = path.join(root, config.build.target, curPath);
    return path.join(targetPath, fname + _extName);
}
var transWxHtmlFilePath = function (_filePath) {
    var pageConfig = appConfig['pages'][_filePath];
    if (pageConfig && pageConfig.lib) {//from component library
        _filePath = path.join(appConfig.rootFilePath, pageConfig.pagePath + '.wx.html');
    }
    return _filePath;
}