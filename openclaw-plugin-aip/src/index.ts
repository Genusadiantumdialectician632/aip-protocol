import type { OpenClawPlugin, ToolDefinition, ToolHandler } from './types';
import { AIPClient } from './AIPClient';
import { AIPServer } from './AIPServer';

/**
 * OpenClaw Plugin for Agent Interoperability Protocol (AIP)
 * 
 * This plugin enables OpenClaw agents to:
 * 1. Connect to external AIP networks
 * 2. Expose themselves to external agents
 * 3. Discover and communicate with agents on other platforms
 */

interface AIPPluginConfig {
  /** Enable AIP client (connect to external networks) */
  client?: {
    enabled: boolean;
    /** Default AIP server to connect to */
    serverUrl?: string;
    /** Agent capabilities to advertise */
    capabilities?: Array<{
      type: string;
      skills: string[];
      proficiency: number;
    }>;
  };
  
  /** Enable AIP server (expose OpenClaw agents to external networks) */
  server?: {
    enabled: boolean;
    /** Port to listen on */
    port?: number;
    /** Allowed external platforms */
    allowedPlatforms?: string[];
  };
}

export default class AIPPlugin implements OpenClawPlugin {
  name = 'aip';
  version = '0.1.0';
  
  private client?: AIPClient;
  private server?: AIPServer;
  private config?: AIPPluginConfig;

  async initialize(context: any): Promise<void> {
    this.config = context?.config?.plugins?.aip || {};
    
    console.log('🌐 Initializing AIP Plugin...');
    
    // Initialize client if enabled
    if (this.config?.client?.enabled) {
      const clientConfig = this.config.client;
      this.client = new AIPClient({
        serverUrl: clientConfig.serverUrl || 'ws://localhost:3000',
        capabilities: clientConfig.capabilities || [],
      });
      
      await this.client.connect();
      console.log('✅ AIP Client connected');
    }
    
    // Initialize server if enabled
    if (this.config?.server?.enabled) {
      const serverConfig = this.config.server;
      this.server = new AIPServer({
        port: serverConfig.port || 3001,
        allowedPlatforms: serverConfig.allowedPlatforms || ['*'],
      });
      
      await this.server.start();
      console.log(`✅ AIP Server started on port ${serverConfig.port || 3001}`);
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down AIP Plugin...');
    
    if (this.client) {
      await this.client.disconnect();
    }
    
    if (this.server) {
      await this.server.stop();
    }
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'aip_connect',
        description: 'Connect to an external AIP network',
        parameters: {
          type: 'object',
          properties: {
            serverUrl: {
              type: 'string',
              description: 'AIP server URL (e.g., wss://platform.example.com/aip)',
            },
            capabilities: {
              type: 'array',
              description: 'Agent capabilities to advertise',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  proficiency: { type: 'number', minimum: 1, maximum: 10 },
                },
              },
            },
          },
          required: ['serverUrl'],
        },
      },
      {
        name: 'aip_discover',
        description: 'Discover agents with specific capabilities on the AIP network',
        parameters: {
          type: 'object',
          properties: {
            capabilityType: {
              type: 'string',
              description: 'Type of capability to search for (e.g., "coding", "design")',
            },
            skills: {
              type: 'array',
              description: 'Specific skills required',
              items: { type: 'string' },
            },
            minProficiency: {
              type: 'number',
              description: 'Minimum proficiency level (1-10)',
              minimum: 1,
              maximum: 10,
            },
          },
          required: ['capabilityType'],
        },
      },
      {
        name: 'aip_send_message',
        description: 'Send a message to an agent on the AIP network',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Target agent DID (e.g., did:aip:platform:agent-id)',
            },
            type: {
              type: 'string',
              description: 'Message type (e.g., "collaboration_request", "task_offer")',
            },
            data: {
              type: 'object',
              description: 'Message payload',
            },
          },
          required: ['to', 'type', 'data'],
        },
      },
      {
        name: 'aip_broadcast',
        description: 'Broadcast a message to all agents on the AIP network',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Message type',
            },
            data: {
              type: 'object',
              description: 'Message payload',
            },
          },
          required: ['type', 'data'],
        },
      },
      {
        name: 'aip_list_agents',
        description: 'List all connected agents on the AIP network',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  getToolHandlers(): Record<string, ToolHandler> {
    return {
      aip_connect: async (params: any) => {
        if (!this.client) {
          this.client = new AIPClient({
            serverUrl: params.serverUrl,
            capabilities: params.capabilities || [],
          });
        }
        
        await this.client.connect();
        
        return {
          success: true,
          message: `Connected to AIP network at ${params.serverUrl}`,
          agentId: this.client.getAgentId(),
        };
      },
      
      aip_discover: async (params: any) => {
        if (!this.client) {
          throw new Error('AIP client not connected. Use aip_connect first.');
        }
        
        const agents = await this.client.discover({
          capabilityType: params.capabilityType,
          skills: params.skills,
          minProficiency: params.minProficiency,
        });
        
        return {
          success: true,
          agents,
          count: agents.length,
        };
      },
      
      aip_send_message: async (params: any) => {
        if (!this.client) {
          throw new Error('AIP client not connected. Use aip_connect first.');
        }
        
        await this.client.sendMessage(params.to, params.type, params.data);
        
        return {
          success: true,
          message: `Message sent to ${params.to}`,
        };
      },
      
      aip_broadcast: async (params: any) => {
        if (!this.client) {
          throw new Error('AIP client not connected. Use aip_connect first.');
        }
        
        await this.client.broadcast(params.type, params.data);
        
        return {
          success: true,
          message: 'Message broadcasted to all agents',
        };
      },
      
      aip_list_agents: async () => {
        if (!this.client) {
          throw new Error('AIP client not connected. Use aip_connect first.');
        }
        
        const agents = await this.client.listAgents();
        
        return {
          success: true,
          agents,
          count: agents.length,
        };
      },
    };
  }
}
