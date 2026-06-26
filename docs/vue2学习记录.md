在vue里的数据和函数都是以键值对的形式存在的
函数格式为 ：
function: fucName{  执行的代码}
 js定义函数
    function functionName(parameters) {
		  执行的代码
   }
# 安装
```html
<script src="https://cdn.staticfile.org/vue/2.2.2/vue.min.js"> </script>
```

# 起步
---
每个 Vue 应用都需要通过实例化 Vue 来实现。
语法格式如下：

```js
var vm = new Vue({
  // 选项
})
```
## 构造器内容
```js
var vm = new Vue({
			// 元素id
			el: '#el_id',
			// 数据
			data: {
				site: "菜鸟教程",
				url: "www.runoob.com",
				alexa: "10000"
			},
			// 函数
			methods: {
				details: function() {
					return  this.site + " - 学的不仅是技术，更是梦想！";
				}
			}
		})
<div id="vue_det">
    <h1>site : {{site}}</h1>
    <h1>url : {{url}}</h1>
    <h1>{{details()}}</h1>
</div>

```
可以看到在 Vue 构造器中有一个el 参数，它是 DOM 元素中的 id。在上面实例中 id 为 el_id
```html
<script>
new Vue({
            el: '#app',
            data:{
                message:"hello vue.js"
            }
        })
</script>
<div id="app">
        <p>{{message}}</p>
 </div>
```
这意味着我们接下来的改动全部在以上指定的 div 内，div 外部不受影响。
接下来我们看看如何定义数据对象。
**data** 用于定义属性，实例中有三个属性分别为：site、url、alexa。
methods 用于定义的函数，可以通过 return 来返回函数值。
{{ }} 用于输出对象属性和函数返回值。

---
除了数据属性，Vue 实例还提供了一些有用的实例属性与方法。它们都有前缀 $，以便与用户定义的属性区分开来。例如： (就是区分在vue定义的属性和定义在script定义的属性)
```html
	<div id="vue_det">
		<h1>site : {{site}}</h1>
		<h1>url : {{url}}</h1>
		<h1>Alexa : {{alexa}}</h1>
	</div>
	<script type="text/javascript">
	// 我们的数据对象
	var data = { site: "菜鸟教程", url: "www.runoob.com", alexa: 10000}
	var vm = new Vue({
		el: '#vue_det',
		data: data
	})

	document.write(vm.$data === data) // true
	document.write("<br>")
	document.write(vm.$el === document.getElementById('vue_det')) // true
	</script>
```

# 模板语法
---

## 插值
### 文本
数据绑定最常见的形式就是使用 {{...}}（双大括号）的文本插值：
```html
<div id="app"> 
	<p>{{ message }}</p> 
</div>
```
## html
使用 v-html 指令用于输出 html 代码：既运行插入的代码
```html
<div id="app">
    <div v-html="message"></div>
</div>
	
<script>
new Vue({
  el: '#app',
  data: {
    message: '<h1>菜鸟教程</h1>'
  }
})
</script>
```
## 属性
```html
```
## 表达式
```html
```
## 指令
指令是有缩写的

 v-on 指令，它用于监听 DOM 事件
```js

<!-- 完整语法 -->
<a v-bind:href="url"></a>
<!-- 缩写 -->
<a :href="url"></a>

<!-- 完整语法 -->
<a v-on:click="doSomething"></a>
<!-- 缩写 -->
<a @click="doSomething"></a>
```

```html
 <a v-on:click="doSomething">


<body>
<div id="app">
    <p>{{ message }}</p>
    <button v-on:click="reverseMessage">反转字符串</button>
</div>
	
<script>
new Vue({
  el: '#app',
  data: {
    message: 'Runoob!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
    // js定义函数
    /*function functionName(parameters) {
		  执行的代码
   }*/
  }
})
</script>
</body>
```
## 参数
```html
```

# 循环语句

