/**
 * Created by CheMingjun on 2017/1/19.
 */
var logined = false;
module.exports = {
    setLogon: function (_v) {
        logined = _v;
    }, isLogon: function () {
        return logined;
    }
}