---
title: MySQL 日志
description: MySQL 日志系统详解，redo log、undo log、binlog 核心原理
---

## 为什么 MySQL 需要日志？

MySQL 的日志系统是它**高可靠性的基石**。简单来说，日志解决了三个核心问题：

1. **崩溃恢复**：机器突然断电，重启后数据不丢 —— redolog 的功劳
2. **数据恢复 / 回滚**：事务执行到一半出错了，能撤销 —— undolog 的功劳
3. **备份恢复 / 主从同步**：误删了表，能恢复到某个时间点 —— binlog 的功劳

MySQL 里日志虽然有好几种，但**核心的就三个**：

| 日志 | 中文名 | 谁产生的 | 作用 |
|------|--------|---------|------|
| **binlog** | 二进制日志 | Server 层 | 主从复制、数据恢复 |
| **redolog** | 重做日志 | InnoDB 引擎层 | 崩溃恢复（保证持久性） |
| **undolog** | 回滚日志 | InnoDB 引擎层 | 事务回滚、MVCC（保证原子性） |

## 一条更新语句的执行流程

直接看一个具体例子，就全明白了：

```sql
update user set name = '张三' where id = 1;
```

这条语句在开启了事务的情况下，执行流程如下：

```
客户端
  │
  ▼
Server 层
  │  ① 检查 id=1 的数据页是否在 buffer pool 中
  │     不在 → 从磁盘读到 buffer pool
  │
  ▼
InnoDB 引擎
  │  ② 在 buffer pool 中修改 name = '张三'（脏页）
  │
  ├─▶ ③ 写 undolog（记录修改前的值，用于回滚）
  │
  ├─▶ ④ 写 redolog（记录"页 xxx 的偏移量 yyy 改成了 张三"）
  │      状态：prepare（预提交）
  │
  ▼
Server 层
  │  ⑤ 写 binlog（记录"update user set name = '张三' where id = 1"）
  │
  ▼
InnoDB 引擎
  │  ⑥ redolog 状态更新为：commit（提交）
  │
  ▼
  (异步) ⑦ buffer pool 中的脏页在合适时机刷到磁盘
```

这就是 MySQL 经典的 **WAL（Write-Ahead Logging，先写日志再写磁盘）** 技术。

### 为什么是先写日志、后写磁盘？

**直接写磁盘太慢了。** 磁盘随机 I/O 和顺序 I/O 的速度差距巨大：

- 随机写磁盘 ≈ 几十条/秒
- 顺序写日志 ≈ 几万条/秒

WAL 先把操作**顺序写到日志里**，内存中的数据页稍后再刷盘。这样即使崩溃了，重启时也能从日志里恢复。

---

### 一个灵魂拷问

> **为什么 binlog 写完后还要把 redolog 状态改成 commit？为什么要两阶段提交？**

这就涉及真正值钱的知识点了。看下去你就懂了。

## 两阶段提交（Two-Phase Commit）

### 如果不用两阶段提交会怎样？

假设第一步写了 redolog，第二步准备写 binlog 时崩溃了：

```sql
-- 场景一：写完 redolog（prepare），写 binlog 前崩溃
-- 重启后：
--   redolog：有这个事务（prepare）
--   binlog：没有这个事务
-- 此时必须回滚该事务，否则从库重放 binlog 时会少一条数据，主从不一致

-- 场景二：写完 binlog，准备提交 redolog 时崩溃
-- 重启后：
--   redolog：有这个事务（prepare）
--   binlog：也有这个事务
-- 此时必须提交该事务，否则从库多了一条数据，主从也不一致
```

**两阶段提交就是为了保证 redolog 和 binlog 的一致性。**

### 两阶段提交的具体流程

```
 ① redolog prepare     ──── 引擎说："我准备好了"
 ② binlog write        ──── Server 说："我写完了"
 ③ redolog commit      ──── 引擎说："正式提交"
```

崩溃恢复时的判断规则：

| 崩溃点 | redolog 状态 | binlog 有？ | 恢复行为 |
|--------|-------------|-------------|---------|
| ① 和 ② 之间 | prepare | ❌ 没有 | **回滚**事务 |
| ② 和 ③ 之间 | prepare | ✅ 有 | **提交**事务 |
| ③ 之后 | commit | ✅ 有 | 已提交，不管 |

**简单记忆：binlog 有就提交，没有就回滚。**

## binlog（二进制日志）

### binlog 长什么样？

