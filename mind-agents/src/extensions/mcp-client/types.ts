/**
 * MCP Client Extension Types
 * 
 * This file defines the types for the Model Context Protocol client extension.
 * This extension allows SYMindX agents to connect to external MCP servers as clients.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse'
import type { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types'
import type { Writable, Readable } from 'node:stream'
import type { Signals } from 'node:process'

import { ExtensionConfig } from '../../types/common.js'

export interface McpClientConfig extends ExtensionConfig {
  servers: McpServerConfig[]
  autoConnect: boolean
  reconnectAttempts: number
  reconnectDelay: number
  timeout: number
}

export interface McpServerConfig {
  name: string
  description?: string
  transport: McpTransportConfig
  capabilities?: string[]
  priority: number
  enabled: boolean
  auth?: McpAuthConfig
}

export interface McpTransportConfig {
  type: 'stdio' | 'sse' | 'websocket'
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

export interface McpAuthConfig {
  type: 'bearer' | 'apikey' | 'basic'
  token?: string
  username?: string
  password?: string
}

export interface McpClientInstance {
  name: string
  client: Client
  transport: StdioClientTransport | SSEClientTransport
  isConnected: boolean
  lastConnected?: Date
  tools: Tool[]
  resources: Resource[]
  prompts: Prompt[]
  capabilities: string[]
  errorCount: number
}

export interface McpToolCall {
  serverId: string
  toolName: string
  arguments: Record<string, any>
  context?: McpCallContext
}

export interface McpResourceRequest {
  serverId: string
  resourceUri: string
  context?: McpCallContext
}

export interface McpPromptRequest {
  serverId: string
  promptName: string
  arguments?: Record<string, any>
  context?: McpCallContext
}

export interface McpCallContext {
  agentId: string
  sessionId?: string
  priority?: 'low' | 'normal' | 'high'
  timeout?: number
  metadata?: Record<string, any>
}

export interface McpCallResult {
  success: boolean
  result?: any
  error?: string
  serverId: string
  duration: number
  timestamp: Date
}

export interface McpServerStatus {
  name: string
  connected: boolean
  lastSeen?: Date
  toolCount: number
  resourceCount: number
  promptCount: number
  latency?: number
  errors: number
}

// Enhanced Extension Interface
export interface ExtensionLifecycle {
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>
  onReload?: () => Promise<void>
  onError?: (error: Error) => Promise<void>
}

export interface SandboxConfig {
  enabled: boolean
  permissions: string[]
  resourceLimits: {
    memory?: number
    cpu?: number
    network?: boolean
    filesystem?: boolean
  }
}

export interface EnhancedExtension {
  dependencies: string[]
  lifecycle: ExtensionLifecycle
  hotReload: boolean
  sandboxing: SandboxConfig
}

// Multi-Agent Orchestration Types
export interface AgentHierarchy {
  root: string
  children: Map<string, string[]>
  parents: Map<string, string>
  roles: Map<string, AgentRole>
}

export interface AgentRole {
  name: string
  permissions: string[]
  capabilities: string[]
  priority: number
}

export interface TaskDelegationSystem {
  delegate(task: Task, fromAgent: string, toAgent: string): Promise<TaskResult>
  canDelegate(task: Task, fromAgent: string, toAgent: string): boolean
  getAvailableAgents(task: Task): string[]
}

export interface Task {
  id: string
  type: string
  description: string
  parameters: Record<string, any>
  priority: number
  deadline?: Date
  dependencies: string[]
  assignedTo?: string
  status: TaskStatus
}

export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TaskResult {
  taskId: string
  success: boolean
  result?: any
  error?: string
  duration: number
  agentId: string
}

export interface CommunicationProtocol {
  sendMessage(fromAgent: string, toAgent: string, message: AgentMessage): Promise<void>
  broadcast(fromAgent: string, message: AgentMessage, filter?: AgentFilter): Promise<void>
  subscribe(agentId: string, messageType: string, handler: MessageHandler): void
}

export interface AgentMessage {
  id: string
  type: string
  from: string
  to?: string
  content: any
  timestamp: Date
  priority: number
}

export interface AgentFilter {
  roles?: string[]
  capabilities?: string[]
  status?: string[]
  exclude?: string[]
}

export type MessageHandler = (message: AgentMessage) => Promise<void>

// Streaming Interface Types
export interface EventStream {
  subscribe(listener: StreamListener): Subscription
  emit(event: StreamEvent): void
  close(): void
}

export interface StreamEvent {
  type: string
  data: any
  timestamp: Date
  source: string
}

export interface StreamListener {
  onEvent(event: StreamEvent): void
  onError?(error: Error): void
  onClose?(): void
}

export interface Subscription {
  unsubscribe(): void
  isActive(): boolean
}

export interface ControlInterface {
  pause(agentId: string): Promise<void>
  resume(agentId: string): Promise<void>
  stop(agentId: string): Promise<void>
  restart(agentId: string): Promise<void>
  configure(agentId: string, config: Partial<any>): Promise<void>
}

export interface ProgressMonitor {
  track(taskId: string, progress: Progress): void
  getProgress(taskId: string): Progress | undefined
  subscribe(taskId: string, listener: ProgressListener): Subscription
}

export interface Progress {
  taskId: string
  percentage: number
  stage: string
  message?: string
  estimatedCompletion?: Date
}

export type ProgressListener = (progress: Progress) => void

// Dynamic Tool System Types
export interface ToolSpec {
  name: string
  description: string
  code: string
  language: 'javascript' | 'python' | 'bash'
  inputs: ToolInput[]
  outputs: ToolOutput[]
  permissions: string[]
}

export interface ToolInput {
  name: string
  type: string
  description: string
  required: boolean
  default?: any
}

export interface ToolOutput {
  name: string
  type: string
  description: string
}

export interface CodeExecutor {
  execute(code: string, language: string, context: ExecutionContext): Promise<ExecutionResult>
  validate(code: string, language: string): Promise<ValidationResult>
  sandbox(code: string, permissions: string[]): Promise<SandboxedExecutor>
}

export interface ExecutionContext {
  agentId?: string
  sessionId?: string
  language?: string
  code?: string
  input?: any
  environment: Record<string, any>
  timeout: number
  permissions?: string[]
  workingDirectory?: string
}

export interface ExecutionResult {
  success: boolean
  output?: any
  error?: string
  duration: number
  resourceUsage: ResourceUsage
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface SandboxedExecutor {
  execute(input: any): Promise<any>
  destroy(): void
}

export interface ResourceUsage {
  memory: number
  cpu: number
  network: number
  filesystem: number
}

export interface TerminalInterface {
  execute(command: string, args?: string[], options?: TerminalOptions): Promise<TerminalResult>
  spawn(command: string, args: string[], options?: SpawnOptions): Promise<ExtendedTerminalProcess>
  getShell(): string
  setWorkingDirectory(path: string): void
}

export interface TerminalOptions {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  shell?: string
}

export interface TerminalResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
  processId?: string
}

export interface SpawnOptions extends TerminalOptions {
  detached?: boolean
  stdio?: 'pipe' | 'inherit' | 'ignore'
}


export interface TerminalProcess {
  pid: number
  stdin: Writable | null
  stdout: Readable | null
  stderr: Readable | null
  kill(signal?: Signals): boolean
  wait(): Promise<number | null>
}

export interface ExtendedTerminalProcess extends TerminalProcess {
  id: string
  command: string
  args: string[]
  startTime: Date
  status: 'running' | 'completed' | 'failed' | 'killed' | 'error' | 'finished'
  endTime?: Date
  childProcess?: any
}