---
title: Docker
description: Docker 容器化技术学习笔记，从基础命令到生产环境部署实践
---

# docker run

Docker 允许你在容器内运行应用程序， 使用 **docker run** 命令来在容器内运行一个应用程序。
输出Hello world
```bash
kkzz@kkzz-VirtualBox:~$ sudo docker run ubuntu:15.10 /bin/echo "Hello world"

Unable to find image 'ubuntu:15.10' locally

15.10: Pulling from library/ubuntu

7dcf5a444392: Downloading  19.26MB/51.07MB

7dcf5a444392: Pull complete 

759aa75f3cee: Pull complete 

3fa871dc8a2b: Pull complete 

224c42ae46e7: Pull complete 

Digest: sha256:02521a2d079595241c6793b2044f02eecf294034f31d6e235ac4b2b54ffc41f3

Status: Downloaded newer image for ubuntu:15.10

Hello world

```
参数解析
- docker: Docker的二进制执行文件。
- run: 与前面的docker组合起来运行一个容器
- ubuntu:15.10 指定要运行的镜像，Docker首先在本地主机上检查镜像是否存在，如果不存在，docker会从远程仓库下载公共镜像
- /bin/echo "Hello world"： 在启动的容器里执行的命令

## 运行交互式的容器

```bash
kkzz@kkzz-VirtualBox:~$ sudo docker run -i -t ubuntu:15.10

root@be2d94b6b6b5:/# ls

bin   dev  home  lib64  mnt  proc  run   srv  tmp  var

boot  etc  lib   media  opt  root  sbin  sys  usr

root@be2d94b6b6b5:/# 
```

参数解析
- -t： 在容器内指定一个伪终端或终端
- -i： 允许你对容器内的标准输(STDIN)入进行交互
`root@be2d94b6b6b5:/# ` 注意这行，此时已经进入容器

### 退出交互式容器

使用 ctrl+d或者 exit命令即可退出容器，注意第三行表示我们已经退出容器
```bash
root@be2d94b6b6b5:/# exit

exit

kkzz@kkzz-VirtualBox:~$ 
```

**注意以上允许容器，退出容器后，容器就关闭了 sudo docker ps可查看docker进程信息**


## 以后台模式启动容器(退出容器后不会关闭)

### 注意第二行，这是容器的id -d 表示后台运行
这里如果启动后没有一个进程，这个容器会被直接关闭的，即必须要有一个运行的进程
```bash
kkzz@kkzz-VirtualBox:~$ sudo docker run -d ubuntu:15.10 /bin/bash -c "while true;do echo hello world; sleep 1; done"

891f1e5a2e86a7fba85735437f5fa61646b9615ecdcebb7de34f7535da7ad266

kkzz@kkzz-VirtualBox:~$ 


```

### sudo docker ps 查看docker容器进程信息

这里的CONTAINER ID 没有这么短，这里只显示了前部分，这里之所以与上半部分不同，是因为笔者运行第一个容器的时候忘记运行这个命令了
```bash
kkzz@kkzz-VirtualBox:~$ sudo docker ps

CONTAINER ID   IMAGE          COMMAND                   CREATED         STATUS         PORTS     NAMES

de554b81a578   ubuntu:15.10   "/bin/bash -c 'while…"   3 seconds ago   Up 2 seconds             romantic_snyder

kkzz@kkzz-VirtualBox:~$ 
```
输出详情：
CONTAINER ID：容器ID

IMAGE：使用的镜像

COMMAND：启动容器时运行的命令

CREATED：容器的创建时间

STATUS：容器状态
状态有7种：
- created(已创建)
- restaring（重启中）
- running或 UP（运行中）
- removing（迁移中）
- paused（暂停）
- exited（停止）
- dead（死亡）

PORTS: 容器的端口信息和使用的连接类型(tcp\\udpp).
NAMES：自动分配的容器名称



### 在宿主机内使用`docker logs` ，查看容器内的标准输出
```bash
kkzz@kkzz-VirtualBox:~$ sudo docker logs 891f1e5a2e86a7fba8573
# 或这个命令
kkzz@kkzz-VirtualBox:~$ sudo docker logs romantic_snyder


hello world

hello world

hello world

hello world

hello world

hello world

hello world

hello world

hello world

```

