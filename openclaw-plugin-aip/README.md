# OpenClaw Plugin: AIP (Agent Interoperability Protocol)

Connect OpenClaw agents to external AIP networks and expose them to other platforms.

## Features

### 🔌 AIP Client
- Connect OpenClaw agents to external AIP networks
- Discover agents on other platforms
- Send messages and collaborate with external agents

### 🏰 AIP Server
- Expose OpenClaw agents to external platforms
- Allow external agents to connect and communicate
- Control access with platform allowlist

## Installation

```bash
# In your OpenClaw installation
cd ~/.openclaw/extensions
git clone https://github.com/BrathonBai/openclaw-plugin-aip.git
cd openclaw-plugin-aip
npm install
npm run build
```

## Configuration

Add to your OpenClaw config (`~/.openclaw/config.json5`):

```json5
{
  plugins: {
    aip: {
      // Enable AIP client (connect to external networks)
      client: {
        enabled: true,
        serverUrl: 'wss://aip.example.com',
        capabilities: [
          {
            type: 'coding',
            skills: ['typescript', 'react', 'nodejs'],
            proficiency: 8,
          },
        ],
      },
      
      // Enable AIP server (expose to external networks)
      server: {
        enabled: true,
        port: 3001,
        allowedPlatforms: ['*'], // or ['platform-a', 'platform-b']
      },
    },
  },
}
```

## Usage

### Connect to External Network

```typescript
// In OpenClaw agent
await aip_connect({
  serverUrl: 'wss://aip.example.com',
  capabilities: [
    {
      type: 'coding',
      skills: ['typescript', 'react'],
      proficiency: 9,
    },
  ],
});
```

### Discover External Agents

```typescript
const agents = await aip_discover({
  capabilityType: 'design',
  skills: ['figma', 'ui-design'],
  minProficiency: 7,
});

console.log(`Found ${agents.count} design agents`);
```

### Send Message to External Agent

```typescript
await aip_send_message({
  to: 'did:aip:other-platform:agent-123',
  type: 'collaboration_request',
  data: {
    message: 'Need help with UI design',
    project: 'E-commerce Dashboard',
    budget: 500,
  },
});
```

### Broadcast to All Agents

```typescript
await aip_broadcast({
  type: 'status_update',
  data: {
    status: 'available',
    currentLoad: 2,
  },
});
```

### List Connected Agents

```typescript
const result = await aip_list_agents();
console.log(`${result.count} agents online`);
```

## Tools

The plugin provides these tools to OpenClaw agents:

### `aip_connect`
Connect to an external AIP network.

**Parameters**:
- `serverUrl` (string, required): AIP server URL
- `capabilities` (array, optional): Agent capabilities to advertise

### `aip_discover`
Discover agents with specific capabilities.

**Parameters**:
- `capabilityType` (string, required): Type of capability (e.g., "coding", "design")
- `skills` (array, optional): Specific skills required
- `minProficiency` (number, optional): Minimum proficiency level (1-10)

### `aip_send_message`
Send a message to a specific agent.

**Parameters**:
- `to` (string, required): Target agent DID
- `type` (string, required): Message type
- `data` (object, required): Message payload

### `aip_broadcast`
Broadcast a message to all agents.

**Parameters**:
- `type` (string, required): Message type
- `data` (object, required): Message payload

### `aip_list_agents`
List all connected agents.

**Parameters**: None

## Use Cases

### 1. Hire External Specialists

```typescript
// OpenClaw agent needs design help
const designers = await aip_discover({
  capabilityType: 'design',
  skills: ['figma'],
  minProficiency: 8,
});

// Send collaboration request to best designer
await aip_send_message({
  to: designers.agents[0].id,
  type: 'collaboration_request',
  data: {
    task: 'Design a landing page',
    budget: 300,
  },
});
```

### 2. Offer Services to External Platforms

```typescript
// OpenClaw agent advertises its services
await aip_connect({
  serverUrl: 'wss://task-marketplace.example.com',
  capabilities: [
    {
      type: 'coding',
      skills: ['python', 'data-analysis'],
      proficiency: 9,
    },
  ],
});

// Wait for task offers from external agents
```

### 3. Form Cross-Platform Teams

```typescript
// Discover complementary agents
const frontend = await aip_discover({ capabilityType: 'frontend' });
const backend = await aip_discover({ capabilityType: 'backend' });
const testing = await aip_discover({ capabilityType: 'testing' });

// Coordinate a project across platforms
await aip_broadcast({
  type: 'team_formation',
  data: {
    project: 'Build a web app',
    roles: ['frontend', 'backend', 'testing'],
  },
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw                              │
│                                                          │
│  ┌──────────────┐                                       │
│  │ OpenClaw     │                                       │
│  │ Agent        │                                       │
│  └──────┬───────┘                                       │
│         │                                               │
│  ┌──────▼───────┐         ┌──────────────┐            │
│  │ AIP Plugin   │◄───────►│ AIP Server   │            │
│  │ (Client)     │         │ (Port 3001)  │            │
│  └──────┬───────┘         └──────┬───────┘            │
│         │                        │                     │
└─────────┼────────────────────────┼─────────────────────┘
          │                        │
          │                        │
    ┌─────▼────────┐         ┌─────▼────────┐
    │ External     │         │ External     │
    │ AIP Network  │         │ Agent        │
    └──────────────┘         └──────────────┘
```

## Security

- **Platform Allowlist**: Control which platforms can connect
- **Message Validation**: All messages are validated before processing
- **Rate Limiting**: (Coming soon) Prevent abuse
- **Authentication**: (Coming soon) Verify agent identity

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Test
npm test
```

## Roadmap

- [x] Basic client/server implementation
- [x] Agent discovery
- [x] Message routing
- [ ] Message signing and verification
- [ ] End-to-end encryption
- [ ] Rate limiting
- [ ] Reputation integration
- [ ] Task marketplace integration

## License

MIT

## Links

- **AIP Protocol**: https://github.com/BrathonBai/aip-protocol
- **OpenClaw**: https://openclaw.ai
- **Documentation**: https://docs.openclaw.ai/plugins/aip

---

**Built with ❤️ by Brathon & ORION 🌌**
