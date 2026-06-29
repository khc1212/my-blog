---
title: MySQL 锁
description: MySQL 锁机制详解，行锁、表锁、死锁排查与优化
---

## 为什么需要锁？

数据库本质上是一个**多用户共享的资源**。当多个人同时读写同一份数据时，就会出现数据不一致的问题。锁机制就是用来**保证数据并发访问的一致性**。

举个 🌰：

```sql
-- 两个事务同时执行这段逻辑
-- 事务 A                      事务 B
select stock from product where id = 1;  -- 查到 stock = 10
                                      select stock from product where id = 1;  -- 也查到 10
update product set stock = 9 where id = 1;  -- 扣减成功
                                      update product set stock = 9 where id = 1;  -- 也扣减成功
-- 最终 stock = 9，但实际应该卖了 2 件变成 8
```

这就是**丢失更新**，锁就是为了解决这种问题。

## 锁的分类

MySQL 的锁可以从多个维度来划分：

### 按粒度分

| 类型 | 说明 | 引擎 |
|------|------|------|
| **表锁** | 锁住整张表，并发度最低 | MyISAM、InnoDB |
| **行锁** | 锁住一行记录，并发度高 | InnoDB |
| **页锁** | 锁住一页（16KB），折中方案 | BDB（已淘汰） |

### 按模式分

| 类型 | 说明 |
|------|------|
| **共享锁 (S)** | 读锁，允许多个事务同时读，阻塞写 |
| **排他锁 (X)** | 写锁，阻塞其他事务的读写 |
| **意向锁 (IS/IX)** | 表级锁，表示"某个事务正在某行上有 S/X 锁"，加快表锁判断 |

### 按算法分（InnoDB 行锁的三种实现）

| 类型 | 说明 |
|------|------|
| **Record Lock** | 记录锁，锁住索引上的一条记录 |
| **Gap Lock** | 间隙锁，锁住两条记录之间的间隙，防止幻读 |
| **Next-Key Lock** | 临键锁，Record Lock + Gap Lock 的组合，InnoDB 默认行锁算法 |

这三种是 **InnoDB 面试和日常踩坑的重点**，下面详细讲。

## InnoDB 行锁的三种算法

准备一张表：

```sql
create table t (
    id int primary key,
    name varchar(16),
    age int,
    index idx_age (age)
) engine=InnoDB;

insert into t values (1, '张三', 10);
insert into t values (3, '李四', 20);
insert into t values (5, '王五', 30);
insert into t values (7, '赵六', 40);
insert into t values (9, '孙七', 50);
```

### Record Lock（记录锁）

锁住**索引上的一条具体记录**。

```sql
-- 事务 A
begin;
select * from t where id = 3 for update;  -- 给 id=3 这条记录加上 X 锁

-- 事务 B
update t set name = '李四改' where id = 3;  -- ❌ 阻塞，等 A 释放
update t set name = '张三改' where id = 1;  -- ✅ 可以执行，锁不同行
```

::: tip Record Lock 锁的是索引，不是数据行本身
即使表里没有显式索引，InnoDB 也会建隐藏的聚簇索引，所以行锁一定基于索引。
:::

### Gap Lock（间隙锁）

锁住**两条记录之间的间隙**，防止其他事务在这个间隙里插入新数据。

```
-- 现有数据的主键值：1, 3, 5, 7, 9
-- 间隙是这些区间：
(-∞, 1), (1, 3), (3, 5), (5, 7), (7, 9), (9, +∞)
```

```sql
-- 事务 A
begin;
select * from t where id between 3 and 7 for update;

-- 事务 B
insert into t values (2, '插入', 15);  -- ❌ 阻塞，间隙 (1,3) 被锁
insert into t values (4, '插入', 25);  -- ❌ 阻塞，间隙 (3,5) 被锁
insert into t values (6, '插入', 35);  -- ❌ 阻塞，间隙 (5,7) 被锁
insert into t values (8, '插入', 45);  -- ❌ 阻塞，间隙 (7,9) 被锁

insert into t values (10, '插入', 55); -- ✅ 可以，间隙 (9,+∞) 没锁
```

**Gap Lock 只在可重复读（Repeatable Read）级别存在**，读已提交（Read Committed）级别下 Gap Lock 会被禁用，这也是为什么 MySQL 默认用 RR 级别 —— 靠 Gap Lock 解决幻读。

### Next-Key Lock（临键锁）

**Record Lock + Gap Lock 的组合**，锁住一条记录以及它前面的间隙。

默认情况下，InnoDB 的行锁用的就是 Next-Key Lock。

```
-- 对于 id = 5 这一行，Next-Key Lock 锁住的范围是 (3, 5]
-- 即：间隙 (3,5) + 记录 5
```

```sql
-- 事务 A
begin;
select * from t where id = 5 for update;

-- 这行代码实际上锁住了 (3, 5] 这个区间
-- 为什么？因为 InnoDB 默认用 Next-Key Lock
```

