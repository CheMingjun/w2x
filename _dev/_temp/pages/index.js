
var obj = {data: {}}, p = function (_id,_params) {
    var th = this, to = {
        data:{},
        setData: function (_obj) {
            var o = {};
            o[_id] = _obj;
            var ori = th.data[_id];
            for(var nm in ori){
                if(typeof _obj[nm]==='undefined'){
                    _obj[nm] = ori[nm];
                }
            }
            th.setData(o);
        },getProperty:function(_k){
            var t = _params[_k];
            if(t){
                if(t.type==='var'){
                    if(t.val.charAt(0)==='"'){
                        return t.val.substring(1,t.val.length-1);
                    }else if(t.val.indexOf('.')!==-1){
                        var tt = t.val.split('.');
                        if(tt.length===2){
                            var ttt = th.data[tt[0]];
                            return typeof ttt==='object'?ttt[tt[1]]:null;
                        }
                    }
                    throw new Error('Error type of property['+_k+'].');
                }else if(t.type==='method'){
                    var mn = t.val.replace(/\./g,'');
                    return th[mn];
                }
            }
        },setProperty:function(_k,_v){
            var t = _params[_k];
            if(t){
                if(t.type==='var'){
                    if(t.val.indexOf('.')!==-1){
                        var tt = t.val.split('.');
                        if(tt.length===2){
                            var to = {};
                            var tto = to[tt[0]] = {};
                            tto[tt[1]] = _v;
                            var ori = th.data[tt[0]];
                            for(var nm in ori){
                                if(typeof tto[nm]==='undefined'){
                                    tto[nm] = ori[nm];
                                }
                            }
                            th.setData(to);
                            return;
                        }
                    }
                }
                throw new Error('Error type of property['+_k+'].');
            }
        }
    };
    var t = this.data[_id];
    if(t){
        for(var nm in t){
            to.data[nm] = t[nm];
        }
    }
    to.libs = getApp().__;
    to.__proto__ = this;
    
    var f = th[_id];
    if(f){
        if (f.methods) {
            for (var n in f.methods) {
                (function(n){
                    to[n] = function () {
                        return th[_id+n].apply(th,Array.prototype.slice.call(arguments));
                    }
                 })(n);
            }
        }
    }
    
    return to;
}, lfns = [];
var rjs = require('/Users/CheMingjun/Work/dev/NodeJS/VD1.0/w2x/_dev/demo/pages/index.wx.html');
var _ = rjs._;
_['_'] = [rjs];
for(var uid in _){
       (function(_uid,_m){
       var f = _m[0],params = _m[1]||null;
       obj[_uid] = f;
        if (f.data) {
            obj.data[_uid] = f.data;
        }
        if (f.methods) {
            for (var n in f.methods) {
                (function(n){
                    obj[_uid + n] = function () {
                        return f.methods[n].apply(p.call(this, _uid,params),Array.prototype.slice.call(arguments));
                    }
                 })(n);
            }
        }
        if (f.onLoad) {
            lfns.push(function () {
                f.onLoad.call(p.call(this, _uid,params));
            });
        }
})(uid,_[uid]);
}
console.log(rjs);

if(lfns.length>0){
    obj.onLoad = function(){
        var th = this;
        lfns.forEach(function(_fn){
            _fn.call(th);
        });
    }
}
Page(obj);
                