---
```html
<body>
<div id="app">
  <ol>
    <li v-for="site in sites">
      {{ site.name }}
    </li>
  </ol>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    sites: [
      { name: 'Runoob' },
      { name: 'Google' },
      { name: 'Taobao' }
    ]
  }
})
</script>
</body>

模板中使用 v-for：
<ul> <template v-for="site in sites">
	<li>{{ site.name }}</li> 
	<li>--------------</li> 
</template> </ul>


第二个的参数为键名
<div id="app"> 
	<ul> 
		<li v-for="(value, key) in object"> {{ key }} : {{ value }} </li> 
	</ul> 
</div>

第三个参数为索引：
<div id="app"> 
	<ul>
		 <li v-for="(value, key, index) in object"> {{ index }}. {{ key }} : {{ value }} </li> 
	</ul> 
</div>

也可以循环整数
<div id="app"> <ul> <li v-for="n in 10"> {{ n }} </li> </ul> </div>
```


## 计算属性
计算属性关键词: computed。

---
```html
<body>
<div id="app">
  <p>原始字符串: {{ message }}</p>
  <p>计算后反转字符串: {{ reversedMessage }}</p>
</div>

<script>
var vm = new Vue({
  el: '#app',
  data: {
    message: 'Runoob!'
  },
  computed: {
    // 计算属性的 getter
    reversedMessage: function () {
      // `this` 指向 vm 实例
      return this.message.split('').reverse().join('')
    }
  }
})
</script>
</body>
```

## computed vs methods

可以使用 methods 来替代 computed，效果上两个都是一样的，但是 computed 是基于它的依赖缓存，只有相关依赖发生改变时才会重新取值。而使用 methods ，在重新渲染的时候，函数总会重新调用执行。可以说使用 computed 性能会更好，但是如果你不希望缓存，你可以使用 methods 属性。
```html
<body>
<div id="app">
  <p>原始字符串: {{ message }}</p>
  <p>计算后反转字符串: {{ reversedMessage }}</p>
  <p>使用方法后反转字符串: {{ reversedMessage2() }}</p>
</div>

<script>
var vm = new Vue({
  el: '#app',
  data: {
    message: 'Runoob!'
  },
  computed: {
    // 计算属性的 getter
    reversedMessage: function () {
      // `this` 指向 vm 实例
      return this.message.split('').reverse().join('')
    }
  },
  methods: {
    reversedMessage2: function () {
      return this.message.split('').reverse().join('')
    }
  }
})
</script>
</body>
```
computed 属性默认只有 getter ，不过在需要时你也可以提供一个 setter ：
```html
<body>
<div id="app">
  <p>{{ site }}</p>
</div>

<script>
var vm = new Vue({
  el: '#app',
  data: {
	name: 'Google',
	url: 'http://www.google.com'
  },
  computed: {
    site: {
      // getter
      get: function () {
        return this.name + ' ' + this.url
      },
      // setter
      set: function (newValue) {
        var names = newValue.split(' ')
        this.name = names[0]
        this.url = names[names.length - 1]
      }
    }
  }
})
// 调用 setter， vm.name 和 vm.url 也会被对应更新
vm.site = '菜鸟教程 http://www.runoob.com';
document.write('name: ' + vm.name);
document.write('<br>');
document.write('url: ' + vm.url);
</script>
</body>
```
![[Pasted image 20230209221018.png]]

# 监听属性
---


```html
<body>
<div id = "app">
 <p style = "font-size:25px;">计数器: {{ counter }}</p>
 <button @click = "counter=counter+2" style = "font-size:25px;">点我</button>
</div>
<script type = "text/javascript">
 var vm = new Vue({
    el: '#app',
    data: {
       counter: 1
    }
 });
 // 这里的回调函数第一个参数为counter的变化后的值第二个为变化前的值
 vm.$watch('counter', function(nval, oval) {
    alert('计数器值的变化 :' + oval + ' 变为 ' + nval + '!');
 });
</script>
</body>
```

这段代码展示了vue里面的基本构成
```html
<body>
      <div id = "computed_props">
         千米 : <input type = "text" v-model = "kilometers">
         米 : <input type = "text" v-model = "meters">
      </div>
	   <p id="info"></p>
      <script type = "text/javascript">
         var vm = new Vue({
            el: '#computed_props',
            data: {
               kilometers : 0,
               meters:0
            },
            methods: {
            },
            computed :{
            },
            watch : {
               kilometers:function(val) {
                  this.kilometers = val;
                  this.meters = this.kilometers * 1000
               },
               meters : function (val) {
                  this.kilometers = val/ 1000;
                  this.meters = val;
               }
            }
         });
         // $watch 是一个实例方法
		vm.$watch('kilometers', function (newValue, oldValue) {
			// 这个回调将在 vm.kilometers 改变后调用
		    document.getElementById ("info").innerHTML = "修改前值为: " + oldValue + "，修改后值为: " + newValue;
		})
      </script>
   </body>
```

