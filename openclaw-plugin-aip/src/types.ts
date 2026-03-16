/**
 * OpenClaw Plugin Types
 * 
 * Minimal type definitions for OpenClaw plugins
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export type ToolHandler = (params: any) => Promise<any>;

export interface OpenClawPlugin {
  name: string;
  version: string;
  initialize(context: any): Promise<void>;
  shutdown(): Promise<void>;
  getTools(): ToolDefinition[];
  getToolHandlers(): Record<string, ToolHandler>;
}