### 停止容器
```bash
kkzz@kkzz-VirtualBox:~$ sudo docker stop 891f1e5a2e86a7
# 或者这个命令
kkzz@kkzz-VirtualBox:~$ sudo docker stop romantic_snyder


891f1e5a2e86a7fba85735437f5fa61646b9615ecdcebb7de34f7535da7ad266

kkzz@kkzz-VirtualBox:~$ sudo docker ps

CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

kkzz@kkzz-VirtualBox:~$ 


```


# 容器数据卷

---

docker的理念是将应用和环境打包成一个镜像，数据是没有存储的，容器删除数据也就没看有了。

==现在的需求是：数据可以持久化==
原理：目录的挂载，将容器内的目录挂载到系统目录


# 使用 Dockerfile 定制镜像
Dockerfile 是一个文本文件，其内包含了一条条的 **指令(Instruction)**，每一条指令构建一层，因此每一条指令的内容，就是描述该层应当如何构建。

还以之前定制 `nginx` 镜像为例，这次我们使用 Dockerfile 来定制。

在一个空白目录中，建立一个文本文件，并命名为 `Dockerfile`：

$ mkdir mynginx

$ cd mynginx

$ touch Dockerfile

其内容为：

FROM nginx

RUN echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html

这个 Dockerfile 很简单，一共就两行。涉及到了两条指令，`FROM` 和 `RUN`。

## 

