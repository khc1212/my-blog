# 初识sql
---

```sql
-- 每一行sql语句都是以;结尾的

-- 库 --> 文件夹
 
-- 表 --> 文件
-- 记录(数据) --> 文件里面的一行行数据

show databases;  -- 查看所有数据库
\s -- 查看数据库字符编码以及其他信息
\c -- 结束当前语句
exit/quit -- 退出连接


+--------------------+
| Database           |
+--------------------+
| information_schema |  虚拟数据库存在内存里，存放启动信息-数据类型、权限等等
| mysql              |  授权表，改密码就是改这里面的信息
| performance_schema |  提供一些性能监控和诊断功能可用来分析数据库性能
| sys                |  数据库引擎扩展库
+--------------------+
```

## 操作库
---

```sql
-- 增 
create database database_name;
create database database_name charset=utf8; -- 推荐
create database if not exists database_name charset=utf8; -- 推荐

-- 删
drop database database_name

-- 改
alter database database_name charset=utf8;

-- 查
show databases; -- 查看所有数据库
show create database database_name -- 查一个，查看创建这个数据库的sql语句
```


## 操作表
---

```sql
select database(); -- 查看当前所在数据库
use database_name; -- 切换数据库

--增
create table table_name(id int, name char); --创建表(默认的字符编码，就是库的编码)
create table table_name(id int, name char)charset=utf8; --创建表

--删
drop table table_name; -- 删除table_name表

-- 改
alter table table_name modify name char(4); -- 修改字段类型
alter table table_name change name Name char(5); -- 修改字段名字加类型

-- 查
show tables; -- 查看当前库下的所有的表
show create teble table_name; -- 查看创建表的sql语句
describe table_name; -- 查看表结构


-- 所有对表的操作，都可以用绝对路径的方式，这样即便不切换数据库，也可以操作数据库对应的表
create table database_name.table_name(id int, name char);
```



## 操作记录
---
```sql
-- 增
insert into table_name values(1, "流浪地球"); -- 插入一条
insert into table_name values(1, "流浪地球"),(2,"三体"); -- 插入多条

-- 删
delete from table_name where name="三体"; -- 将name=三体字段删除

-- 改
update table_name set name="满江红" where id=1; -- 将id=1的记录的name字段改成"满江红"

-- 查
select * from table_name; -- 查table_name中的所有数据
select id,name from table_name; --查询table_name表所有数据的id和name字段
select user,host from database_name.table_name; -- 查询table_name表的所有数据的user和host字段

```

## sql语句分类

#sql语句类型

| 类型 | 描述                                           | 关键字                 |
| ---- | ---------------------------------------------- | ---------------------- |
| DDL  | 数据库定义语言，用来定义和管理数据库或者数据表 | create, alter, drop    |
| DML  | 数据库操作语言，用来操作数据                   | insert，update，delete |
| DQL  | 数据库查询语言，用来查询数据                   | select                 |
| DCL     |   数据库控制语言，控制权限                      |grant, revoke, commit, rollback                        |

# 库操作语法
---
```sql
[] 表示可选
-- ## 增 
create database [if not exists] <库名> [charset=utf8]; -- 推荐

-- 删
drop database  [if exists] <库名>;

-- 改
alter database <库名> charset=utf8;

-- 查
show databases; -- 查看所有数据库
show create database <库名>; -- 查一个，查看创建这个数据库的sql语句
```

# 表操作

查看数据库引擎
```sql
show engines;
create table table_name(id int, name char)engine=inoodb;
```

| Engine             | Support | Comment                          | Transactions | XA   | Savepoints |
| ------------------ | ------- | -------------------------------------------------------------- | --------- | ---------------------- | ---------------------- |
| MEMORY             | YES     | Hash based, stored in memory, useful for temporary tables      | NO           | NO   | NO         |
| MRG_MYISAM         | YES     | Collection of identical MyISAM tables                          | NO           | NO   | NO         |
| CSV                | YES     | CSV storage engine                                             | NO           | NO   | NO         |
| FEDERATED          | NO      | Federated MySQL storage engine                                 | NULL         | NULL | NULL       |
| PERFORMANCE_SCHEMA | YES     | Performance Schema                                             | NO           | NO   | NO         |
| MyISAM             | YES     | MyISAM storage engine                                          | NO           | NO   | NO         |
| InnoDB             | DEFAULT | Supports transactions, row-level locking, and foreign keys     | YES          | YES  | YES        |
| BLACKHOLE          | YES     | /dev/null storage engine (anything you write to it disappears) | NO           | NO   | NO         |
| ARCHIVE            | YES     | Archive storage engine                                         | NO           | NO   | NO         |

