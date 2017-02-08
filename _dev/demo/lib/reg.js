var env = require('./env');
module.exports = function (_api) {
    var reg = _api.reg({
        coms: {
            "banner": "./banner.wx.html",
            "toolbar": "./toolbar.wx.html"
        }
        ,pages: ['./login.wx.html']
    });

    return {
        login: function (_fn) {
            var lfn = function(){
                var path = reg.pages['./login.wx.html'];
                wx.navigateTo({
                    url: path
                })
            }
            wx.getStorage({
                key:"login",
                success: function(res) {
                    var dt = res.data;
                    if(!dt){
                        lfn();
                    }
                },fail:function(){
                    lfn();
                }
            })
        }
    }
}