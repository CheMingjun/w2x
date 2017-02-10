var pages = {};//保存注册的页面对象
module.exports = {
    components: {//注册组件
        "banner": "./banner.wx.html",
        "toolbar": "./toolbar.wx.html"
    },
    pages: {//注册页面
        './login.wx.html': function (_path) {
            pages['login'] = _path;
        }
    },
    api: {//暴露给业务的API
        login: function (_fn) {
            var lfn = function () {
                var path = pages['login'];//使用引用进行页面导航
                wx.navigateTo({
                    url: path
                })
            }
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
            })
        }
    }
}