## 创建表语法

```SQL
create table <表名> (
    <字符类型1> [ (宽度) ] [约束条件], 
    <字符类型2> [ (宽度) ] [约束条件], 
    <字符类型3> [ (宽度) ] [约束条件], 
    <字符类型4> [ (宽度) ] [约束条件1 约束条件2] -- 最后一行不能有“ , “ 会报错
);
-- 宽度指的是字符长度，关闭严格模式后，即便宽度超了，也可以插进去（截取字符，不推荐）
```

## 修改表语法

```sql
-- 修改存储引擎
alter table <表名> engine=<存储引擎名字>;

-- 修改表名
alter table <表名> rename <新表名>;

-- 增加字段
-- 添加字段，字段自动添加到最后一个
alter table <表名> add <字段名> <字段类型>[(宽度)] [(约束条件)] [first];
-- 添加字段，字段添加到after指定的字段名后面
alter table <表名> add <字段名> <字段类型>[(宽度)] [(约束条件)] [after <字段名>];

-- 删除字段
alter table <表名> drop <字段名>;

-- 修改字段
alter table <表名> modify <字段名> <新字段类型> [(宽度)] [(约束条件)]; -- 修改类型
alter table <表名> change <旧字段名> <新字段名> <新字段类型> [(宽度)] [(约束条件)]; -- 修改
```


## 删除和复制表语法

```sql
-- 删除
drop table <表名>;

-- 复制表
-- 执行后会将旧表的所有数据存入新表中（两个表结构是一样的）
create table <新表名> select * from <旧表名> [条件]; 
-- 执行后会将字段1，字段2的数据存入新表，新表的结构只有字段1，字段2。
create table <新表名> select 字段1，字段2 from <旧表名> [条件];

-- 复制表结构
create table <新表名> like <旧表名>;
```


# 数据类型
---
## int

| 类型 | 大小 | 范围（有符号） |  范围（无符号）|描述|
| ---- | ---- | ---- | ---- | ---- | ---- |
|tinyint| 1 Bytes  |    （-128，127）  |      |      |      |  
|  smallint    |   2 Bytes   |  （-32768，32767）    |      |      |      |
|  mediumint    |   3 Bytes     |  （-8388608）  |      |      |      |
|    int  |   4 Bytes   |  （-2147483648，2147483647）    |      |      |      |
|   bigint   |    8 Bytes   |  （-9223372036854775808，9223372036854775807）   |      |      |      |

整形的宽度指的是显示宽度，并不是存储宽度，整形的存储宽度是固定死的

---

# 外键引入

现在有一张表，每一行都记录了公司中每个人的名字，性别，电话，部门。那么一个部门可以有很多人，这样的话如果说销售部有1000000人，那么这样部门字段都是一样的值，这样是不是就造成了空间的浪费呢？

现在我们需要分库分表了，现在创建一个部门表，字段有id、部门、部门职责等等。这个表只存储部门的信息
那么在创建公司人员表时只需添加一个部门id字段即可。

## 外键约束

这样同样也存在一个问题，员工表的部门ID字段可以随意插入值，这是就需要外键约束了。
下面给出完整的sql语句
```sql
-- 创建部门信息表
create table dep(
    id int primary key,
    name varchar(16),
    `desc` varchar(64)
);

-- 创建人员信息表
create table emp(
    id int primary key,
    name varchar(16),
    gender enum("male", "female"),
    mobel varchar(11),
    dep_id int,
    foreign key(dep_id) references dep(id)
);

这时插入员工数据会报错因为部门表没有数据

删除部门时也会报错，因为员工表里此部门的员工的信息没有删除
```

