# DysonShell —— 一个适合国内中小型网站大前端团队的 node.js web 框架

DysonShell 是由[云信](http://www.creditcloud.com)[王宇（小宇哥）](https://github.com/undoZen)主导开发的适合当前国内环境（仍然需要支持 IE8）下中小型网站大前端团队使用的一款**务实**的基础框架和脚手架开发工具。可供正准备开始使用 [node.js](https://nodejs.org) 做前后端分离方案的技术团队参考选用。

# 展开来解释

* “大前端团队”与前后端分离：用 node.js 做前后端分离在国内为大家知晓可能主要在于阿里工程师在业内的宣传。所谓“大前端团队”就是除了浏览器端开发也需要使用 node.js 做部分服务器端组件的前端团队，这部分组件在服务器架构中的位置处在最前端（或仅次于 HA 组件），仅仅是庞大后端的一层壳，[DysonShell](https://zh.wikipedia.org/wiki/%E6%88%B4%E6%A3%AE%E7%90%83) 的起名也有此寓意。参考文章：[Node.js给前端带来了什么](Node.js给前端带来了什么)
* 中小型网站：任何方案都会有其局限性，本方案的关注点主要是快速上手和引导初学者入门，性能方面主要是受限于选用的 ractive 模板引擎，不做特殊优化可支持上千量级的并发访问，对于一般中小型网站足够。如果您需要支持更高量级，您应该请得起专业的优化团队。
* 务实：我们并没有过多的自造轮子，并且所选用的基础组建（以 express, browserify 为代表）基本上都是业内存在多年、稳定可靠的基础组建。

# 特性与优点

* 开箱即用的覆盖开发、部署生产环节从前到后的体验；
* 前后端支持 CoffeeScript 及 ES6、ES7（babel.js 所支持的特性，不包括浏览器端的 generator 和 async/await）语法
* 扩展 express，支持使用 generator 或 async function 写 middleware 或 router
* 默认后端模板路径查找，在后端使用类 mustache 的 ractive 模板，推荐在前端也配合使用，达到模板的前后端通用
* 多层次的组件打包方案，横向（不同人分开发单一组件各个层次）纵向（不同人在不同层次开发多个组建统一层次）扩展能力；
* 多入口点 CommonJS, ES6 Module 规范的文件引用功能，上线过程中自动打包提取共用部分代码
* 基于文件内容为生产环境静态文件添加版本号

# 缺点或特性

* 还不支持完全的 hot reload（目前仅支持模板文件的 hot reload），也没有 `*.vue` 文件这种方便的写法的文件支持。这些将作为下一个 minor 版本的高优先级计划。

# 安装使用

```bash
node -v # 请确认系统已安装 node v4 或 v5 版本，不支持更低版本，如还没有安装，推荐 nvm 的方式安装
npm install -g ds-cli # npm 国内访问较慢，推荐用 cnpm 或指定 registry
mkdir my-project && cd my-project # 创建并进入新目录
npm init # 按提示创建 package.json 文件，也可以简化为创建一个内容为 {} （空 JSON对象）的 package.json 文件
ds-init # 或 `ds-init` ie8 加 ie8 参数表示生成支持 ie8 的初始代码
npm install
```

# 框架文档

查阅 [wiki](https://github.com/dysonshell/dysonshell/wiki)

# 授权
MIT
