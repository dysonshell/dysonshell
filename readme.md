# `@ds/base` - DysonShell 项目的通用基础组建

## 安装使用

已初始化的项目应该已经正确安装和引入这些组件了，具体说明和使用方法如下。

## apiproxy

在开发环境中把 `/api/*` 路径做反向代理到 oauth 服务器，生产环境不需要使用。

## expose

加载 [express-state](https://www.npmjs.com/package/express-state) 并且设置 namespace 为 CC，之后可以在 router 里面调用 `res.expose(123, 'abc')` 这样就可以在浏览器的 JS 代码里面访问全局的 `CC` 对象（当做命名空间）下的 `CC.abc`，值为 123。

另外这里把 `NODE_ENV` 和 `NODE_APP_INSTANCE` 两个环境变量也暴露给浏览器端，以便判断当前运行环境（开发、测试、生产等）

在 `ccc/global/views/layout/default.html` 文件中默认有一下几行，就是添加 `CC` `global` `process` 几个全局变量（关于 template-watch 见 @ccc/template-watch 的文档）

<script>
    window.CC = {};
    {{{ state }}}
    window.global = window.global || window;
    window.process = window.process || CC.process;
    if(process.env.NODE_ENV === 'development'){document.write('<script src="/ccc/template-watch/js/getRactiveTemplate.js"></'+'script>');}
</script>

关于 `res.expose()` 方法的更多详情见 express-state 文档。

## prodrev
上线脚本中把静态文件加上了版本号并且记录到 `web/dist/rev.json` 里面，生产环境读取这个文件，替换服务器返回 html 中的 `/ccc/**` 路径，所以注意静态文件的地址都需要写成 `/ccc/` 开头的绝对路径。

## request
这是给 req 对象 加 req.uest() 这个方法，因为在浏览器端有 cookie，并且可以调用 `/` 开头的绝对路径，而 node 服务器端的 request() 方法需要的 url 是必须带全域名的地址。这个 req.uest() 就是尽量模拟前端的方式，可以调用 req.uest('/api/...') 这样，也会自动加上前端过来的 cookie，所以需要绑定到 req 上作为 req 的一个方法。

## loader

loader 会查找所有的 `ccc/*/router.js` 和 `ccc/*/hook.js` 文件加载，包括 `node_modules/@ccc/*` 下面的 router.js 和 hook.js

### router.js
