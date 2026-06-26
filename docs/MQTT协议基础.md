## 什么是 MQTT

MQTT（Message Queuing Telemetry Transport）是一种**轻量级的发布/订阅消息协议**，专为物联网和弱网络环境设计。

特点：

- **报文头极小**：最小仅 2 字节，比 HTTP 轻量得多
- **支持 QoS**：消息可靠性可配置
- **支持遗嘱消息**：设备异常断开时通知其他设备
- **双向通信**：服务器可以主动下发消息给设备

## 核心概念

### Broker（消息代理）

Broker 是 MQTT 的服务器，负责接收设备的消息并转发给订阅者。常见的 Broker 有：

- **EMQX**：国产开源，性能强悍，支持百万级并发
- **Mosquitto**：轻量级开源，适合嵌入式
- **RabbitMQ**：自带 MQTT 插件
- **EMQX Cloud**：托管的 EMQX 服务

### Client（客户端）

每个连接到 Broker 的设备都是一个 Client。Client 可以**发布**消息，也可以**订阅**主题。

### Topic（主题）

Topic 是消息的分类标签，用 `/` 分层：

```
sensor/temperature/room_1
sensor/humidity/room_1
device/001/status
```

支持通配符订阅：

| 通配符 | 说明 | 示例 |
|--------|------|------|
| `+` | 匹配单层 | `sensor/+/room_1` 匹配 `sensor/temperature/room_1` 和 `sensor/humidity/room_1` |
| `#` | 匹配多层 | `sensor/#` 匹配所有 `sensor/` 开头的主题 |

### 发布/订阅模型

```
┌─────────┐   publish    ┌─────────┐
│ 设备 A   │ ──────────▶ │         │
│ (发布者)  │             │  Broker  │
└─────────┘              │         │
                         │         │   subscribe
┌─────────┐   notify     │         │ ──────────▶ ┌─────────┐
│ 设备 B   │ ◀────────── │         │             │ 设备 C   │
│ (订阅者)  │             └─────────┘             │ (订阅者)  │
└─────────┘                                      └─────────┘
```

发布者把消息发给 Broker，Broker 转发给所有订阅了该主题的客户端。发布者和订阅者**不需要知道对方的存在**，实现了解耦。

## MQTT 连接过程

### 1. 建立连接（CONNECT → CONNACK）

客户端发起连接请求，Broker 返回连接结果：

```
Client ──▶ CONNECT （携带 Client ID、用户名密码、Clean Session 标记）
Client ◀── CONNACK （返回连接结果 0=成功 1-5=各种失败原因）
```

### 2. 订阅主题（SUBSCRIBE → SUBACK）

```
Client ──▶ SUBSCRIBE （携带主题 + QoS 等级）
Client ◀── SUBACK （Broker 确认订阅成功）
```

### 3. 发布消息（PUBLISH）

```
Client ──▶ PUBLISH （携带主题 + 消息内容 + QoS 等级）
```

### 4. 心跳保活（PINGREQ → PINGRESP）

如果客户端一定时间内没有消息往来，会发送 PINGREQ 维持连接。Broker 回复 PINGRESP。

```
Client ──▶ PINGREQ
Client ◀── PINGRESP
```

### 5. 断开连接（DISCONNECT）

客户端主动断开时发送 DISCONNECT 报文，Broker 清理其会话。

## Client ID 详解

**Client ID 是 MQTT 连接最重要的参数之一**，也是前面那篇故障排查的根因。

### 规则

- **客户端唯一标识**：同一个 Broker 上，每个 Client ID 只能对应一个连接
- **最大 23 字节**（部分 Broker 可能放宽，但建议遵守规范）
- **只能包含字母、数字、连字符、下划线**（具体取决于 Broker 实现）

### 踢人机制

```
假设有两个设备用同一个 Client ID 连接 Broker：

时间线：
  设备 A 连接 ──▶ Broker 建立 session_A
  设备 B 连接 ──▶ Broker 发现 Client ID 冲突
                ──▶ Broker 踢掉 session_A
                ──▶ 设备 A 断开（但设备 A 不知道是被踢的，会尝试重连）
                ──▶ 设备 A 重连 ──▶ Broker 踢掉 session_B ──▶ 死循环
```

### 最佳实践

- **永远不要手动写死 Client ID**：用 MAC 地址、序列号、UUID 等
- **预留一个前缀方便定位**：`prod_00:1A:2B:3C:4D:5E`、`test_00:1A:2B:3C:4D:5F`
- **限制长度**：虽然 UUID 唯一性好，但 36 位字符可能超过 Broker 限制
- **可以考虑让 Broker 自动生成 ID**：MQTT 5.0 支持 Broker 自动为客户端分配 Client ID

## QoS（服务质量）

MQTT 定义了 3 个消息质量等级：

| QoS | 名称 | 说明 | 性能 |
|-----|------|------|------|
| **0** | 至多一次 | 发出去就不管了，可能丢 | 最快 |
| **1** | 至少一次 | 保证收到，但可能重复 | 较快 |
| **2** | 恰好一次 | 保证不丢不重 | 最慢（2 次交互确认） |

```mermaid
QoS 0：          PUBLISH ──▶
（即发即忘，不存状态）

QoS 1：          PUBLISH ──▶
                  ◀── PUBACK
（可能重复，客户端需要去重）

QoS 2：          PUBLISH ──▶
                  ◀── PUBREC
                 PUBREL ──▶
                  ◀── PUBCOMP
（4 次握手，保证不重不漏）
```