这样就又会存在问题，修改id时会报错，这时需这样：
```sql
create table emp(
    id int primary key,
    name varchar(16),
    gender enum("male", "female"),
    mobel varchar(11),
    dep_id int,
    foreign key(dep_id) references dep(id) 
    -- 在删除时同步
    on delete cascade
    -- 在更新时同步
    on update cascade
);
```

这样问题又来了，我们好不容易将数据表解耦了，因为外键又强耦合了，==所以在大型项目不要使用外键==

# 关系
## 多对一
```sql
create table dep(
    id int primary key,
    name varchar(16),
    `desc` varchar(64)
);

create table emp(
    id int primary key,
    name varchar(16),
    gender enum("male", "female"),
    mobel varchar(11),
    dep_id int,
    foreign key(dep_id) references dep(id) 
    -- 在删除时同步
    on delete cascade
    -- 在更新时同步
    on update cascade
);
```
## 多对多
比如现在需创建歌手于歌的信息，在歌手表里我们需要id、name。歌表需要id、song_name字段。
实现多对多关系需要第三个表需要字段singer_id、song_id字段。
```sql
create table song(
    id int primary key auto_increment,
    name varchar(16) not null
);

create table singer(

    id int primary key auto_increament,
    name varchar(16) not null
);

create table song2singer(
    id int primary key auto_increament,
    singer_id int not null,
    song_id int not null,
    foreign key(singer_id) references singer(id)  on delete cascade on update cascade,
    foreign key(song_id) references song(id)  on delete cascade on update cascade,
)
```

## 一对一

```sql
create table customer(
    id int primary key,
    name varchar(16),
    gender enum('male','female'),
    mobile varchar(11)
);

create table owner(
    id int primary key,
    room_number varchar(16),
    area int,
    is_loan enum(true,false),
    -- 如果不加这一行就不是一对一关系了，因为可以重复
    customer_id int unique,
    foreign key(customer_id) references customer(id)  on delete cascade on update cascade,

)
```

# 记录的查询语法

## 单表查询


# b站mysql学习
---

## DQL语法

```sql
select
    字段列表
from
    表名列表
where
    条件列表
group by
    分组字段列表
having
    分组后条件列表
order by
    排序字段列表
limit
    分页参数
```

### 基本查询

```sql
select <字段名> as `名字` from table_name; -- 执行后查询的列头不再是 <字段名> 而是 `名字`
select <字段名>  `名字` from table_name; -- 效果等同上一条

-- 这里时支持四则运算的，如果字段是int类型
select <月薪>*12 as `年薪` from table_name;

-- 去除重复的查询结果
select distinct `name` from test.t1; -- 比如有多个 `张三` 但是查询结果只有一个 
```

### 条件查询(where)

- 语法
```sql
select 字段列表 from table_name where 条件列表;
```

- 条件

| 比较运算符             | 功能 |
| ---------------------- | ---- |
| >                      |    大于  |
| >=                     |    大于等于  |
| <                      |    小于  |
| <=                     |    小于等于  |
| =                      |    等于  |
| <> 或 ！=              |    不等于  |
| between  ....  and ... |    在某个范围之内(含最小，最大值)  |
| in(...)                |    在in之后的列表中的值，多选一  |
| like 占位符            |    模糊匹配（`_` 匹配单个字符, `%`匹配任意个字符）  |
| is null                       |    判断是否为空  |

| 逻辑运算符 | 功能 |
| ---------- | ---- |
| and 或 &&  |   并且（多个条件成立）   |
| or 或 \|\| |   或者（多个条件任意一个成立）   |
| not 或 !           |    非，不是  |

- in
```sql
-- 当条件较多时，如下所示
select * from test.t1 where age=18 or age=20 or age=30;
-- 此时可以用 in 关机字，如下
select * from test.t1 where age in(18,20,30);
```

- like
```sql
-- 查询第一个字为 康 且后面跟两个字的记录  （这里中间是没有空格的，为了方便打了空格）
select * from test.t1 where `name` like "康_ _";

-- 查询名字为三个字的记录
select * from test.t1 where `name` like "_ _ _";

-- 正则表达式
select * from test.t1 where `name` regexp "^丁.*";
```


### 聚合查询(count, max, min, avg, sum)

**null值不参与聚合函数运算**

- 聚合函数
    - 将**一列数据作为整体**，进行纵向计算
- 常见聚合函数