```sql
# at 12345678
#250101 10:00:00 server id 1  end_log_pos 12345679 CRC32 0x12345678  Query   thread_id=10    exec_time=0     error_code=0
SET TIMESTAMP=1735699200/*!*/;
update user set name = '张三' where id = 1
/*!*/;
```

binlog 记录的是 **SQL 语句（或行变更）的逻辑日志**，不是数据页的变化。

### binlog 的三种格式

| 格式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| **STATEMENT** | 记录原始 SQL | 日志小 | 不安全，如 `now()` 在主从执行结果不同 |
| **ROW**（默认） | 记录每一行的变更 | 最安全，主从绝对一致 | 日志大，批量操作会产生大量日志 |
| **MIXED** | 自动选择 | 折中 | 偶尔有坑 |

```sql
-- 查看 binlog 格式
show variables like 'binlog_format';
```

建议生产环境用 **ROW** 模式，虽然日志大一点，但不会出现主从不一致的问题。

### binlog 的两大作用

**① 主从复制**

```
主库
  │ 写入 binlog
  ▼
从库  ──▶ 拉取 binlog 写到 relay log ──▶ 重放 SQL
```

**② 数据恢复**

```bash
# 恢复到某个时间点
mysqlbinlog --stop-datetime="2025-01-01 10:00:00" mysql-bin.000001 | mysql -u root -p

# 恢复到某个位置
mysqlbinlog --stop-position=12345678 mysql-bin.000001 | mysql -u root -p
```

### binlog 的相关配置

```sql
-- 查看 binlog 相关参数
show variables like 'log_bin';              -- 是否开启 binlog
show variables like 'binlog_format';        -- binlog 格式
show variables like 'expire_logs_days';     -- binlog 保留天数
show variables like 'max_binlog_size';      -- 单个 binlog 文件大小（默认 1GB）

-- 查看所有 binlog 文件
show binary logs;

-- 查看当前正在写的 binlog 文件
show master status;
```

## redolog（重做日志）

### redolog 长什么样？

redolog 是**物理日志**，记录的是"某个数据页的某个偏移量改成了什么值"。

```
// 不是记录 SQL，而是记录这样：
page (3, 200), offset 56, value '张三'
```

### redolog 为什么是幂等的？

同一个 redolog 重复执行多次，结果是一样的。因为它是"在 xxx 位置写入 xxx 值"，不管执行多少次都是那个值。而 binlog（STATEMENT 模式）重放 SQL 可能会导致不同的结果。

### redolog 的环形写入

redolog 是**固定大小**的，以**循环写**的方式工作：

```
┌─────────────────────────────────────────────┐
│ write pos ──────────────▶ checkpoint        │
│ (当前写入位置)                (已刷盘位置)    │
│                                            │
│ 已写入但未刷盘 (redolog)                    │
│ 已刷盘 (已持久化到磁盘)                      │
│ 空闲空间 (可覆盖)                            │
└─────────────────────────────────────────────┘
```

- **write pos**：当前写入位置，向前移动
- **checkpoint**：已刷盘的位置，向前移动
- 当 write pos 追上 checkpoint 时，必须先把日志刷盘，推进 checkpoint

### 刷盘时机（force log at commit）

```sql
-- 控制 redolog 刷盘策略
show variables like 'innodb_flush_log_at_trx_commit';
```

| 值 | 含义 | 安全性 | 性能 |
|----|------|--------|------|
| **0** | 每秒刷一次 | 崩溃丢 1 秒数据 | 最快 |
| **1**（默认） | 每次事务提交都刷 | 不丢数据（只要磁盘不坏） | 最慢 |
| **2** | 写入 OS cache，每秒刷 | 操作系统崩溃丢 1 秒数据 | 较快 |

生产环境建议用 **1**，保证 ACID 的持久性。

### redolog 解决了什么问题？

```sql
-- 如果没有 redolog
update user set name = '张三' where id = 1;
-- 1. 找到 id=1 的数据页（可能在磁盘，也可能在内存）
-- 2. 修改 name
-- 3. 直接写回磁盘 —— 随机 I/O，巨慢

-- 有了 redolog
-- 1. 找到 id=1 的数据页加载到 buffer pool
-- 2. 修改 buffer pool 中的 name（此时数据页变成"脏页"）
-- 3. 写 redolog（顺序 I/O，极快）
-- 4. 事务提交
-- 5. 后台慢慢把脏页刷回磁盘
```

本质上就是用 **顺序写** 代替 **随机写**，提升写入性能。

## undolog（回滚日志）

### undolog 长什么样？

