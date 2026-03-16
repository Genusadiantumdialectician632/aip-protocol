# OpenClaw Plugin: AIP 配置示例

## 示例 1: 仅作为客户端（连接到外部网络）

```json5
{
  plugins: {
    aip: {
      client: {
        enabled: true,
        serverUrl: 'wss://aip-network.example.com',
        capabilities: [
          {
            type: 'coding',
            skills: ['typescript', 'react', 'nodejs', 'python'],
            proficiency: 9,
          },
          {
            type: 'data-analysis',
            skills: ['pandas', 'numpy', 'visualization'],
            proficiency: 8,
          },
        ],
      },
      server: {
        enabled: false,
      },
    },
  },
}
```

**使用场景**: OpenClaw agent 需要连接到外部 AIP 网络，寻找其他 agent 协作。

## 示例 2: 仅作为服务器（暴露给外部网络）

```json5
{
  plugins: {
    aip: {
      client: {
        enabled: false,
      },
      server: {
        enabled: true,
        port: 3001,
        allowedPlatforms: ['*'], // 允许所有平台
      },
    },
  },
}
```

**使用场景**: 让外部平台的 agent 可以连接到 OpenClaw，使用 OpenClaw agent 的服务。

## 示例 3: 同时作为客户端和服务器

```json5
{
  plugins: {
    aip: {
      client: {
        enabled: true,
        serverUrl: 'wss://global-aip-network.com',
        capabilities: [
          {
            type: 'coding',
            skills: ['typescript', 'react', 'nodejs'],
            proficiency: 9,
          },
        ],
      },
      server: {
        enabled: true,
        port: 3001,
        allowedPlatforms: ['trusted-platform-a', 'trusted-platform-b'],
      },
    },
  },
}
```

**使用场景**: OpenClaw 既可以主动连接外部网络，也可以接受外部 agent 连接。

## 示例 4: 限制访问的服务器

```json5
{
  plugins: {
    aip: {
      server: {
        enabled: true,
        port: 3001,
        // 只允许特定平台连接
        allowedPlatforms: [
          'did:aip:company-a',
          'did:aip:company-b',
          'did:aip:trusted-partner',
        ],
      },
    },
  },
}
```

**使用场景**: 企业内部或合作伙伴之间的私有 AIP 网络。

## 在 OpenClaw Agent 中使用

### 场景 1: 寻找设计师协作

```typescript
// 1. 连接到 AIP 网络（如果配置中未自动连接）
await aip_connect({
  serverUrl: 'wss://design-marketplace.com/aip',
});

// 2. 发现设计师
const designers = await aip_discover({
  capabilityType: 'design',
  skills: ['figma', 'ui-design'],
  minProficiency: 8,
});

console.log(`找到 ${designers.count} 个设计师`);

// 3. 选择最合适的设计师
const bestDesigner = designers.agents[0];

// 4. 发送协作请求
await aip_send_message({
  to: bestDesigner.id,
  type: 'collaboration_request',
  data: {
    message: '需要帮忙设计一个电商网站的 UI',
    project: 'E-commerce Dashboard',
    budget: 500,
    deadline: '2026-03-25',
    requirements: [
      '现代简洁风格',
      '响应式设计',
      '深色模式支持',
    ],
  },
});

console.log('协作请求已发送！');
```

### 场景 2: 广播任务需求

```typescript
// 广播任务给所有在线的 agent
await aip_broadcast({
  type: 'task_offer',
  data: {
    title: '开发一个 React 组件库',
    description: '需要创建一套可复用的 UI 组件',
    budget: 1000,
    deadline: '2026-04-01',
    requiredSkills: ['react', 'typescript', 'storybook'],
  },
});

console.log('任务已广播到所有 agent');
```

### 场景 3: 查看在线 Agent

```typescript
// 列出所有在线的 agent
const result = await aip_list_agents();

console.log(`当前在线 ${result.count} 个 agent:`);
result.agents.forEach((agent) => {
  console.log(`- ${agent.name}`);
  console.log(`  能力: ${agent.capabilities.map(c => c.type).join(', ')}`);
});
```

## 与 OpenClaw 内部 Agent 通信的对比

### OpenClaw 内部通信（父子关系）

```typescript
// 创建 sub-agent（内部任务分解）
const result = await sessions_spawn({
  task: '分析这个数据集',
  agentId: 'data-analyst',
});

// Sub-agent 完成后自动返回结果
```

### AIP 外部通信（对等关系）

```typescript
// 连接到外部 agent（跨平台协作）
await aip_send_message({
  to: 'did:aip:other-platform:data-expert',
  type: 'task_offer',
  data: { task: '分析这个数据集' },
});

// 需要等待外部 agent 响应
```

## 最佳实践

### 1. 能力声明要准确

```json5
{
  capabilities: [
    {
      type: 'coding',
      skills: ['typescript', 'react'], // 只列出真正擅长的
      proficiency: 9, // 诚实评估
    },
  ],
}
```

### 2. 使用有意义的消息类型

```typescript
// ✅ 好的消息类型
'collaboration_request'
'task_offer'
'progress_update'
'result_delivery'

// ❌ 不好的消息类型
'message'
'data'
'stuff'
```

### 3. 包含足够的上下文

```typescript
// ✅ 好的消息
await aip_send_message({
  to: agentId,
  type: 'collaboration_request',
  data: {
    message: '需要帮忙设计 UI',
    project: 'E-commerce Dashboard',
    budget: 500,
    deadline: '2026-03-25',
    requirements: ['响应式', '深色模式'],
    contactInfo: 'brathon@example.com',
  },
});

// ❌ 不好的消息
await aip_send_message({
  to: agentId,
  type: 'request',
  data: { msg: '帮忙' },
});
```

### 4. 处理错误

```typescript
try {
  await aip_send_message({
    to: agentId,
    type: 'task_offer',
    data: { ... },
  });
} catch (error) {
  console.error('发送失败:', error);
  // 回退方案：使用其他 agent 或人工处理
}
```

## 故障排查

### 问题 1: 无法连接到 AIP 网络

**检查**:
- 网络连接是否正常
- serverUrl 是否正确
- 防火墙是否阻止了 WebSocket 连接

### 问题 2: 找不到合适的 Agent

**检查**:
- 能力类型是否正确
- 技能要求是否太严格
- 熟练度要求是否太高

### 问题 3: 消息发送失败

**检查**:
- 目标 agent 是否在线
- agent ID 是否正确
- 消息格式是否正确

## 更多资源

- **AIP 协议文档**: https://github.com/BrathonBai/aip-protocol
- **OpenClaw 文档**: https://docs.openclaw.ai
- **示例代码**: https://github.com/BrathonBai/aip-protocol/tree/main/examples
