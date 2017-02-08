/**
 * Created by CheMingjun on 2017/1/11.
 */
var path = require('path'), fs = require('fs'), util = require('./util');

module.exports = {
    buildHtml: function (srcPath, _tempPath, _filePath) {
        if (fs.existsSync(_filePath)) {
            var content = fs.readFileSync(_filePath, 'utf8');
            if (content) {
                var proHtml = function (_filePath, _dirPath, _params, _root) {
                    var tc = fs.readFileSync(_filePath, 'utf8');
                    if (tc) {
                        var uqfid = (_dirPath + _filePath.substring(_filePath.lastIndexOf(path.sep))).replace(/-|\//gi, '_').replace(/\.|\//gi, '').toLowerCase(),
                            uuid = _root ? '_' : util.uuid();

                        var wxss = '', wxml = '', script = '', rtn = {};
                        var reg = /<style[\s\S]*?>([\s\S]+)<\/style>/ig, tary;
                        while (tary = reg.exec(tc)) {
                            var css = tary[1];
                            if (css) {
                                if (!_root) {
                                    require('less').render('.' + uqfid + '{' + css + '}', function (e, _rtn) {
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
                        while (tary = reg.exec(tc)) {
                            var html = tary[2];
                            if (html) {
                                html = html.replace(/(\s+wx)-(\w+)/gi, function (_ts, _b, _e) {
                                    return _b + ':' + _e;
                                }).replace(/{{([^}]+)}}/gi, function (_ts, _var) {
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
                                }).replace(/(bind|catch)(tap|longtap|touchend|touchcancel|touchmove|touchstart|submit|input|scroll)=(['"])/gi, function (_ts, _m, _t, _quo) {
                                    return _m + _t + '=' + _quo + uuid;
                                })

                                var nss = tary[1];

                                var pt = /xmlns:([\w]+)\s*=['"]([^'"]+)['"]+/ig, t, nsReg = {};
                                while (t = pt.exec(nss)) {
                                    nsReg[t[1]] = t[2];
                                }
                                for (var ns in nsReg) {
                                    //<demo:banner name="aa" id="bb"/>
                                    var nsPath = nsReg[ns], pt = new RegExp('<' + ns + ':(\\w+)((\\s*\\w+\\s*=\\s*[\'"][^\'"]*[\'"])*)\\s*/?>(([\\s\\S]*)</' + ns + ':(\\w+)>)?', 'ig');
                                    html = html.replace(pt, function (_ts, _name, _params) {
                                        var dirPath = _filePath.substring(0, _filePath.lastIndexOf(path.sep));
                                        var libRegPath = path.join(dirPath, nsPath);
                                        var libReg = require(libRegPath);
                                        if (!libReg) {
                                            throw new Error('No lib[path=' + nsPath + '] found.');
                                        }
                                        var impl = libReg[_name];
                                        if (!impl) {
                                            throw new Error('No Component[name=' + _name + '] found in lib[path=' + nsPath + '].');
                                        }
                                        var params = {};
                                        if (_params) {
                                            var tary = _params.trim().split(/\s/g);
                                            tary.forEach(function (_ts) {
                                                if (_ts !== '') {
                                                    var pt = /([\w]+)\s*=['"]([^'"]+)['"]/ig;
                                                    var t = pt.exec(_ts);
                                                    if (t.length >= 3) {
                                                        if (t[2].indexOf('{{') == 0) {
                                                            params[t[1]] = {type: 'var', val: t[2].substring(2, t[2].length - 2)};
                                                        } else {
                                                            params[t[1]] = {type: 'val', val: '"' + t[2] + '"'};
                                                        }
                                                    } else {
                                                        throw new Error('Param[' + _ts + '] format error.');
                                                    }
                                                }
                                            })
                                        }

                                        var implFilePath = path.join(libRegPath.substring(0, libRegPath.lastIndexOf(path.sep)), impl);
                                        var obj = proHtml(implFilePath, path.join(_dirPath, nsPath.substring(0, nsPath.lastIndexOf(path.sep))), params);
                                        if (obj.wxss) {
                                            wxss += obj.wxss;
                                        }
                                        if (obj.script) {
                                            script += obj.script;
                                        }
                                        return obj.wxml;
                                    })
                                }
                                wxml = _root ? html : '<view class="' + uqfid + '">' + html + '</view>';
                            }
                        }

                        reg = /<script[\s\S]*?>([\s\S]+)<\/script>/ig, tary;
                        while (tary = reg.exec(tc)) {
                            var ts = tary[1];
                            if (ts) {
                                var jsPath = _filePath += '.js';

                                var p0 = jsPath.substring(srcPath.length);
                                jsPath = path.join(_tempPath, p0);

                                util.file.create(jsPath);
                                try{
                                    fs.writeFileSync(jsPath, ts);
                                }catch(ex){
                                    console.log(ex);
                                }

                                var fname = jsPath.substring(jsPath.lastIndexOf(path.sep) + 1);
                                script += `
   (function(){
       var f = require('${_dirPath}/${fname}');
        if (f.data) {
            var data = JSON.parse(JSON.stringify(f.data)), param = ${JSON.stringify(_params)};
            if(param){
                for (var k in data) {
                    var tv = param[k];
                    if (typeof tv !== 'undefined') {
                        data[k] = tv;
                    }
                }
            }
            obj.data['${uuid}'] = data;
        }
        if (f.methods) {
            for (var n in f.methods) {
                obj['${uuid}' + n] = function () {
                    f.methods[n].apply(p.call(this, '${uuid}'),Array.prototype.slice.call(arguments));
                }
            }
        }
        if (f.onLoad) {
            lfns.push(function () {
                f.onLoad.call(p.call(this, '${uuid}'));
            });
        }
})();
`;
                            }
                        }

                        return {wxss: wxss, wxml: wxml, script: script};
                    }
                }
                // var dirPath = _filePath.substring(srcPath.length);
                // dirPath = dirPath.substring(0, dirPath.lastIndexOf(path.sep));
                return proHtml(_filePath, '.', {}, true);
            }
        }
    }
}