### 选型建议

| 场景 | 推荐 QoS | 原因 |
|------|---------|------|
| 传感器温度上报 | **0** | 丢几秒数据无所谓，可以容忍 |
| 设备状态变更 | **1** | 需要知道设备上线/下线，重复消息去重即可 |
| 远程控制指令 | **2** | 锁门、断电等指令不能丢也不能重复执行 |

## Clean Session & 持久会话

### Clean Session = true（默认）

- 连接断开时 Broker 清除该 Client 的所有订阅和离线消息
- 设备重启后需要重新订阅主题
- **适合大部分物联网场景**

### Clean Session = false（持久会话）

- Broker 保留该 Client 的订阅和离线消息
- 设备再次连接时直接恢复之前的会话，不需要重新订阅
- 设备离线期间的消息会在它重新上线后推送
- 需要配合 **Client ID 固定** 使用（否则 Broker 无法关联）

```sql
-- 伪代码理解
if (clean_session == true) {
    // 新连接，以前的订阅和消息都丢掉
    session = new Session();
} else {
    // 找之前这个 Client ID 的 session
    session = findSession(clientId);
    if (session == null) {
        session = new Session();
    }
    // 保持订阅关系，推送离线期间积压的消息
}
```

## Retained Message（保留消息）

当某个主题发布了 Retained 消息后，**Broker 会保存最后一条**。新订阅者连接上来时，立刻收到这条保留消息，不需要等设备再次发布。

```sql
-- 设备发布保留消息
publish("sensor/temp/1", "25°C", retain=true);
-- 新设备订阅这个主题，即使没有新发布，也会立即收到 "25°C"
subscribe("sensor/temp/1");
```

**典型用途：** 设备状态、版本号、配置参数，新设备上线就能拿到最新值，不用等发布。

## Will Message（遗嘱消息）

客户端在连接时可以指定一个"遗嘱"，当客户端**异常断开**（如掉电、断网）时，Broker 会代替客户端发布这条遗嘱消息。

```go
// 连接时设置遗嘱
connOpts := mqtt.NewClientOptions().
    SetClientID("device_001").
    SetWill("device/001/status", "offline", 1, true)

// 设备正常断开时不会触发遗嘱
// 只有非预期断开（掉电、网络中断）才会触发
```

**典型用途：** 设备在线状态检测。设备上线时发布 `online`，遗嘱设置为 `offline`。如果异常断开，其他订阅者就会收到 `offline` 消息。

> **注意：** 主动调用 `Disconnect()` 不会触发遗嘱消息。只有连接突然中断才会触发。

## QoS 与消息去重

即使没有 Client ID 冲突，QoS 1 也可能导致重复消息。

**QoS 1 的重复发生场景：**

```
设备                                Broker
  │                                    │
  ├── PUBLISH (msg_id=1) ────────────▶ │ ① 发布消息
  │                                    │
... 网络抖动 ...                       │
  │                                    │
  │ 没收到 PUBACK，以为 Broker 没收到   │
  │                                    │
  ├── PUBLISH (msg_id=1) ────────────▶ │ ② 重发消息
  │                                    │
  │                                    ├─ 业务处理完成（消息被消费两次！）
  │                                    │
  │ ◀── PUBACK ────────────────────────┤ ③ Broker 回复确认
```

**解决方案：**

- **应用层去重**：消息体中携带唯一 ID（如序列号），消费端按 ID 去重
- **QoS 2**：用性能换精确性，4 次握手保证不重不漏

## Keep Alive（心跳）

Keep Alive 是客户端告诉 Broker 自己还活着的机制。

- 客户端在 CONNECT 报文中指定保持连接时间（如 60 秒）
- 如果在这个时间内没有消息往来，客户端应该发送 PINGREQ
- 如果 Broker 在 `1.5 × Keep Alive` 时间内没收到任何报文，会认为客户端断开了

```
Keep Alive = 60s：

0s     ─── 客户端发送 PUBLISH
30s    ─── 客户端发送 PINGREQ
90s    ─── 没收到任何报文
      Broker 判定：客户端已断开
      触发遗嘱消息（如果有）→ 清理会话
```

**建议设置比心跳间隔略大的值**，给网络抖动留点余地，避免误踢。

## 常用参数参考

| 参数 | 建议值 | 说明 |
|------|--------|------|
| Keep Alive | 30-120s | 根据网络稳定性调整，网络差设小值（尽快发现断线） |
| QoS | 0-2 | 非关键数据用 0，关键数据用 2 |
| Clean Session | true | 大部分场景用 true，需要离线消息用 false |
| 重连间隔 | 3s/10s/30s 递增 | 不要固定间隔，避免风暴 |
| 最大重连次数 | 不限或 10 次 | 根据场景决定 |

## 避坑总结

| 坑 | 原因 | 解决 |
|----|------|------|
| **Client ID 重复** | 多设备用相同 ID，互相踢 | MAC/序列号/UUID 保证唯一 |
| **消息重复处理** | QoS 1 网络重发导致 | 消息体带唯一 ID，消费端去重 |
| **离线消息丢失** | Clean Session=true，断线期间消息没存 | 持久会话或业务层补录 |
| **遗嘱误触发** | Keep Alive 设置太短，网络稍微抖动就触发 | 适当放宽 Keep Alive 时间 |
| **订阅树膨胀** | 每个设备订阅个性化主题，数量太大 | 用通配符统一订阅，加主题前缀隔离 |