# 样式绑定
isActive为true所以会运行出一个红色的方块
可以在对象中_**传入更多属性**_ 用来动态切换多个 class
```html
<style>
.active {
	width: 100px;
	height: 100px;
	background: green;
}
.text-danger {
	background: red;
}
</style>
</head>
<body>
<div id="app">
  <div v-bind:class="{ 'active': isActive, 'text-danger': hasError }"></div>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    isActive: true,
	hasError: true
  }
})
</script>
</body>
```

可以直接绑定数据里的一个对象
这里因为text-danger为false所以上面的样式也不会被加载，既效果为红色的方块
```html
<style>
.active {
	width: 100px;
	height: 100px;
	background: green;
}
.text-danger {
	background: red;
}
</style>
</head>
<body>
<div id="app">
  <div v-bind:class="classObject"></div>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    classObject: {
      active: true,
      'text-danger': false
    }
  }
})
</script>
</body>
```

绑定返回对象的计算属性。这是一个常用且强大的模式
这段代码展示了很多要素
```html
<style>
.base {
  width: 100px;
  height: 100px;
}

.active {
  background: green;
}

.text-danger {
  background: red;
}
</style>
<body>
<div id="app">
  <div v-bind:class="classObject"></div>
</div>
<script>

new Vue({
  el: '#app',
  data: {
    isActive: true,
    error: {
      value: true,
      type: 'fatal'
    }
  },
  computed: {
    classObject: function () {
      return {
		  base: true,
	        active: this.isActive && !this.error.value,
	        'text-danger': this.error.value && this.error.type === 'fatal',
	    }
    }
}
})
</script>
</body>
```

### 数组语法
可以把一个数组传给 **v-bind:class** ，实例如下：
```html
<style>
.active {
	width: 100px;
	height: 100px;
	background: green;
}
.text-danger {
	background: red;
}
</style>
</head>
<body>
<div id="app">
	<div v-bind:class="[activeClass, errorClass]"></div>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    activeClass: 'active',
    errorClass: 'text-danger'
  }
})
</script>
</body>

进阶版本
---------------------------------------------------------------------------------------
<style>
.text-danger {
	width: 100px;
	height: 100px;
	background: red;
}
.active {
	width: 100px;
	height: 100px;
	background: green;
}
</style>
</head>
<body>
<div id="app">
	<div v-bind:class="[errorClass ,isActive ? activeClass : '']"></div>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    isActive: true,
	activeClass: 'active',
    errorClass: 'text-danger'
  }
})
</script>
</body>
```

也可以直接设置样式
直接设置样式的值没有用
```html
<div id="app">
	<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }">菜鸟教程</div>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    activeColor: 'green',
	fontSize: 30
  }
})
</script>

```

也可以绑定到一个对象上
两种方式
```html
<div id="app">
  <div v-bind:style="styleObject">菜鸟教程</div>
  <div v-bind:style="[baseStyles, overridingStyles]">菜鸟教程</div>
  
</div>

<script>
new Vue({
  el: '#app',
  data: {
    baseStyles: {
      color: 'green',
      fontSize: '30px'
    },
	overridingStyles: {
      'font-weight': 'bold'
    }
  }
})
</script>
```

# 事件处理器

---
## v-on
事件监听
```HTML
<div id="app">
  <button v-on:click="counter += 1">增加 1</button>
  <p>这个按钮被点击了 {{ counter }} 次。</p>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    counter: 0
  }
})
</script>
```

通常情况下，我们需要使用一个方法来调用 JavaScript 方法。

v-on 可以接收一个定义的方法来调用。
```HTML
<div id="app">
   <!-- `greet` 是在下面定义的方法名 -->
  <button v-on:click="greet">Greet</button>
</div>

<script>
var app = new Vue({
  el: '#app',
  data: {
    name: 'Vue.js'
  },
  // 在 `methods` 对象中定义方法
  methods: {
    greet: function (event) {
      // `this` 在方法里指当前 Vue 实例
      alert('Hello ' + this.name + '!')
      // `event` 是原生 DOM 事件
	  if (event) {
		  alert(event.target.tagName)
	  }
    }
  }
})
// 也可以用 JavaScript 直接调用方法
app.greet() // -> 'Hello Vue.js!'
</script>
```

