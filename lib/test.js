/**
 * Created by CheMingjun on 2017/1/19.
 */
var path = require('path');
var srcPath = '/Users/CheMingjun/Work/dev/NodeJS';
var toRelativePath = function (_curPath, _reqPath) {
    var cur = _curPath.substring(srcPath.length + 1),
        req = _reqPath.substring(srcPath.length + 1);
    var curAry = cur.split(path.sep), reqAry = req.split(path.sep), tpath = '', rtnPath = '';

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

var cur = path.join(srcPath, '/a/a/aaa/wef/b/c.js'), req = path.join(srcPath, '/a/a/b/lib.js');
var rtn = toRelativePath(cur, req);
console.log(rtn);