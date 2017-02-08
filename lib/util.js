/**
 * Created by CheMingjun on 2016/12/28.
 */
var fs = require('fs'), path = require('path');

var ptnExp = function (_anno) {
    return new RegExp("\\s+(//|['\"])@" + _anno
        + "\\s*\(\\([^)]*\\)\)?(['\"]\\s*[;\r])?\\s*(var|let)\\s*(\\S+)\\s*=?\\s*(function\\s*(\\*?)\\s*\\(([^)]*)\\))?\\s*({|;)", 'ig')
}, proAnno = function (anno, content, _fn, _filePath) {
    var append = [];
    content.replace(ptnExp(anno), function (_str, _b, _annoArgs, _e, _letVar, _varName, _funcSig, _gen, _args, _bodyB, _position) {
        if (_letVar === 'let') {
            throw new Error('"Let"(' + _letVar + ' ' + _varName + ') can not be describe in a annotation in file[' + _filePath + ']');
        }
        let ctx = {
            filePath: _filePath,
            name: anno,
            refName: _varName,
            refType: _gen && _gen === '*' ? 'generator' : (_funcSig ? 'function' : (_bodyB === '{' ? 'object' : 'undefined')),
            defType: _letVar
        };
        if (_annoArgs) {
            _annoArgs = _annoArgs.trim();
            if (_annoArgs != '') {
                let desc = {}, t = _annoArgs.substring(1, _annoArgs.length - 1).split('&');//url style,split by '&'
                t.forEach(function (_a) {
                    let tt = _a.split('=');
                    if (tt.length != 2) {
                        throw new Error('The arguments in annotation error in file[' + _filePath + ']');
                    }
                    desc[tt[0].trim()] = tt[1].trim();
                })
                ctx['desc'] = desc;
            }
        }
        let args = [ctx], parg = [];
        if (_args) {
            _args = _args.trim();
            if (_args != '') {
                let t = _args.split(',');
                t.forEach(function (_a) {
                    let tt = _a.split('=');
                    if (tt.length == 1) {
                        parg.push(_a);
                    } else if (tt.length == 2) {
                        parg.push(tt[0]);
                    } else {
                        throw new Error('The arguments error in function[' + _varName + '] in file[' + _filePath + ']');
                    }
                })
            }
        }
        if (parg.length > 0) {
            args.push(parg);
        }
        let rtn = _fn.apply(this, args);
        //let rtn = _gennerator === '*' ? _func.apply(this, args).next().value : _func.apply(this, args);
        if (typeof rtn === 'string') {
            append.push(_letVar + ' ' + _varName + ' = ' + rtn);
            return rtn;
        }
        return _str;
    })

    return content + '\n' + append.join('\n');
}

//-----------------------------------------------------------------------------------------

module.exports = {
    uuid: function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return '_' + (S4());
    },
    exec: function (cmd, opts) {
        return function (done) {
            require('child_process').exec(cmd, opts, function (err, stdout, stderr) {
                done(err ? err : stderr ? new Error(stderr) : null, stdout);
            });
        }
    },
    path: {
        relative: function (_curPath, _reqPath) {
            _curPath = /\.\w+$/g.test(_curPath) ? _curPath : _curPath + '/_._';
            var curAry = _curPath.split(path.sep), reqAry = _reqPath.split(path.sep), tpath = '', rtnPath = '';

            for (var ti = 0; ti < curAry.length; ti++) {
                if (curAry[ti] === reqAry[ti]) {
                    continue;
                } else {
                    for (var tti = ti; tti < curAry.length - 1; tti++) {
                        rtnPath += '../';
                    }
                    tpath = reqAry.slice(ti, reqAry.length - 1).join(path.sep);
                    break;
                }
            }

            rtnPath = rtnPath === '' ? './' : rtnPath;
            return (rtnPath + tpath + path.sep + reqAry[reqAry.length - 1]).replace(/\/+/g, '/');
        }
    },
    file: {
        create: function (_path) {
            return function (_cb) {
                var ary = _path.split(path.sep);
                var mode = 0o755;
                if (ary[0] === "." || ary[0] === path.sep) {
                    ary.shift();
                }
                if (ary[0] == "..") {
                    ary.splice(0, 2, ary[0] + path.sep + ary[1])
                }
                function inner(cur) {
                    var file;
                    if (ary.length > 0) {
                        try {
                            if (!fs.existsSync(cur)) {
                                fs.mkdirSync(cur, mode)
                            }
                        } catch (ex) {
                            _cb(ex);
                        }
                        inner(cur + path.sep + ary.shift());
                    } else {
                        if (/\.\w+$/.test(cur)) {//file
                            file = fs.openSync(cur, "w");
                            _cb(null, file);
                        } else {
                            if (!fs.existsSync(cur)) {
                                fs.mkdirSync(cur, mode);
                            }
                            _cb();
                        }
                    }
                }

                ary.length && inner(path.sep + ary.shift());
            }
        },
        remove: function (_path) {
            return function (_cb) {
                if (fs.existsSync(_path)) {
                    fs.stat(_path, function (_err, _stat) {
                        if (_err) {
                            return _cb(_err);
                        }
                        var pro;
                        if (_stat.isDirectory()) {
                            pro = require('child_process').spawn('rm', ['-rf', _path]);
                        } else {
                            pro = require('child_process').spawn('rm', ['-f', _path]);
                        }

                        pro.stdout.on('data', function (data) {
                        });
                        pro.stdout.on('end', function (data) {
                            _cb();
                        });
                        pro.stderr.on('data', function (data) {
                            _cb(new Error(data));
                        });
                        pro.on('exit', function (code) {
                            if (code != 0) {
                                _cb(new Error(code));
                            }
                        });
                    });
                } else {
                    _cb();
                }
            }
        },
        copy(_src, _dist) {
            return function (_cb) {
                fs.stat(_src, function (_err, _stat) {
                    if (_err) {
                        return _cb(_err);
                    }
                    var pro;
                    if (_stat.isDirectory()) {
                        pro = require('child_process').spawn('cp', ['-r', _src, _dist]);
                    } else {
                        pro = require('child_process').spawn('cp', [_src, _dist]);
                    }

                    pro.stdout.on('data', function (data) {
                    });
                    pro.stdout.on('end', function (data) {
                        _cb();
                    });
                    pro.stderr.on('data', function (data) {
                        _cb(new Error(data));
                    });
                    pro.on('exit', function (code) {
                        if (code != 0) {
                            _cb(new Error(code));
                        }
                    });
                });
            }
        }, search: function (_dirPath, _extName, _excludeAry) {
            var ary = [], fn = function (_path) {
                if (_excludeAry) {
                    if (_excludeAry.some(function (_now) {
                            return _now === _path;
                        })) {
                        return;
                    }
                }
                var stats = fs.statSync(_path);
                if (stats.isFile()) {
                    if (path.extname(_path).toLowerCase() === _extName) {
                        ary.push(_path);
                    }
                } else if (stats.isDirectory()) {
                    fs.readdirSync(_path).map(function (child) {
                        fn(path.join(_path, child));
                    });
                }
            }
            fn(_dirPath);
            return ary;
        }
    }, proAnno
}