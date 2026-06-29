---
title: Nginx
description: Nginx 反向代理、负载均衡、配置管理学习笔记
---

# 正向代理，代理的是客户端
## 倾向保护客户
### 正向代理

```
客户端  -->  代理服务器  -->  目标服务器
         (代理客户端)        (不知道客户端)
```

比如公司内网通过一台代理上网，目标服务器只知道代理的 IP，不知道真正请求的是谁

# 反向代理，代理的是服务器
## 倾向保护服务器（负载均衡）
### 反向代理

```
客户端  -->  Nginx  -->  服务器A
                   -->  服务器B
         (不知道后端)     (隐藏真实服务器)
```

客户端只知道 Nginx 的地址，不知道背后是哪台服务器处理的请求

ps -ef | grep nginx

## Nginx提供的负载均衡策略有2种：内置策略和扩展策略。内置策略为轮询，加权轮询，Ip hash。

### 轮询
一台服务器一条请求轮换

```
请求1  -->  服务器A
请求2  -->  服务器B
请求3  -->  服务器A
请求4  -->  服务器B
```

### 加权轮询
根据权重分配，权重高的服务器处理更多请求

```
服务器A weight=1  -->  请求1  请求4  请求7  ...
服务器B weight=2  -->  请求2  请求3  请求5  请求6  ...
```

### Ip hash
对客户端 IP 做 hash，相同 IP 始终分配到同一台服务器，解决 session 不共享的问题

```
客户端A(IP:1.1.1.1)  -->  服务器A（所有请求）
客户端B(IP:2.2.2.2)  -->  服务器B（所有请求）
```

# nginx配置文件结构
---


```c
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }

    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}
```

```
...              #全局块

events {         #events块
   ...
}

http      #http块
{
    ...   #http全局块
    server        #server块
    { 
        ...       #server全局块
        location [PATTERN]   #location块
        {
            ...
        }
        location [PATTERN] 
        {
            ...
        }
    }
    server
    {
      ...
    }
    ...     #http全局块
}
```
-   1、**全局块**：配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，允许生成worker process数等。
-   2、**events块**：配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。
-   3、**http块**：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件，连接超时时间，单连接请求数等。
-   4、**server块**：配置虚拟主机的相关参数，一个http中可以有多个server。
-   5、**location块**：配置请求的路由，以及各种页面的处理情况。

## events
---

### accept_mutex
accept_mutex用来设置网络链接序列化
默认值为 on
这个配置可以用来解决常说的“惊群”问题。就是客户发来一个请求，多个worker进程会被唤醒

### multi_accept
用来设置是否允许同时接受多个网络链接
默认值 off
如果multi_accept被禁止了，nginx一个worker进程同时只能接受一个新的请求，反之一个worker进程可以同时接受多个请求

### worker_connections_number
用来配置单个worker进程的最大连接数
默认值 512
数值不能大于操作系统支持打开的最大文件句柄数量

### use
用来设置nginx服务器选择哪种事件驱动处理网络消息
默认值  根据操作系统定
这个配置使nginx优化的重要配置，方法可选值有 select/poll/epoll/kqueue等

## http
---
http块里可以放多个server块
### default_type
浏览器可以显示的有html, xml, Gif 等种类繁多的文件。为了区分这些资源就需要使用MIME Type.
默认值：text/plain
可以在 http块， server块， location块进行配置
在default_type前有一句include mime.types想当与把mime.types文件中的MIME类型与相关文件的文件后缀名的对应关系加载到当前的配置文件中

#### 实战
有时候需要一些接口返回固定的文本或json，如果逻辑非常简单或者就是固定的字符串，那么就可以使用nginx实现。减少服务器资源
```shell
location /get_text {
	# 这里可以设置成text/plain
	default_type text/html;
	# 这个返回的字符串与default_type的值有关
	return 200 "{‘name’:‘tom’, ‘age’:‘10’}";
}
```

## server和location
server块可以放多个location块

```shell
server {
		# 这两个组成了url的前半部分
        listen       80;  # 监听端口
        server_name  localhost;  # 

        #charset koi8-r;

        #access_log  logs/host.access.log  main;
		# 这个组成了url的后半部分
        location / {
            root   html;  # 资源所对应的目录
            index  index.html index.htm; # 访问/ 时返回的 index.html index.htm这俩都需要放在root对应的文件里才能访问
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
}
```
#### root  alias

`root` 和 `alias` 都能指定资源路径，区别在于路径拼接方式：

```
# root：localtion 路径 + root 路径
location /static/ {
    root /var/www/html;
}
# 访问 /static/1.jpg 实际找 /var/www/html/static/1.jpg

# alias：直接用 alias 路径替换 location 路径
location /static/ {
    alias /var/www/files/;
}
# 访问 /static/1.jpg 实际找 /var/www/files/1.jpg
```

简单说：`root` 会带上 location 的路径，`alias` 不会。



### server块里的listen属性

当url匹配不到时，nginx会找到第一个出现的server块作为服务
但是添加了defaylt_server属性的server会作为默认的

```
server {
		# 在这里添加defaylt_server属性
        listen       80 defaylt_server;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }
}
```



# 配置实战
配置多个url

---
在 http 块头部写上这一句话来引入外部配置文件：

```nginx
include /home/conf/*.conf;
```

`/home/conf/` 路径下的一个配置文件示例：

```nginx
server {
    listen       8080;
    server_name  api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
    }
}

server {
    listen       8081;
    server_name  static.example.com;

    location / {
        root /data/static;
    }
}
```

这样每个 server 独立一个文件，方便管理和维护。



# Nginx 负载均衡配置实战
---

## 热备
解决服务器突然挂掉的问题
1、热备：如果你有2台服务器，当一台服务器发生事故时，才启用第二台服务器给提供服务。服务器处理请求的顺序：AAAAAA突然A挂啦，BBBBBBBBBBBBBB.....

```
upstream mysvr { 
    server 127.0.0.1:7878; 
    server 192.168.10.121:3333 backup;  #热备     }
```

## 轮询：

nginx默认就是轮询其权重都默认为1，服务器处理请求的顺序：ABABABABAB....

```
upstream mysvr { 
    server 127.0.0.1:7878;
    server 192.168.10.121:3333;       
}
```

## 加权轮询：
跟据配置的权重的大小而分发给不同服务器不同数量的请求。如果不设置，则默认为1。下面服务器的请求顺序为：ABBABBABBABBABB....

```
upstream mysvr { 
    server 127.0.0.1:7878 weight=1;
    server 192.168.10.121:3333 weight=2;
}
```

## ip_hash:

nginx会让相同的客户端ip请求相同的服务器。

```
upstream mysvr { 
    server 127.0.0.1:7878; 
    server 192.168.10.121:3333;
    ip_hash;
}

```


# nginx 动/静资源概述
---
## 静态资源
既在服务器端真实存在并且能拿来展示的一些文件，比如html文件，css文件，js文件，图片，视频等

## 动态资源
既程序员所写的接口返回的json

## 处理静态资源考虑一下问题
>(1) 静态资源的配置指令
>(2) 静态资源的配置优化
>(3) 静态资源的压缩配置指令
>(4) 静态资源的缓存处理
>(5) 静态资源的访问控制，包括跨域问题和防盗链问题

# nginx命令

---
## 检查配置文件是否出错

```shell
nginx -t
```

## 重新加载配置文件
重新加载前先用以上命令检查配置文件是否出错
```shell
nginx -s reload
```