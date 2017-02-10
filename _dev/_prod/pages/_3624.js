module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ({

/***/ 12:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(3);


/***/ },

/***/ 19:
/***/ function(module, exports) {


    module.exports = {
        data: {
            countryName: '中国',
            notLogin: false
        },
        methods: {
            submit: function (_obj) {
                wx.login({
                    success: function (rs1) {
                        var code = rs1.code;
                        wx.setStorage({
                            key:"login",
                            data:code
                        })
                        debugger;
                        wx.navigateBack();
                    }
                });
            },onLoad:function(){
                debugger;
            }
        }
    }
var _ = {};
                     module.exports._ = _;
                    

/***/ },

/***/ 3:
/***/ function(module, exports, __webpack_require__) {


var obj = { data: {} },
    p = function (_id, _params) {
    var th = this,
        to = {
        data: {},
        setData: function (_obj) {
            var o = {};
            o[_id] = _obj;
            var ori = th.data[_id];
            for (var nm in ori) {
                if (typeof _obj[nm] === 'undefined') {
                    _obj[nm] = ori[nm];
                }
            }
            th.setData(o);
        }, getProperty: function (_k) {
            var t = _params[_k];
            if (t) {
                if (t.type === 'var') {
                    if (t.val.charAt(0) === '"') {
                        return t.val.substring(1, t.val.length - 1);
                    } else if (t.val.indexOf('.') !== -1) {
                        var tt = t.val.split('.');
                        if (tt.length === 2) {
                            var ttt = th.data[tt[0]];
                            return typeof ttt === 'object' ? ttt[tt[1]] : null;
                        }
                    }
                    throw new Error('Error type of property[' + _k + '].');
                } else if (t.type === 'method') {
                    var mn = t.val.replace(/\./g, '');
                    return th[mn];
                }
            }
        }, setProperty: function (_k, _v) {
            var t = _params[_k];
            if (t) {
                if (t.type === 'var') {
                    if (t.val.indexOf('.') !== -1) {
                        var tt = t.val.split('.');
                        if (tt.length === 2) {
                            var to = {};
                            var tto = to[tt[0]] = {};
                            tto[tt[1]] = _v;
                            var ori = th.data[tt[0]];
                            for (var nm in ori) {
                                if (typeof tto[nm] === 'undefined') {
                                    tto[nm] = ori[nm];
                                }
                            }
                            th.setData(to);
                            return;
                        }
                    }
                }
                throw new Error('Error type of property[' + _k + '].');
            }
        }
    };
    var t = this.data[_id];
    if (t) {
        for (var nm in t) {
            to.data[nm] = t[nm];
        }
    }
    to.libs = getApp().__;
    to.__proto__ = this;

    var f = th[_id];
    if (f) {
        if (f.methods) {
            for (var n in f.methods) {
                (function (n) {
                    to[n] = function () {
                        return th[_id + n].apply(th, Array.prototype.slice.call(arguments));
                    };
                })(n);
            }
        }
    }

    return to;
},
    lfns = [];
var rjs = __webpack_require__(19);
var _ = rjs._;
_['_'] = [rjs];
for (var uid in _) {
    (function (_uid, _m) {
        var f = _m[0],
            params = _m[1] || null;
        obj[_uid] = f;
        if (f.data) {
            obj.data[_uid] = f.data;
        }
        if (f.methods) {
            for (var n in f.methods) {
                (function (n) {
                    obj[_uid + n] = function () {
                        return f.methods[n].apply(p.call(this, _uid, params), Array.prototype.slice.call(arguments));
                    };
                })(n);
            }
        }
        if (f.onLoad) {
            lfns.push(function () {
                f.onLoad.call(p.call(this, _uid, params));
            });
        }
    })(uid, _[uid]);
}
console.log(rjs);

if (lfns.length > 0) {
    obj.onLoad = function () {
        var th = this;
        lfns.forEach(function (_fn) {
            _fn.call(th);
        });
    };
}
Page(obj);

/***/ }

/******/ });
//# sourceMappingURL=_3624.js.map