FROM 指定基础镜像[](#from-zhi-ding-ji-chu-jing-xiang)

所谓定制镜像，那一定是以一个镜像为基础，在其上进行定制。就像我们之前运行了一个 `nginx` 镜像的容器，再进行修改一样，基础镜像是必须指定的。而 `FROM` 就是指定 **基础镜像**，因此一个 `Dockerfile` 中 `FROM` 是必备的指令，并且必须是第一条指令。

在 [Docker Hub](https://hub.docker.com/search?q=&type=image&image_filter=official) 上有非常多的高质量的官方镜像，有可以直接拿来使用的服务类的镜像，如 [`nginx`](https://hub.docker.com/_/nginx/)、[`redis`](https://hub.docker.com/_/redis/)、[`mongo`](https://hub.docker.com/_/mongo/)、[`mysql`](https://hub.docker.com/_/mysql/)、[`httpd`](https://hub.docker.com/_/httpd/)、[`php`](https://hub.docker.com/_/php/)、[`tomcat`](https://hub.docker.com/_/tomcat/) 等；也有一些方便开发、构建、运行各种语言应用的镜像，如 [`node`](https://hub.docker.com/_/node)、[`openjdk`](https://hub.docker.com/_/openjdk/)、[`python`](https://hub.docker.com/_/python/)、[`ruby`](https://hub.docker.com/_/ruby/)、[`golang`](https://hub.docker.com/_/golang/) 等。可以在其中寻找一个最符合我们最终目标的镜像为基础镜像进行定制。

如果没有找到对应服务的镜像，官方镜像中还提供了一些更为基础的操作系统镜像，如 [`ubuntu`](https://hub.docker.com/_/ubuntu/)、[`debian`](https://hub.docker.com/_/debian/)、[`centos`](https://hub.docker.com/_/centos/)、[`fedora`](https://hub.docker.com/_/fedora/)、[`alpine`](https://hub.docker.com/_/alpine/) 等，这些操作系统的软件库为我们提供了更广阔的扩展空间。

除了选择现有镜像为基础镜像外，Docker 还存在一个特殊的镜像，名为 `scratch`。这个镜像是虚拟的概念，并不实际存在，它表示一个空白的镜像。

FROM scratch

...

如果你以 `scratch` 为基础镜像的话，意味着你不以任何镜像为基础，接下来所写的指令将作为镜像第一层开始存在。

不以任何系统为基础，直接将可执行文件复制进镜像的做法并不罕见，对于 Linux 下静态编译的程序来说，并不需要有操作系统提供运行时支持，所需的一切库都已经在可执行文件里了，因此直接 `FROM scratch` 会让镜像体积更加小巧。使用 [Go 语言](https://golang.google.cn/) 开发的应用很多会使用这种方式来制作镜像，这也是有人认为 Go 是特别适合容器微服务架构的语言的原因之一。

## 

RUN 执行命令[](#run-zhi-hang-ming-ling)

`RUN` 指令是用来执行命令行命令的。由于命令行的强大能力，`RUN` 指令在定制镜像时是最常用的指令之一。其格式有两种：

- _shell_ 格式：`RUN <命令>`，就像直接在命令行中输入的命令一样。刚才写的 Dockerfile 中的 `RUN` 指令就是这种格式。
    

RUN echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html

- _exec_ 格式：`RUN ["可执行文件", "参数1", "参数2"]`，这更像是函数调用中的格式。
    

既然 `RUN` 就像 Shell 脚本一样可以执行命令，那么我们是否就可以像 Shell 脚本一样把每个命令对应一个 RUN 呢？比如这样：

FROM debian:stretch

RUN apt-get update

RUN apt-get install -y gcc libc6-dev make wget

RUN wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz"

RUN mkdir -p /usr/src/redis

RUN tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1

RUN make -C /usr/src/redis

RUN make -C /usr/src/redis install

之前说过，Dockerfile 中每一个指令都会建立一层，`RUN` 也不例外。每一个 `RUN` 的行为，就和刚才我们手工建立镜像的过程一样：新建立一层，在其上执行这些命令，执行结束后，`commit` 这一层的修改，构成新的镜像。

而上面的这种写法，创建了 7 层镜像。这是完全没有意义的，而且很多运行时不需要的东西，都被装进了镜像里，比如编译环境、更新的软件包等等。结果就是产生非常臃肿、非常多层的镜像，不仅仅增加了构建部署的时间，也很容易出错。 这是很多初学 Docker 的人常犯的一个错误。

_Union FS 是有最大层数限制的，比如 AUFS，曾经是最大不得超过 42 层，现在是不得超过 127 层。_

上面的 `Dockerfile` 正确的写法应该是这样：

FROM debian:stretch

RUN set -x; buildDeps='gcc libc6-dev make wget' \

&& apt-get update \

&& apt-get install -y $buildDeps \

&& wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \

&& mkdir -p /usr/src/redis \

&& tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \

&& make -C /usr/src/redis \

&& make -C /usr/src/redis install \

&& rm -rf /var/lib/apt/lists/* \

&& rm redis.tar.gz \

&& rm -r /usr/src/redis \

&& apt-get purge -y --auto-remove $buildDeps

首先，之前所有的命令只有一个目的，就是编译、安装 redis 可执行文件。因此没有必要建立很多层，这只是一层的事情。因此，这里没有使用很多个 `RUN` 一一对应不同的命令，而是仅仅使用一个 `RUN` 指令，并使用 `&&` 将各个所需命令串联起来。将之前的 7 层，简化为了 1 层。在撰写 Dockerfile 的时候，要经常提醒自己，这并不是在写 Shell 脚本，而是在定义每一层该如何构建。

并且，这里为了格式化还进行了换行。Dockerfile 支持 Shell 类的行尾添加 `\` 的命令换行方式，以及行首 `#` 进行注释的格式。良好的格式，比如换行、缩进、注释等，会让维护、排障更为容易，这是一个比较好的习惯。

此外，还可以看到这一组命令的最后添加了清理工作的命令，删除了为了编译构建所需要的软件，清理了所有下载、展开的文件，并且还清理了 `apt` 缓存文件。这是很重要的一步，我们之前说过，镜像是多层存储，每一层的东西并不会在下一层被删除，会一直跟随着镜像。因此镜像构建时，一定要确保每一层只添加真正需要添加的东西，任何无关的东西都应该清理掉。

很多人初学 Docker 制作出了很臃肿的镜像的原因之一，就是忘记了每一层构建的最后一定要清理掉无关文件。

## 

构建镜像[](#gou-jian-jing-xiang)

好了，让我们再回到之前定制的 nginx 镜像的 Dockerfile 来。现在我们明白了这个 Dockerfile 的内容，那么让我们来构建这个镜像吧。

在 `Dockerfile` 文件所在目录执行：

$ docker build -t nginx:v3 .

Sending build context to Docker daemon 2.048 kB

Step 1 : FROM nginx

---> e43d811ce2f4

Step 2 : RUN echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html

---> Running in 9cdc27646c7b

---> 44aa4490ce2c

Removing intermediate container 9cdc27646c7b

Successfully built 44aa4490ce2c

从命令的输出结果中，我们可以清晰的看到镜像的构建过程。在 `Step 2` 中，如同我们之前所说的那样，`RUN` 指令启动了一个容器 `9cdc27646c7b`，执行了所要求的命令，并最后提交了这一层 `44aa4490ce2c`，随后删除了所用到的这个容器 `9cdc27646c7b`。

这里我们使用了 `docker build` 命令进行镜像构建。其格式为：

docker build [选项] <上下文路径/URL/->

在这里我们指定了最终镜像的名称 `-t nginx:v3`，构建成功后，我们可以像之前运行 `nginx:v2` 那样来运行这个镜像，其结果会和 `nginx:v2` 一样。

## 

镜像构建上下文（Context）[](#jing-xiang-gou-jian-shang-xia-wen-context)

如果注意，会看到 `docker build` 命令最后有一个 `.`。`.` 表示当前目录，而 `Dockerfile` 就在当前目录，因此不少初学者以为这个路径是在指定 `Dockerfile` 所在路径，这么理解其实是不准确的。如果对应上面的命令格式，你可能会发现，这是在指定 **上下文路径**。那么什么是上下文呢？

首先我们要理解 `docker build` 的工作原理。Docker 在运行时分为 Docker 引擎（也就是服务端守护进程）和客户端工具。Docker 的引擎提供了一组 REST API，被称为 [Docker Remote API](https://docs.docker.com/develop/sdk/)，而如 `docker` 命令这样的客户端工具，则是通过这组 API 与 Docker 引擎交互，从而完成各种功能。因此，虽然表面上我们好像是在本机执行各种 `docker` 功能，但实际上，一切都是使用的远程调用形式在服务端（Docker 引擎）完成。也因为这种 C/S 设计，让我们操作远程服务器的 Docker 引擎变得轻而易举。

当我们进行镜像构建的时候，并非所有定制都会通过 `RUN` 指令完成，经常会需要将一些本地文件复制进镜像，比如通过 `COPY` 指令、`ADD` 指令等。而 `docker build` 命令构建镜像，其实并非在本地构建，而是在服务端，也就是 Docker 引擎中构建的。那么在这种客户端/服务端的架构中，如何才能让服务端获得本地文件呢？

这就引入了上下文的概念。当构建的时候，用户会指定构建镜像上下文的路径，`docker build` 命令得知这个路径后，会将路径下的所有内容打包，然后上传给 Docker 引擎。这样 Docker 引擎收到这个上下文包后，展开就会获得构建镜像所需的一切文件。

如果在 `Dockerfile` 中这么写：

COPY ./package.json /app/

这并不是要复制执行 `docker build` 命令所在的目录下的 `package.json`，也不是复制 `Dockerfile` 所在目录下的 `package.json`，而是复制 **上下文（context）** 目录下的 `package.json`。

因此，`COPY` 这类指令中的源文件的路径都是_相对路径_。这也是初学者经常会问的为什么 `COPY ../package.json /app` 或者 `COPY /opt/xxxx /app` 无法工作的原因，因为这些路径已经超出了上下文的范围，Docker 引擎无法获得这些位置的文件。如果真的需要那些文件，应该将它们复制到上下文目录中去。

现在就可以理解刚才的命令 `docker build -t nginx:v3 .` 中的这个 `.`，实际上是在指定上下文的目录，`docker build` 命令会将该目录下的内容打包交给 Docker 引擎以帮助构建镜像。

如果观察 `docker build` 输出，我们其实已经看到了这个发送上下文的过程：

$ docker build -t nginx:v3 .

Sending build context to Docker daemon 2.048 kB

...

理解构建上下文对于镜像构建是很重要的，避免犯一些不应该的错误。比如有些初学者在发现 `COPY /opt/xxxx /app` 不工作后，于是干脆将 `Dockerfile` 放到了硬盘根目录去构建，结果发现 `docker build` 执行后，在发送一个几十 GB 的东西，极为缓慢而且很容易构建失败。那是因为这种做法是在让 `docker build` 打包整个硬盘，这显然是使用错误。

一般来说，应该会将 `Dockerfile` 置于一个空目录下，或者项目根目录下。如果该目录下没有所需文件，那么应该把所需文件复制一份过来。如果目录下有些东西确实不希望构建时传给 Docker 引擎，那么可以用 `.gitignore` 一样的语法写一个 `.dockerignore`，该文件是用于剔除不需要作为上下文传递给 Docker 引擎的。

那么为什么会有人误以为 `.` 是指定 `Dockerfile` 所在目录呢？这是因为在默认情况下，如果不额外指定 `Dockerfile` 的话，会将上下文目录下的名为 `Dockerfile` 的文件作为 Dockerfile。

这只是默认行为，实际上 `Dockerfile` 的文件名并不要求必须为 `Dockerfile`，而且并不要求必须位于上下文目录中，比如可以用 `-f ../Dockerfile.php` 参数指定某个文件作为 `Dockerfile`。

当然，一般大家习惯性的会使用默认的文件名 `Dockerfile`，以及会将其置于镜像构建上下文目录中。