| 函数  | 功能 |
| ----- | ---- |
| count     |  统计数量                       |
| max   |   最大值   |
| min   |   最小值   |
| avg   |   平均值   |
| sum   |   求和   |

- count
```sql
-- 这里如果指定字段的话 null记录不会被计算在内
select count(age) from test.t1;
```

- avg
```sql
-- 统计年龄大于20的人的平均值
select avg(`age`) from test.t1 where `age`>20;
```

- max
```sql
-- 查找年龄最大的
select max(`age`) from test.t1;
 ```

- min
```sql
-- 查询最小的年龄
    select min(`age`) from test.t1;
```

### 分组查询(gropu by)

- 语法
```sql
select 字段列表 from 表名 [where 条件] group by 分组字段名 [having 分组后过滤条件];
```

- where与having的区别
    - 执行时机不同：where是分组之前进行过滤，不满足where条件，不参与分组；而having是分组之后对结果进行过滤。
    - 判断条件不同：where不能对聚合函数进行判断，而having可以。

- group by
```sql
-- 根据性别分组查询男生和女生的数量
select sex, count(`sex`)  from test.t1 group by sex;

-- 根据性别分组查询男女生的平均年龄
select sex, avg(age) from test.t1 group by sex;

-- 查询每个部门所有员工的名字 dep为部门
select dep, group_concat(name) from emp group by dep;

```

- having
_查询年龄i小于25的人，并根据性别分组，获取人数大于3的性别

```sql
-- 第一步，查询年龄i小于25的人
select sex from test.t1 where age < 25;

-- 第二部，查询第一部后根据性别分组
select `sex`, count(`sex`) from test.t1 where age < 25 group by `sex`;

-- 第三步，查询到第二部后，用having进行过滤
select `sex`, count(`sex`) from test.t1 where age < 25 group by `sex` having count(`sex`)>=2; 
```


### 排序查询(order by)

- 语法
```sql
select 字段列表 from 表名 order by 字段1 排序方式1, 字段2 排序方式2;
```

- 排序方式
    - ASC：升序（默认）
    - DESC：降序

- ASC
```sql
select * from test.t1 order by age asc;
```

- DESC
```sql
select * from test.t1 order by age desc;
```

```sql
-- 查询后会根据age字段升序排序，但是如果age值相同则按照 data 降序排序，如下
age  data
18   2022-6-1
18   2021-5-1
19   2022-6-1
20   2022-6-1
select * from test.t1 order by age asc, `data` desc;

```

### 分页查询(limit)

- 语法
```sql
select 字段列表 from 表名 limit 起始索引, 查询页数;
```

<span style="color: red;">注意
    <ul>
        <li>起始索引从0开始，起始索引 = (查询页码-1)*每页显示记录数。</li>
        <li>分页查询是数据库的方言，不同的数据库有不同的实现，mysql中是limit</li>
        <li>如果查询的是第一页数据，起始索引可以省略</li>
    </ul>
</span>
- 查询第一页5条数据
```sql
select * from test.t1 limit 0,5;
```

- 查询第二页5条数据

```sql
select * from test.t1 limit 5,5;
```

## DQL 执行顺序

```
FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

也就是你写 `select * from emp where age > 20 group by dep having count(*) > 3 order by age limit 5`，实际执行是先找表、再过滤、再分组、再筛组、再选列、再排序、最后分页。


# 多表查询

现在有两张数据表，emp和dep 现在执行sql select * from emp,dep

当执行 SQL 查询 `SELECT * FROM emp, dep` 时，会出现笛卡尔积的原因是因为没有指定连接条件（join condition），导致数据库系统将 emp 表和 dep 表的每一行进行组合，生成所有可能的组合。这就导致了笛卡尔积的结果，其中的行数等于 emp 表的行数乘以 dep 表的行数。 要避免笛卡尔积，你需要在查询中指定连接条件，例如使用 `JOIN` 关键字连接两个表，并指定它们之间的关联列。这样可以确保只返回符合连接条件的行组合。
接下来我们就将解决这个问题
## 连接查询


- 内连接
        内连接查询的是两张表的相交部分
    - 隐式内连接
    ```sql
    -- 不推荐
    select * from emp,dep where emp.dep_id=dep.id;
    ```
    - 显式内连接
    >select <字段> from <表a> `[inner]` join <表b> on <条件>;
    
```sql
-- ,号改成inner join where改成on。inner是可以省略的
select * from emp inner join dep on emp.dep_id=dep.id;
```
    

- 外连接
    - 左外连接
    >查照左表所有数据，包括交集部分
    >select <字段> from <表a> left `[outer]` join <表b> on <条件>;

    - 右外连接
>查照右表所有数据，包括交集部分
    >select <字段> from <表a> right `[outer]` join <表b> on <条件>;

    
```sql
84集
-- 查询所有员工数据和部门信息
select e.name, d.name from emp e left join dep d on e.dep_id=d.id;

