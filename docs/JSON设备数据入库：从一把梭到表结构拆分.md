# JSON 设备数据入库：从一把梭到表结构拆分

## 背景

甲方要求采集一台设备的数据，设备制造商提供的是 JSON 格式。大概长这样：

```json
{
  "device_id": "DEVICE_001",
  "timestamp": "2024-03-15T10:30:00Z",
  "measurements": [
    { "item": "temperature", "value": 36.5, "unit": "℃" },
    { "item": "humidity", "value": 65.2, "unit": "%" },
    { "item": "pressure", "value": 101.3, "unit": "kPa" }
  ]
}
```

数据要存到时序数据库 TDengine 里。

## 第一反应：直接塞进去

最省事的做法：把整个 JSON 存成一个文本字段，一条数据一个字段，完事。

```sql
-- 一把梭方案
CREATE TABLE device_data (
    ts TIMESTAMP,
    device_id BINARY(64),
    raw_json BINARY(4096)   -- 整个 JSON 塞进去
);
```

能存，能查，但仔细一想有问题：

**如果甲方要对某个测量项做聚合查询怎么办？**

比如"查一下这台设备最近 24 小时温度的平均值"，用这个方案就得：

1. 把所有记录的 `raw_json` 查出来
2. 在应用层解析 JSON
3. 过滤出 temperature 字段
4. 再算平均值

数据量小还行，量大了这就是灾难。

**如果要做模糊查询呢？**

比如"哪些设备的温度超过 38 度？"——对不起，得全量查出来一个个解析。

## 改进：拆表

想清楚之后，决定把 JSON 结构拆成关系型表：

### 主表：设备上报记录

存储 JSON 头部信息——谁、什么时候上报的：

```sql
CREATE TABLE device_record (
    ts TIMESTAMP,
    device_id BINARY(64),
    -- 可以加其他头部字段
);
```

### 子表：测量项明细

存储每次上报的具体测量数据：

```sql
CREATE TABLE measurement_data (
    ts TIMESTAMP,
    device_id BINARY(64),
    item_name BINARY(32),    -- temperature, humidity, pressure
    item_value FLOAT,
    unit BINARY(16)
);
```

这样结构就变成了：

```
device_record（主表）
  └── device_id: DEVICE_001
  └── ts: 2024-03-15 10:30:00

measurement_data（子表）
  ├── (DEVICE_001, 10:30:00, temperature, 36.5, ℃)
  ├── (DEVICE_001, 10:30:00, humidity, 65.2, %)
  └── (DEVICE_001, 10:30:00, pressure, 101.3, kPa)
```

查询就变成了标准 SQL：

```sql
-- 最近 24 小时温度平均值
SELECT AVG(item_value) 
FROM measurement_data 
WHERE device_id = 'DEVICE_001' 
  AND item_name = 'temperature' 
  AND ts > NOW() - 24h;

-- 哪些设备温度超过 38 度
SELECT DISTINCT device_id 
FROM measurement_data 
WHERE item_name = 'temperature' 
  AND item_value > 38;
```

干净利落，不用在应用层解析 JSON。

## 踩坑：TDengine 版本问题

表结构设计好了，写代码的时候发现一个问题：

TDengine 的**超级表（STable）在 3.6 以上版本才支持复合主键**。我需要的是 `(device_id, ts, item_name)` 作为联合主键，低版本不支持。

而当时用的是 Windows 环境，TDengine 3.6 的 Windows 版本还没发布。

## 解决：Docker 部署

Windows 没有高版本，那就用 Docker 跑 Linux 版本：

```bash
docker run -d \
  --name tdengine \
  -p 6030:6030 \
  -p 6041:6041 \
  -v /path/to/taos/data:/var/lib/taos \
  tdengine/tdengine:3.6
```

关键点：

- **端口映射**：`-p 6030:6030` 让宿主机能访问 TDengine 服务
- **文件挂载**：`-v /path/to/taos/data:/var/lib/taos` 把数据目录挂载到宿主机，容器停止、删除都不丢数据

这样既用上了 TDengine 3.6 的新特性，又不用担心容器生命周期问题。数据持久化在宿主机磁盘上，容器重建也不影响。

## 最终效果

| 方案 | 聚合查询 | 模糊查询 | 存储效率 |
|------|---------|---------|---------|
| JSON 直存 | 应用层解析，慢 | 不支持 | 高 |
| 拆表存储 | 标准 SQL，快 | 支持 | 稍低（多几条记录） |

拆表之后多了几条记录，但换来了查询的灵活性和性能，这个 trade-off 是值得的。

## 总结

1. **存储设计要想查询场景**：不能只想着"怎么存"，还得想"怎么查"。甲方的需求是会变的，今天只要存，明天就要聚合、就要筛选
2. **Docker 是版本兼容的好帮手**：Windows 没有新版？Docker 跑 Linux 版。端口映射 + 文件挂载，既方便又安全
3. **JSON 入库不要一把梭**：结构化数据就应该结构化存储，除非你确定永远不需要按字段查询
