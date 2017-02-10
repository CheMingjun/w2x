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
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */
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
var rjs = __webpack_require__(22);
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

/***/ },
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */
/***/ function(module, exports) {

/**
 * Created by CheMingjun on 2017/1/16.
 */
module.exports = {
    test: function () {
        console.log(222);
    }
};

/***/ },
/* 10 */
/***/ function(module, exports) {

/**
 * Created by CheMingjun on 2017/1/15.
 */
module.exports = {
    log: function (_msg) {
        console.log('>>>>>' + _msg);
    }
};

/***/ },
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(5);


/***/ },
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */
/***/ function(module, exports, __webpack_require__) {


    var util = __webpack_require__(9);
    module.exports = {
        props: ['btns'],
        methods:{
            btnTap:function(_e){
                console.log(_e);
                util.test();
            }
        }
    }
var _ = {};
                     module.exports._ = _;
                    

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {


    module.exports = {
        props: ['btns', 'title','login'],
        data: {
            name:22,
            items: null
        },
        methods: {
            btnTest:function(_event){
                var tv = this.getProperty('login');
                //tv.call(_event);
//debugger;
                var btns = this.getProperty('btns');
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});

                this.setProperty('btns',btns);
            },
            hdInput: function (_event) {
                this.setData({items: '测试内容'});
            }
        }, onLoad: function () {
            console.log(2222)
            this.setData({
                items: 222
            })
        }
    }
var _ = {};
                                var tm = __webpack_require__(20);
                                _['_befe'] = [tm,{"btns":{"type":"var","val":"btns"}}];
                                if(typeof tm._ ==='object'){
                                    for(var uid in tm._){
                                        _[uid] = tm._[uid];
                                    }
                                }
                                
                     module.exports._ = _;
                    

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {


    var util = __webpack_require__(10);
    module.exports = {
        data: {
            name: '测试变量输出',
            btns: [{name: '按钮1'}]
        }, methods: {
            callMethod: function () {
                var btns = this.data.btns;
                debugger;
                var btns = this.setBtns();
                debugger;
            },
            loginFn: function () {
                var btns = this.data.btns;
                debugger;
                var btns = this.setBtns();
                debugger;
            },
            setBtns: function () {
//                var libs = this.libs;
//
//                var th = this, demoLib = this.libs['demo'];
//                demoLib.login(function (_msg) {
//                    //debugger;
//                    //th.setData({name: _msg});
//                })
//
//                return;
                debugger;
                util.log('添加按钮');

                var btns = this.data.btns;
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});

                this.setData({btns: btns});

                return btns;
            }
        }, onLoad: function () {
            console.log('index.wx.html');
            return;
            var th = this, demoLib = this.libs['demo'];
            demoLib.login(function (_msg) {
                //debugger;
                //th.setData({name: _msg});
            })
        }
    }
var _ = {};
                                var tm = __webpack_require__(21);
                                _['_d541'] = [tm,{"btns":{"type":"var","val":"btns"},"title":{"type":"val","val":"\"banner标题\""},"login":{"type":"method","val":"_.loginFn"}}];
                                if(typeof tm._ ==='object'){
                                    for(var uid in tm._){
                                        _[uid] = tm._[uid];
                                    }
                                }
                                
                     module.exports._ = _;
                    

/***/ }
/******/ ]);
//# sourceMappingURL=index.js.map