-- 查询所有部门数据，以及对于的员工数据
select e.name, d.name from emp e right join dep d on e.dep_id=d.id;
```

- 自连接
 > select <字段> from <表a><别名> join <表a><别名> on <条件>;
 > 可以用内连接，外连接
 
 ```sql
 85集
 -- 查询所有部门的员工及领导信息
 select a.name '员工', a.post '职位'， b.name '领导' from emp a join emp b on a.leader_id=b.id;

 -- 查询所有员工及其领导信息，包括没有领导的
 select a.name '员工', a.post '职位'， b.name '领导' from emp a left join emp b on a.leader_id=b.id;
```

- 联合查询
 >把多次查询的结果并在一起，关键字：union, union all，联合查询可以查多张表，查询的列数一定要相同，同一张表联合查询可以用 or 代替
 >select .... union `[all]` select ... ;
 
 ```sql
 -- 查询薪资大于15000以及年龄大于45的员工
 select * from emp where salary>=15000
 union all -- 这样写会有可能出现重复的结果，因为会有人即大于45岁薪资也大于15000，去掉all即可解决
 select * from emp where age>=45;
```

## 子查询

一条查询语句可以嵌套另一条查询语句

### 标量子查询（子查询返回单个值）

```sql
-- 查询"销售部"的所有员工
-- 拆解：先查销售部的 id，再查这个 id 对应的员工
select * from emp where dep_id = (
    select id from dep where name = '销售部'
);

-- 查询比李白工资高的员工
select * from emp where salary > (
    select salary from emp where name = '李白'
);
```

### 列子查询（子查询返回一列）

```sql
-- 查询"销售部"和"研发部"的所有员工
select * from emp where dep_id in (
    select id from dep where name in ('销售部', '研发部')
);
```

### 行子查询（子查询返回一行）

```sql
-- 查询与李白同部门且同薪资的员工
select * from emp where (dep_id, salary) = (
    select dep_id, salary from emp where name = '李白'
);
```

### 表子查询（子查询返回多行多列）

```sql
-- 查询与李白同部门且同薪资的员工（同上，用表子查询写法）
select * from emp where (dep_id, salary) in (
    select dep_id, salary from emp where name = '李白'
);