undolog 记录的是**修改前的值**，用于回滚：

```
-- 执行 update user set name = '张三' where id = 1 时：
undolog 记录了：id=1 的 name 原来是 '李四'

-- 如果事务回滚：把 name 改回 '李四'
```

### undolog 的两大作用

**① 事务回滚**

```sql
begin;
insert into user values (1, '张三');  -- undolog 记录：删除 id=1 的行
update user set name = '李四' where id = 1;  -- undolog 记录：name 原来是 '张三'
-- ... 出错了
rollback;
-- undolog 反向执行：先把 name 改回 '张三'，再删除 id=1 的行
```

**② MVCC（多版本并发控制）**

undolog 是实现 MVCC 的关键。每一行记录除了实际数据外，还有 **DB_TRX_ID（事务 ID）** 和 **DB_ROLL_PTR（回滚指针）** 两个隐藏字段。

```
一行数据在 undolog 中的版本链：

┌──────────────────────┐
│ id=1, name='张三'    │  ← 当前读到的数据（事务 ID=100）
│ DB_ROLL_PTR ─────────┼──┐
└──────────────────────┘  │
                          ▼
                  ┌──────────────────────┐
                  │ id=1, name='李四'    │  ← 上一个版本（事务 ID=99）
                  │ DB_ROLL_PTR ─────────┼──┐
                  └──────────────────────┘  │
                                            ▼
                                    ┌──────────────────────┐
                                    │ id=1, name='王五'    │  ← 更早版本（事务 ID=98）
                                    │ DB_ROLL_PTR → null   │
                                    └──────────────────────┘
```

**读已提交（RC）** 和 **可重复读（RR）** 的区别，就在于通过 undolog 版本链构建一致性视图的策略不同：

- **RC**：每次 select 都重新计算视图，所以可能读到已提交的新数据（不可重复读）
- **RR**：事务开始时创建视图，整个事务期间都用这个视图，所以读到的一直是事务开始时的快照

## 三种日志对比总结

| 特性 | binlog | redolog | undolog |
|------|--------|---------|---------|
| **所属层级** | Server 层 | InnoDB 引擎层 | InnoDB 引擎层 |
| **日志类型** | 逻辑日志（SQL/行变更） | 物理日志（页修改） | 逻辑日志（反向操作） |
| **写入时机** | 事务提交时 | 事务执行中逐步写 | 事务执行中逐步写 |
| **存储方式** | 追加写，文件轮转 | 固定大小，环形写 | 追加写，自动清理 |
| **主要作用** | 主从复制、数据恢复 | 崩溃恢复 | 回滚、MVCC |
| **能否禁用** | 可关闭（但建议开启） | 不能 | 不能 |

### 一句话记三者

```
更新数据时：
  ① undolog 记下"改之前长什么样"    — 用来回滚
  ② redolog 记下"改成了什么值"       — 用来崩溃恢复
  ③ binlog 记下"执行了什么操作"      — 用来同步和恢复

崩溃恢复时：
  redolog 里有的 → binlog 里也有 → 提交
  redolog 里有的 → binlog 里没有 → 回滚
  （两阶段提交保证了一致性）
```

## 常见面试题

**Q：MySQL 的 redolog 和 binlog 有什么区别？**

A：redolog 是 InnoDB 引擎的物理日志（记录页修改），用于崩溃恢复；binlog 是 Server 层的逻辑日志（记录操作），用于主从复制和数据恢复。redolog 是环形写固定大小，binlog 是追加写轮转文件。

**Q：为什么需要两阶段提交？**

A：保证 redolog 和 binlog 一致，避免主从数据不一致。崩溃恢复时，binlog 有的就提交，没有的就回滚。

**Q：undolog 和 MVCC 的关系是什么？**

A：undolog 记录了行的历史版本，MVCC 利用 undolog 的版本链和 ReadView 实现不同隔离级别。RR 级别下事务开始时的 ReadView 固定，所以可重复读；RC 级别下每次查询重建 ReadView，所以可能读到已提交的新数据。

**Q：什么是 WAL 技术？**

A：Write-Ahead Logging，先写日志再写磁盘。把随机写变顺序写，极大提升写入性能。即使崩溃，也能通过日志恢复数据。

**Q：innodb_flush_log_at_trx_commit 设置为 0、1、2 的区别？**

A：0 每秒刷盘（丢 1 秒），1 每次提交刷盘（不丢数据），2 写入系统缓存每秒刷（操作系统崩溃丢 1 秒）。生产默认用 1。