除了直接绑定到一个方法，也可以用内联 JavaScript 语句：
```html
<body>
<div id="app">
  <button v-on:click="say('hi')">Say hi</button>
  <button v-on:click="say('what')">Say what</button>
</div>

<script>
new Vue({
  el: '#app',
  methods: {
    say: function (message) {
      alert(message)
    }
  }
})
</script>
</body>
```

## 事件修饰符
```html
<!-- 阻止单击事件冒泡 -->
<a v-on:click.stop="doThis"></a>
<!-- 提交事件不再重载页面 -->
<form v-on:submit.prevent="onSubmit"></form>
<!-- 修饰符可以串联  -->
<a v-on:click.stop.prevent="doThat"></a>
<!-- 只有修饰符 -->
<form v-on:submit.prevent></form>
<!-- 添加事件侦听器时使用事件捕获模式 -->
<div v-on:click.capture="doThis">...</div>
<!-- 只当事件在该元素本身（而不是子元素）触发时触发回调 -->
<div v-on:click.self="doThat">...</div>

<!-- click 事件只能点击一次，2.1.4版本新增 -->
<a v-on:click.once="doThis"></a>
```

# 表单
---

可以把v-model当作表单的value属性  重点在于双向绑定
用 v-model 指令在表单控件元素上创建双向数据绑定。
v-model 会根据控件类型自动选取正确的方法来更新元素。
```html
<body>
<div id="app">
  <p>input 元素：</p>
  <input v-model="message" placeholder="编辑我……">
  <p>消息是: {{ message }}</p>
	
  <p>textarea 元素：</p>
  <p style="white-space: pre">{{ message2 }}</p>
  <textarea v-model="message2" placeholder="多行文本输入……"></textarea>
</div>

<script>
new Vue({
  el: '#app',
  data: {
    message: 'Runoob',
	message2: '菜鸟教程\r\nhttp://www.runoob.com'
  }
})
</script>
</body>
```

# 组件
---
注册一个全局组件语法格式如下：
> Vue.component(tagName, options)

tagName 为组件名，options 为配置选项。注册后，我们可以使用以下方式来调用组件：
```html
<tagName></tagName>

<body>
<div id="app">
	<runoob>dawd</runoob>
</div>

<script>
// 注册
Vue.component('runoob', {
  template: '<h1>自定s义组件!</h1>'
})
// 创建根实例
new Vue({
  el: '#app'
})
</script>
</body>
```

v-bind是单向传递的无法双向绑定
```html

<body>
<div id="app">
	<div>
	  <input v-model="parentMsg">
	  <br>
	  <child v-bind:message="parentMsg"></child>
	</div>
</div>

<script>
// 注册
Vue.component('child', {
  // 声明 props
  props: ['message'],
  // 同样也可以在 vm 实例中像 “this.message” 这样使用
  template: '<span>{{ message }}</span>'
})
// 创建根实例
new Vue({
  el: '#app',
  data: {
	parentMsg: '父组件内容'
  }
})
</script>
</body>
```

#  路由
下载 https://unpkg.com/vue-router/dist/vue-router.js

## 简单实例

Vue.js + vue-router 可以很简单的实现单页应用。

**router-link**是一个组件，该组件用于设置一个导航链接，切换不同 HTML 内容。 **to** 属性为目标地址， 即要显示的内容。

以下实例中我们将 vue-router 加进来，然后配置组件和路由映射，再告诉 vue-router 在哪里渲染它们。代码如下所示：
```html
<script src="https://unpkg.com/vue/dist/vue.js"></script> 
<script src="https://unpkg.com/vue-router/dist/vue-router.js"></script> 
<div id="app"> 
	<h1>Hello App!</h1> 
	<p> 
		<!-- 使用 router-link 组件来导航. --> 
		<!-- 通过传入 `to` 属性指定链接. --> 
		<!-- <router-link> 默认会被渲染成一个 `<a>` 标签 --> 
		<router-link to="/foo">Go to Foo</router-link> 
		<router-link to="/bar">Go to Bar</router-link>
	 </p> <!-- 路由出口 --> <!-- 路由匹配到的组件将渲染在这里 -->
	 <router-view></router-view> 
</div>
```


# vue-cli
---
这是官方提供的脚手架能快速构建项目
