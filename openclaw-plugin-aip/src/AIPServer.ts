import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface AIPServerConfig {
  port: number;
  allowedPlatforms: string[];
}

interface ExternalAgent {
  id: string;
  ws: WebSocket;
  platform: string;
  name: string;
  capabilities: any[];
}

/**
 * AIP Server for OpenClaw
 * 
 * Exposes OpenClaw agents to external AIP networks
 */
export class AIPServer {
  private config: AIPServerConfig;
  private wss: WebSocketServer | null = null;
  private externalAgents: Map<string, ExternalAgent> = new Map();

  constructor(config: AIPServerConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.wss = new WebSocketServer({ port: this.config.port });
    
    console.log(`🏰 AIP Server started on port ${this.config.port}`);
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📡 External agent connecting...');
      
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data.toString());
      });
      
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'register':
          this.handleRegister(ws, message.data);
          break;
        case 'discover':
          this.handleDiscover(ws, message.data);
          break;
        case 'list_agents':
          this.handleListAgents(ws, message.data);
          break;
        case 'agent_message':
          this.handleAgentMessage(ws, message.data);
          break;
        case 'agent_broadcast':
          this.handleAgentBroadcast(ws, message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  private handleRegister(ws: WebSocket, data: any): void {
    const agentId = uuidv4();
    const platform = data.platform || 'unknown';
    
    // Check if platform is allowed
    if (!this.config.allowedPlatforms.includes('*') && 
        !this.config.allowedPlatforms.includes(platform)) {
      this.sendToAgent(ws, {
        type: 'error',
        data: { message: 'Platform not allowed' },
      });
      ws.close();
      return;
    }
    
    const agent: ExternalAgent = {
      id: agentId,
      ws,
      platform,
      name: data.name,
      capabilities: data.capabilities || [],
    };
    
    this.externalAgents.set(agentId, agent);
    
    console.log(`✅ External agent registered: ${data.name} (${agentId})`);
    
    this.sendToAgent(ws, {
      type: 'registered',
      data: {
        agentId,
        message: 'Successfully registered to OpenClaw AIP network',
      },
    });
  }

  private handleDiscover(ws: WebSocket, data: any): void {
    const criteria = data.criteria;
    const agents = Array.from(this.externalAgents.values())
      .filter((agent) => {
        // Filter by capability type
        if (criteria.capabilityType) {
          const hasCapability = agent.capabilities.some(
            (cap) => cap.type === criteria.capabilityType
          );
          if (!hasCapability) return false;
        }
        
        // Filter by skills
        if (criteria.skills && criteria.skills.length > 0) {
          const hasSkills = agent.capabilities.some((cap) =>
            criteria.skills.every((skill: string) => cap.skills.includes(skill))
          );
          if (!hasSkills) return false;
        }
        
        // Filter by proficiency
        if (criteria.minProficiency) {
          const meetsProficiency = agent.capabilities.some(
            (cap) => cap.proficiency >= criteria.minProficiency
          );
          if (!meetsProficiency) return false;
        }
        
        return true;
      })
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities,
      }));
    
    this.sendToAgent(ws, {
      type: 'discover_response',
      data: {
        requestId: data.requestId,
        agents,
      },
    });
  }

  private handleListAgents(ws: WebSocket, data: any): void {
    const agents = Array.from(this.externalAgents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      capabilities: agent.capabilities,
    }));
    
    this.sendToAgent(ws, {
      type: 'list_agents_response',
      data: {
        requestId: data.requestId,
        agents,
      },
    });
  }

  private handleAgentMessage(ws: WebSocket, data: any): void {
    const fromAgent = this.getAgentByWs(ws);
    if (!fromAgent) return;
    
    const toAgent = this.externalAgents.get(data.to);
    if (!toAgent) {
      this.sendToAgent(ws, {
        type: 'error',
        data: { message: `Agent ${data.to} not found` },
      });
      return;
    }
    
    this.sendToAgent(toAgent.ws, {
      type: 'agent_message',
      from: fromAgent.id,
      data: {
        type: data.messageType,
        payload: data.payload,
      },
    });
  }

  private handleAgentBroadcast(ws: WebSocket, data: any): void {
    const fromAgent = this.getAgentByWs(ws);
    if (!fromAgent) return;
    
    this.externalAgents.forEach((agent) => {
      if (agent.id !== fromAgent.id) {
        this.sendToAgent(agent.ws, {
          type: 'agent_broadcast',
          from: fromAgent.id,
          data: {
            type: data.messageType,
            payload: data.payload,
          },
        });
      }
    });
  }

  private handleDisconnect(ws: WebSocket): void {
    const agent = this.getAgentByWs(ws);
    if (agent) {
      console.log(`👋 External agent disconnected: ${agent.name} (${agent.id})`);
      this.externalAgents.delete(agent.id);
    }
  }

  private getAgentByWs(ws: WebSocket): ExternalAgent | undefined {
    for (const agent of this.externalAgents.values()) {
      if (agent.ws === ws) {
        return agent;
      }
    }
    return undefined;
  }

  private sendToAgent(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log('🏰 AIP Server stopped');
    }
  }
}