-- 查询每个部门薪资最高的员工
select * from emp e where e.salary = (
    select max(salary) from emp where dep_id = e.dep_id
);
```

### EXISTS 子查询

```sql
-- 查询有员工的部门
select * from dep d where exists (
    select 1 from emp where dep_id = d.id
);
```

好的，让我们通过一个例子来说明内连接和外连接的区别。

假设我们有两个表，一个是"顾客"表（Customers），包含顾客的ID和姓名信息；另一个是"订单"表（Orders），包含订单的ID、顾客ID和订单日期信息。

顾客表（Customers）：
ID   | 姓名
---------------
1    | John
2    | Mary
3    | David

订单表（Orders）：
ID   | 顾客ID | 订单日期
-------------------------
101  | 1     | 2021-01-01
102  | 2     | 2021-02-05
103  | 2     | 2021-02-10
104  | 4     | 2021-03-15

现在，我们想要通过连接这两个表来获取每个订单的顾客姓名。我们可以使用内连接和外连接来实现。

内连接查询：
SELECT Orders.ID, Customers.姓名
FROM Orders
INNER JOIN Customers
ON Orders.顾客ID = Customers.ID;

内连接的结果集将只包含有匹配顾客ID的订单，因此只有ID为1和2的订单会被返回。结果如下：

ID   | 姓名
--------------
101  | John
102  | Mary
103  | Mary

外连接查询：
SELECT Orders.ID, Customers.姓名
FROM Orders
LEFT JOIN Customers
ON Orders.顾客ID = Customers.ID;

左外连接将返回所有的订单，同时也包括了匹配和不匹配的顾客信息。对于没有匹配顾客ID的订单，姓名列将显示为NULL。结果如下：

ID   | 姓名
---------------
101  | John
102  | Mary
103  | Mary
104  | NULL

这就是内连接和外连接的区别。内连接只返回匹配的行，而外连接返回所有的行，并用NULL值表示不匹配的部分。


# 什么是事务？

一组操作的集合（即多条sql语句的集合），这个集合是一个不可分割的工作单位，它会把集合内的所有操作提交，如果执行过程中，有任何一条sql语句出错，那便会退回到整个事务执行之前的状态。即：要么同时成功，要么同时失败。

ok，现在我们来看一下转账的例子：
```sql
-- 1. 查询李白的余额
select * from account where name='李白';
-- 2. 从李白的账号-100
update account set balance = banance-100 where name='李白';
adadw   这里因为sql语句异常，所以第三条sql不会执行，但是前面两条已经执行了。
-- 3. 给杜甫账户+100
update account set balance = banance+100 where name='杜甫';
```

现在我们来手动开启事务，事务只在当前会话有效。

查看事务的提价方式：`select @@autocommit;`
设置事务的提交方式：`set @@autocommit=0;` -- 设置事务手动提交，1为自动提交
开启事务：`start transaction;`或：`begin;`
提交事务：`commit;`
回滚事务：`rollback;`
```sql
select @@autocommit; -- 查询提交方式
set @@autocommit=0; -- 设置为手动提交
-- 1. 查询李白的余额
select * from account where name='李白';
-- 2. 从李白的账号-100
update account set balance = banance-100 where name='李白';
adadw   这里因为sql语句异常
-- 3. 给杜甫账户+100
update account set balance = banance+100 where name='杜甫';
-- 虽然前几条执行成功了，但是没有提交
commit; --提交事务。

-- 回滚是必要的，如果不回滚，后面执行其他的sql就不行了，如果事务没有结束，后续的sql都会认为是在这个事务里里面。
-- 结束事务的方式有两种 -- 提交事务  -- 回滚
rollback; -- 回滚
```

## 事务的四大特性

- 原子性（**A**tomicity）
    - 事务是不可分割的最小操作单元，这个操作单元要么全部成功，要么全部失败
- 一致性（**C**onsisteny）
    - 事务完成的时候，必须使所有数据保持一致状态
- 隔离性（**I**solation）
    - 在并发的时候，A事务在操作的时候，它不影响B事务的执行；B事务在操作的时候也不会影响A
- 持久性（**D**urability）
    - 事务不管时提交还是回滚，他对数据库里面的数据的改变，都是永久的。在还未提交/回滚时更改的数据都存在内存中

## 并发事务引发的问题

- 脏读
    - 一个事务读取到了另外一个事务还没有提交的数据
- 不可重复读
    - 一个事务先后读取同一条记录，但两次读取到的数据不同
- 幻读
    - 一个事务查询一条记录时，没有对应的记录，但在插入记录的时候，又发现这条记录存在了
下面我们用隔离级别解决这个问题
## 事务隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| Read Uncommitted（读未提交） | 可能 | 可能 | 可能 |
| Read Committed（读已提交） | 解决 | 可能 | 可能 |
| Repeatable Read（可重复读）MySQL默认 | 解决 | 解决 | 可能 |
| Serializable（串行化） | 解决 | 解决 | 解决 |

级别越高，数据越安全，性能越低。MySQL 默认是 Repeatable Read。

问：我们在一个事务里插入一批非常大的数据，这个事务已经在执行了很长时间，并且在执行过程中，没有提交，如何知道当前已经插入了多少条数据：
答：利用 Read Uncommitted 隔离级别，用一个新的事务，读取到这一批大数据的插入进度

```sql
-- 查看事务隔离级别
select @@transaction_isolation;

-- 设置事务隔离级别(当前会话)
set session transaction isolation level <隔离级别>;
-- 所有的
set global transaction isolation level <隔离级别>;
```