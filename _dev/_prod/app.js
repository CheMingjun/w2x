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
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ function(module, exports) {

var pages = {}; //保存注册的页面对象
module.exports = {
    components: { //注册组件
        "banner": "./banner.wx.html",
        "toolbar": "./toolbar.wx.html"
    },
    pages: { //注册页面
        './login.wx.html': function (_path) {
            pages['login'] = _path;
        }
    },
    api: { //暴露给业务的API
        login: function (_fn) {
            var lfn = function () {
                var path = pages['login']; //使用引用进行页面导航
                wx.navigateTo({
                    url: path
                });
            };
            wx.getStorage({
                key: "login",
                success: function (res) {
                    var dt = res.data;
                    if (!dt) {
                        lfn();
                    }
                }, fail: function () {
                    lfn();
                }
            });
        }
    }
};

/***/ },

/***/ 11:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(2);


/***/ },

/***/ 2:
/***/ function(module, exports, __webpack_require__) {

var __ = {};(function () {
    var param = { "pages": { "pages/_3624": "_3624" } },
        r = __webpack_require__(1);
    if (r.api) {
        if (typeof r.pages === 'object') {
            for (var pt in r.pages) {
                r.pages[pt](param.pages[pt]);
            }
        }
        __["demo"] = r.api;
    }
})();
(function () {
    var param = { "pages": { "pages/_5594": "_5594" } },
        r = __webpack_require__(1);
    if (r.api) {
        if (typeof r.pages === 'object') {
            for (var pt in r.pages) {
                r.pages[pt](param.pages[pt]);
            }
        }
        __["demo1"] = r.api;
    }
})();

App({

    __: __
});

/***/ }

/******/ });
//# sourceMappingURL=app.js.map