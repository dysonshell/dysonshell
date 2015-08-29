# `@ds/base` - DysonShell 项目的通用基础组建

## 安装使用

已初始化的项目应该已经正确安装和引入这些组件了，具体说明和使用方法如下（以下说明中所有路径都是在项目的 `/web` 目录下）。

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

loader 会查找所有的 `ccc/*/router.js` 和 `ccc/*/hook.js` 文件加载，包括 `node_modules/@ccc/*` 下面的 router.js 和 hook.js。有其中之一则加载，两个都存在则先加载 router.js 后加载 hook.js。也可以都没有，这时候可以将组件用作[简单放置静态页面](http://gitlab.creditcloud.com/ccfe/public-docs/wikis/simple-page)。

开发页面的一般步骤是：

1. 创建模块目录，如登录模块是 `ccc/login`，模块名为 login 也决定了新页面只能在 `/login` 下开发，参考文档 http://gitlab.creditcloud.com/ccfe/public-docs/wikis/ds
2. 按路径规则添加服务器端模板和 CSS、图片等静态文件，此时可以使用 getRactiveTemplate 及 chrome devtools 创建简单的 ractive 组件，可参考视频 http://www.tudou.com/programs/view/xtyQxMZMDs8/
3. 添加 hook.js 给服务器端生成的模板添加动态变量，或者添加 ajax 接口，复杂逻辑可以添加 router.js
4. 修改浏览器端 js 完成交互行为

### router.js

ds 代码是分模块组织的，同一个模块相关的所有文件（CSS、图片等静态资源、前后端的 JS 文件、HTML 模板等）都放到同一个模块下，如登录模块在 `ccc/login` 个人账户相关在 `ccc/account` 等。服务器端的 JS 代码基于 express，在 router.js 文件可以添加对应模块的 url 下页面返回的处理逻辑。

router.js 文件示例如下：

```js
'use strict';
module.exports = function (router) {
    router.get('/about/company', function (req, res, next) {
        // 处理 req 和 res，之后 next() 或 res.render()...
    });
};
```

即这个文件输出一个函数，loader 加载它时代码的调用是类似 `app.use(require('ccc/about/router')(express.Router()));` 这样。稍有不同在于，loader 加载的 router url 只能以模块名开头，如在 `ccc/about/router.js` 内，只能处理 `/about/` 路径下的请求，并且这里面的 router 不能使用 `router.use()` 方法，这是因为模块的加载顺序不定，为了避免处理相同的 url 会有冲突发生难以预料的 bug。

如果要添加全局的 middleware（要使用 use 方法或者要对所有请求预先做一些处理），那么可以在 `index.js` 文件内直接在 app 对象上添加。

### hook.js

可以在 router.js 里用 `router.get('/account/bank', function (req, res, next) {})` 这样的方法给 `/account/bank` 这个页面添加变量，不过绝大多数的页面处理逻辑都是调用后端接口获取数据后稍作处理再设置 `res.locals` 对象的属性，最后调用 res.render() 方法生成页面。ds 的 hooker 机制把这些常用操作做了封装，一般这种需求的页面逻辑处理就给 url 添加一个 hook 即可，如

```js
hook.get('/account/bank', function (data, expose) {
    var bankCards = data.bankCards();
    expose('bankCards', bankCards);
    return {
        locals: {
            bankCards: bankCards,
        },
    };
});
```

这样就将获取到的银行卡信息写入了服务器端模板变量（通过返回对象的 locals 属性），也 expose 到了浏览器端 JS 代码中（在 CC.bankCards 上取到）。

类似于 router.js，hook.js 的内容应该是这样：

```js
'use strict';
module.exports = function (hook) {
    hook.get('/account/bank', function (reqParams, reqQuery, data, expose) {
        // 调用 data.xx(), expose 等方法，返回
    });
};
```

第一个参数同 router，是字符串或正则表达式，第二个参数是一个函数，其参数会被注入相应的功能，应该返回一个特定格式的对象。

#### hook 的依赖注入

hook 函数由参数名称决定注入的对象，与 angular 的依赖注入机制类似。通过参数的变量名来决定内部可以使用哪些功能，如前面使用了 reqParams, reqQuery, data 和 expose 这几个变量，而再前面一个例子只用了 data 和 expose 两个，这些变量值有可能是需要获取的信息，也可能是可以调用的功能模块。

有以下变量可以使用：

* reqQuery - 即 req.query，如访问 url 参数为 ?a=1&b=2 则 reqQuery 为 `{a:1, b:2}`
* reqParams - 即 req.params，如 `hook.get('/loan/:loanId', function (reqParams) { //...` 这里假设访问了 /loan/123 这样 reqParams 就是 `{loanId: '123'}` （值都是字符串）
* reqPath - 即 req.path，如访问 /loan/123?a=1&b=2 就是 `'/loan/123'`
* reqUrl - 即 req.url 与 reqPath 的不同是会带 search 部分，如 `'/loan/123&a=1&b=2'` 这样，是完整的
* request - 即 req.uest，见本文档前面 request 的部分
* data - 已封装了数据请求的 data 对象，具体见 @ds/data 的文档
* body - 即 req.body，下文详述
* locals - 即 res.locals，也可以使用返回对象的 locals 来设置，下文详述
* expose - 调用 `expose('a.b.c', 123)` 相当于在 router 中调用 `res.expose(123, 'a.b.c')`，之后可以在浏览器端的 JS 中访问到 CC.a.b.c 值为 123。见前文 expose 部分，详细参考 express-state 的文档。
* redirect - 最后函数的返回 `return redirect('/redirectedUrl', 301)` 此页面就会跳转，第二个参数为返回的 HTTP status code，没有的话默认为 302
* next - 等同于 {next: true} 这样一个简单的对象，可以方便地 `return next;` 意义在下面 hook 函数返回解释

##### body

body 在非 GET, HEAD 的请求中用，一般是 POST 或 PUT 方法。会获取到浏览器发送过来的数据。如

```js
hook.post('/account/profile', function (body, request, redirect) {
    return request('POST', '/api/v2/xxx', { body: body })
        .then(function (r) {
            return redirect('/account/profile/saved');
        });
});
```

##### locals

这个变量是 res.locals 对象，如果给它赋值，如 `locals.abc = 123`，则在服务器端模板（在 views 目录下的 html 文件）里可以使用 `{{abc}}` 这个变量，输出显示为 123。

使用 locals 也可以取到之前的 router 给其赋的值，最常用的可能是 `locals.user`，如果是已登录用户，前面就回处理好登录状态，将当前登录用户的信息写在 `locals.user` 这个对象上。

##### expose

locals 对象的属性会成为服务器端模板的变量，而如果要在浏览器端模板 JS 代码里（如用在浏览器端模板上）使用服务器端这里的变量，就需要 `expose()`。

比如有以下 hook 函数内的代码：

```js
locals.abc = 123;
expose('abc', 456);
```

这样在服务器端模板中 `{{abc}}` 会展示为 123，而在前端的 JS 里 `CC.abc` 变量的值为 456，要使用到浏览器端模板的话，就是

```js
var exampleRactive = new Ractive({
    el: '#someWrapper',
    template: getRactiveTemplate('ccc/example/partials/temp.html'),
    data: {
        abc: CC.abc,
    },
});
```

这样，不过一般来说相同的变量名后端 locals 与暴露给前端的值都应该是一样的。

#### hook 函数返回

hook 函数应该返回一个对象，这个对象的不同属性表示了应该返回给前端怎样的页面。

为了支持异步，这个对象也可以是 promise 包裹的。如前面 body 的例子中，要用 request 做请求，返回结果是异步的。request 的返回是 promise，调用 then 方法即使用它的值并且产生了新的 promise，这个 then 里返回的 redirect() 函数的结果会让页面最终返回 302 做页面跳转。

返回对象的属性都是可选的，如下：

##### next

如果是 true，就先不返回页面，而是进入到下一个符合 url 规则的 hook，如

```js
hook.all(/^\/account(\/.*)?$/, function (locals, next) {
    locals.isInAccount = true;
    return next; // 这里 next 是 {next: true}
});

##### redirect

如果是字符串，就会默认返回 302 做跳转，跳转页面地址为这个字符串。也可以是一个数组，数组的第一个值是数字 301 或 302，第二个值是要跳转的地址。如果没有 redirect 属性，则返回正常页面。依赖注入的 redirect 函数也就是把 `redirect('/abc', 301)` 这样的调用转成 `{redirect: [301, '/abc']}` 这样一个对象。

##### locals

locals 如果是一个对象，它的自有属性会成为服务器端模板的变量，如果 view 设置成了 false，就会返回这个 locals 对象的 json。

##### exposed

exposed 对象的属性会加到在浏览器端的 CC 全局变量对象上。

##### view

view 属性用来设置返回的 html 模板。如果没设置 view，则自动寻找 url 对应的模板，如果设置了 view 就以 view 为优先。如果是 false，就不生成 html，将 locals 属性的内容返回为 json。

##### layout

默认值是 'ccc/global/views/layout/default.html`，可以改成另外的 layout 模板，如果设置为 false，则取消 layout，输出的内容为 view 里面的 html。如果有 layout，则会将 layout 里面的 `#main-container` 这个 div 里面内容替换为 view 指定的模板的内容。
