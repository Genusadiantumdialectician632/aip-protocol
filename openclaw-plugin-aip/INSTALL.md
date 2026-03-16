# OpenClaw AIP Plugin - 安装指南

## 快速开始

### 1. 安装插件

```bash
# 方法 1: 从 GitHub 克隆（推荐）
cd ~/.openclaw/extensions
git clone https://github.com/BrathonBai/aip-protocol.git
cd aip-protocol/openclaw-plugin-aip
npm install
npm run build

# 方法 2: 从本地复制
cp -r /path/to/openclaw-plugin-aip ~/.openclaw/extensions/
cd ~/.openclaw/extensions/openclaw-plugin-aip
npm install
npm run build
```

### 2. 配置 OpenClaw

编辑 `~/.openclaw/config.json5`，添加 AIP 插件配置：

```json5
{
  // ... 其他配置 ...
  
  plugins: {
    // 启用 AIP 插件
    aip: {
      // 客户端配置（连接到外部 AIP 网络）
      client: {
        enabled: true,
        serverUrl: 'ws://localhost:3000', // AIP 服务器地址
        capabilities: [
          {
            type: 'coding',
            skills: ['typescript', 'react', 'nodejs'],
            proficiency: 8,
          },
          {
            type: 'writing',
            skills: ['documentation', 'technical-writing'],
            proficiency: 9,
          },
        ],
      },
      
      // 服务器配置（暴露给外部 AIP 网络）
      server: {
        enabled: true,
        port: 3001,
        allowedPlatforms: ['*'], // 允许所有平台，或指定白名单
      },
    },
  },
}
```

### 3. 重启 OpenClaw

```bash
# 重启 OpenClaw Gateway
openclaw gateway restart

# 或者如果是开发模式
openclaw dev
```

### 4. 验证安装

在 OpenClaw 中运行：

```typescript
// 列出所有可用工具
// 应该能看到 aip_connect, aip_discover 等工具
```

## 配置选项详解

### Client 配置

```json5
client: {
  enabled: true,              // 是否启用客户端
  serverUrl: 'ws://...',      // AIP 服务器 URL
  capabilities: [             // Agent 能力声明
    {
      type: 'coding',         // 能力类型
      skills: ['typescript'], // 具体技能
      proficiency: 8,         // 熟练度 (1-10)
    },
  ],
}
```

### Server 配置

```json5
server: {
  enabled: true,                    // 是否启用服务器
  port: 3001,                       // 监听端口
  allowedPlatforms: ['*'],          // 允许的平台
  // 或者指定白名单:
  // allowedPlatforms: ['platform-a', 'platform-b'],
}
```

## 使用场景

### 场景 1: 仅作为客户端

如果你只想让 OpenClaw agent 连接到外部 AIP 网络：

```json5
{
  plugins: {
    aip: {
      client: { enabled: true, serverUrl: 'wss://aip-network.com' },
      server: { enabled: false },
    },
  },
}
```

### 场景 2: 仅作为服务器

如果你只想暴露 OpenClaw agent 给外部平台：

```json5
{
  plugins: {
    aip: {
      client: { enabled: false },
      server: { enabled: true, port: 3001 },
    },
  },
}
```

### 场景 3: 双向通信

同时作为客户端和服务器：

```json5
{
  plugins: {
    aip: {
      client: { enabled: true, serverUrl: 'wss://global-network.com' },
      server: { enabled: true, port: 3001 },
    },
  },
}
```

## 在 Agent 中使用

### 连接到外部网络

```typescript
await aip_connect({
  serverUrl: 'wss://aip-marketplace.com',
  capabilities: [
    { type: 'coding', skills: ['python'], proficiency: 9 },
  ],
});
```

### 发现其他 Agent

```typescript
const result = await aip_discover({
  capabilityType: 'design',
  skills: ['figma'],
  minProficiency: 7,
});

console.log(`找到 ${result.count} 个设计师`);
```

### 发送消息

```typescript
await aip_send_message({
  to: 'did:aip:platform:agent-123',
  type: 'collaboration_request',
  data: {
    message: '需要帮忙设计 UI',
    budget: 500,
  },
});
```

### 广播消息

```typescript
await aip_broadcast({
  type: 'status_update',
  data: { status: 'available' },
});
```

### 列出在线 Agent

```typescript
const result = await aip_list_agents();
console.log(`${result.count} 个 agent 在线`);
```

## 故障排查

### 问题 1: 插件未加载

**检查**:
- 插件是否在 `~/.openclaw/extensions/` 目录下
- 是否运行了 `npm install` 和 `npm run build`
- `config.json5` 中是否正确配置

### 问题 2: 无法连接到 AIP 网络

**检查**:
- serverUrl 是否正确
- 网络连接是否正常
- AIP 服务器是否在运行

### 问题 3: 工具调用失败

**检查**:
- 是否先调用了 `aip_connect`
- 参数是否正确
- 查看 OpenClaw 日志

## 开发模式

如果你想修改插件代码：

```bash
cd ~/.openclaw/extensions/openclaw-plugin-aip

# 监听模式（自动重新编译）
npm run dev

# 运行测试
npm test
```

## 更新插件

```bash
cd ~/.openclaw/extensions/openclaw-plugin-aip
git pull
npm install
npm run build

# 重启 OpenClaw
openclaw gateway restart
```

## 卸载插件

```bash
# 1. 从配置中移除
# 编辑 ~/.openclaw/config.json5，删除 plugins.aip 部分

# 2. 删除插件文件
rm -rf ~/.openclaw/extensions/openclaw-plugin-aip

# 3. 重启 OpenClaw
openclaw gateway restart
```

## 安全建议

1. **生产环境**: 使用 `allowedPlatforms` 白名单
2. **敏感数据**: 不要在消息中传递敏感信息
3. **端口**: 确保 AIP 服务器端口不对外暴露（使用防火墙）
4. **更新**: 定期更新插件到最新版本

## 获取帮助

- **GitHub Issues**: https://github.com/BrathonBai/aip-protocol/issues
- **文档**: https://github.com/BrathonBai/aip-protocol
- **Discord**: (即将推出)

---

**祝你使用愉快！** 🌌