**唯一索引优化**：如果查询命中了唯一索引（如主键），且能唯一确定一条记录，Next-Key Lock 会自动退化为 Record Lock，只锁住该行本身，不锁间隙。

```sql
-- id 是主键
select * from t where id = 5 for update;
-- 因为 id 唯一确定，Next-Key Lock 退化为 Record Lock
-- 只锁 id=5 这一行，间隙 (3,5) 不会被锁

-- 但如果查的是普通索引 age
select * from t where age = 30 for update;
-- age 不是唯一的，所以还是 Next-Key Lock
-- 锁住 (20, 30] 这个范围
```

这个退化在面试中经常问，记住：**唯一索引等值查询退化为 Record Lock，普通索引还是 Next-Key Lock**。

## 意向锁

**意向锁是表级锁**，它的存在是为了快速判断表里是否有行锁。

```sql
-- 事务 A
begin;
select * from t where id = 1 for update;  -- 给 id=1 这一行加了 X 锁

-- 同时 InnoDB 会在这张表上自动加一个 IX（意向排他锁）

-- 事务 B
lock tables t write;  -- 想锁整张表
-- 发现表上有 IX 锁，立刻知道有行锁存在，直接等待
-- 不用逐行扫描判断了
```

**意向锁的意义**：提升表锁和行锁共存的效率。没有意向锁，要加表锁就得遍历所有行检查有没有行锁，效率极低。

## 锁相关的 SQL 操作

```sql
-- 共享锁（读锁）
select * from t where id = 1 lock in share mode;

-- 排他锁（写锁）
select * from t where id = 1 for update;

-- 查看当前事务锁情况
select * from information_schema.innodb_trx;
select * from information_schema.innodb_locks;
select * from information_schema.innodb_lock_waits;

-- 查看锁等待超时时间（默认 50s）
show variables like 'innodb_lock_wait_timeout';

-- 当前事务隔离级别
select @@transaction_isolation;
```

## 死锁

### 什么是死锁

两个事务互相等待对方释放锁，谁也无法继续。

```
事务 A                         事务 B
update t set name='A' where id=1;  -- 锁 id=1
                                  update t set name='B' where id=3;  -- 锁 id=3
update t set name='A' where id=3;  -- 等待 B 释放 id=3（阻塞）
                                  update t set name='B' where id=1;  -- 等待 A 释放 id=1（阻塞）
-- 死锁产生，InnoDB 检测到后会回滚其中一个事务
```

InnoDB 会自动检测死锁，选择回滚**代价较小**的事务（修改行数少的），并抛出一个错误：

```sql
ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction
```

### 如何避免死锁

- **统一访问顺序**：多表操作时，规定 A 事务先锁表 1 再锁表 2，B 事务也必须先锁表 1 再锁表 2
- **缩短事务时间**：不要在事务里做耗时操作（如远程 RPC 调用）
- **合理设计索引**：不走索引会导致行锁升级为表锁，增加死锁概率
- **降低隔离级别**：非必要时用 RC 代替 RR，禁用 Gap Lock

## 实际场景分析

### 场景一：库存扣减

```sql
-- 错误写法
begin;
select stock from product where id = 1;        -- 读到了 10
update product set stock = 9 where id = 1;      -- 别人可能已经改过了
commit;

-- 正确写法一：悲观锁
begin;
select stock from product where id = 1 for update;  -- 直接锁行
update product set stock = stock - 1 where id = 1;
commit;

-- 正确写法二：乐观锁（适合冲突少的场景）
begin;
update product set stock = stock - 1 where id = 1 and stock = 10;  -- CAS
-- 影响行数为 0 说明被改了，重试
commit;
```

### 场景二：唯一约束检查 + 插入

```sql
-- 常见错误：先查有没有，没有就插入
-- 但并发下两条 sql 之间有间隙，可能都查到 "没有"，然后都插入成功

-- ✅ 正确做法
insert into user (id, name) values (1, '张三')
on duplicate key update name = values(name);
-- 利用数据库的唯一索引自带的锁，原子性完成
```

### 场景三：间隙锁导致的"莫名其妙"的插入阻塞

```sql
-- 事务 A
begin;
delete from t where id = 3;  -- 在主键上加了 Gap Lock: (1,3)


-- 事务 B
insert into t values (2, '插入', 15);  -- ❌ 阻塞！
-- 2 在间隙 (1,3) 中，被事务 A 的 Gap Lock 挡住了
-- 这就是 Gap Lock 的一种副作用
```

## 总结

| 概念 | 一句话记住 |
|------|-----------|
| **Record Lock** | 锁一条索引记录 |
| **Gap Lock** | 锁一个间隙，防止插入，只在 RR 级别存在 |
| **Next-Key Lock** | 默认行锁 = Record + Gap，唯一索引等值查会退化 |
| **意向锁** | 表级"标识锁"，快速判断表里有没有行锁 |
| **死锁** | 互相等待，InnoDB 自动回滚小事务 |
