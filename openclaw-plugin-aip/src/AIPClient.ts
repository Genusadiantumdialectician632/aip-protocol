import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface AIPClientConfig {
  serverUrl: string;
  capabilities: Array<{
    type: string;
    skills: string[];
    proficiency: number;
  }>;
}

interface AgentInfo {
  id: string;
  name: string;
  capabilities: any[];
}

/**
 * AIP Client for OpenClaw
 * 
 * Allows OpenClaw agents to connect to external AIP networks
 */
export class AIPClient {
  private config: AIPClientConfig;
  private ws: WebSocket | null = null;
  private agentId: string | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connected: boolean = false;

  constructor(config: AIPClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.serverUrl);

      this.ws.on('open', () => {
        console.log('✅ Connected to AIP network');
        this.connected = true;
        
        // Register agent
        this.register();
        
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        console.log('❌ Disconnected from AIP network');
        this.connected = false;
      });

      this.ws.on('error', (error) => {
        console.error('AIP connection error:', error);
        reject(error);
      });
    });
  }

  private register(): void {
    this.send({
      type: 'register',
      data: {
        name: 'OpenClaw Agent',
        description: 'Agent from OpenClaw platform',
        capabilities: this.config.capabilities,
      },
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle registration response
      if (message.type === 'registered') {
        this.agentId = message.data.agentId;
        console.log(`🎉 Registered as Agent: ${this.agentId}`);
        return;
      }

      // Handle incoming messages
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private send(data: any): void {
    if (!this.ws || !this.connected) {
      throw new Error('Not connected to AIP network');
    }
    
    this.ws.send(JSON.stringify(data));
  }

  async discover(criteria: {
    capabilityType: string;
    skills?: string[];
    minProficiency?: number;
  }): Promise<AgentInfo[]> {
    return new Promise((resolve) => {
      const requestId = uuidv4();
      
      // Set up response handler
      this.messageHandlers.set('discover_response', (message) => {
        if (message.data.requestId === requestId) {
          this.messageHandlers.delete('discover_response');
          resolve(message.data.agents);
        }
      });
      
      // Send discovery request
      this.send({
        type: 'discover',
        data: {
          requestId,
          criteria,
        },
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.messageHandlers.delete('discover_response');
        resolve([]);
      }, 5000);
    });
  }

  async sendMessage(to: string, type: string, data: any): Promise<void> {
    this.send({
      type: 'agent_message',
      data: {
        to,
        messageType: type,
        payload: data,
      },
    });
  }

  async broadcast(type: string, data: any): Promise<void> {
    this.send({
      type: 'agent_broadcast',
      data: {
        messageType: type,
        payload: data,
      },
    });
  }

  async listAgents(): Promise<AgentInfo[]> {
    return new Promise((resolve) => {
      const requestId = uuidv4();
      
      this.messageHandlers.set('list_agents_response', (message) => {
        if (message.data.requestId === requestId) {
          this.messageHandlers.delete('list_agents_response');
          resolve(message.data.agents);
        }
      });
      
      this.send({
        type: 'list_agents',
        data: { requestId },
      });
      
      setTimeout(() => {
        this.messageHandlers.delete('list_agents_response');
        resolve([]);
      }, 5000);
    });
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  getAgentId(): string | null {
    return this.agentId;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}
