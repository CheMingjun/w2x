# W2X
>面向组件开发的微信小程序开发框架 | 脚手架

W2X框架致力于以"自定义组件"的方式快速开发微信小程序，这些自定义组件以组件库的形式进行组织。
一个使用W2X组件库的页面代码举例如下：
> W2X提供了wx.html文件格式把css\dom\js聚合在一个文件中


```html
<style lang="less" rel="stylesheet/less">
    .abc {
        background-color: red;
    }
</style>
<template xmlns:demo="demo">
    <button class="abc" bindtap="setBtns">{{name}}222</button>
    <demo:banner btns="{{btns}}"  title="banner标题" :login="loginFn"/>
</template>
<script>
    var util = require('../util.js');
    module.exports = {
        data: {
            name: '点击添加按钮',
            btns: [{name: '按钮1'}]
        }, methods: {
            loginFn: function () {
                var btns = this.data.btns;
                debugger;
                this.setBtns();
            },
            setBtns: function () {
                var btns = this.data.btns;
                btns.push({name: '按钮12'});
                btns.push({name: '按钮12'});
                this.setData({btns: btns});
            }
        }, onLoad: function () {
            console.log('index.wx.html');
            var th = this, demoLib = this.libs['demo'];
            demoLib.login(function (_msg) {
                //debugger;
                //th.setData({name: _msg});
            })
        }
    }
</script>
  ```
  
## 1、组件库的开发
一个典型的W2X组件库的形式如下
```
\-reg.js  组件库对外暴露的注册js文件【必要】
\-banner.wx.html 组件文件【非必要】(.wx.html为自定义文件类型)
\-util.js 库所依赖的其他文件【非必要】
  ```
reg.js的代码
```js
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
```
banner.wx.html代码
```html
<style lang="less" rel="stylesheet/less">
    .buy-items {
        display: -webkit-flex;
        display: flex;
        border-bottom: 1px solid #eee;

        .buy-items-label {
            display: inline-block;
            padding-right: 10px;
            line-height: 80px;
        }

        .buy-items-value {
            -webkit-flex: 1;
            flex: 1;
            height: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
</style>
<template xmlns:demo="./*">
    <button bindtap="btnTest">登录跳转</button>
    <view class="buy-items">
        <view class="buy-items-label">{{title}}</view>
        <input type="text" class="buy-items-value" placeholder="items参数" bindinput="hdInput" value="{{btns.length}}"/>
    </view>
    <demo:toolbar btns="{{btns}}"/>
</template>
<script>
    module.exports = {
        props: ['btns', 'title','login'],//该组件所声明的属性
        data: {
            name:22,
            items: null
        },
        methods: {//对应处理事件的function写在methods中
            btnTest:function(_event){
                var tv = this.getProperty('login');
                tv.call(_event);
            },
            hdInput: function (_event) {
                this.setData({items: '测试内容'});
            }
        }, onLoad: function () {//组件的生命周期方法（执行时机与Page的onload等同）
            this.setData({
                items: 222
            })
        }
    }
</script>
```

## 2、组件库的使用
### 在app.json中注册该组件库
```json
{
  "libs": {
    "demo": "./lib/reg.js"
  },
  "pages": [
    "pages/index"
  ]
}
```
上例中，W2X扩展了libs属性作为组件库的注册入口，其中，demo为组件库的名称（可以任意定义），对应的value为组件库的js文件路径。


接下来
### 在wx.html文件中使用组件库
```html
<template xmlns:demo="demo">
    <button class="abc" bindtap="setBtns">{{name}}222</button>
    <demo:banner btns="{{btns}}"  title="标题" :login="loginFn"/>
</template>
  ```
上例中，通过xmlns:demo="demo"声明了使用的组件库（当前案例demo为在app.json中声明的组件库），
组件使用的具体格式为：

<组件库名称:组件名称  属性列表/>

其中，属性的值可以有三种：
1. 当前页面中data中的值，通过{{}}引用；
2. 普通值，比如 title="标题"；
3. 当前页面methods中的函数，通过**属性前加:**表示，比如 :login="loginFn"；
