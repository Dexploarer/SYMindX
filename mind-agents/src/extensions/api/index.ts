/**
 * API Extension for SYMindX
 * Provides HTTP REST API and WebSocket server capabilities
 */

import * as express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'http'
import * as http from 'http'
import { Extension, ExtensionType, ExtensionStatus, Agent, ExtensionAction, ExtensionEventHandler } from '../../types/agent.js'
import { ExtensionConfig } from '../../types/common.js'
import {
  ApiConfig,
  ApiSettings,
  ApiRequest,
  ApiResponse,
  ChatRequest,
  ChatResponse,
  MemoryRequest,
  MemoryResponse,
  ActionRequest,
  ActionResponse,
  WebSocketMessage,
  ConnectionInfo
} from './types.js'

export class ApiExtension implements Extension {
  id = 'api'
  name = 'API Server'
  version = '1.0.0'
  type = ExtensionType.COMMUNICATION
  enabled = true
  status = ExtensionStatus.DISABLED
  config: ApiConfig
  actions: Record<string, ExtensionAction> = {}
  events: Record<string, ExtensionEventHandler> = {}

  private agent?: Agent
  private app: express.Application
  private server?: http.Server
  private wss?: WebSocketServer
  private apiConfig: ApiSettings
  private connections = new Map<string, WebSocket>()
  private rateLimiters = new Map<string, { count: number; resetTime: number }>()

  constructor(config: ApiConfig) {
    this.config = config
    this.apiConfig = {
      ...this.getDefaultSettings(),
      ...config.settings
    }
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  async init(agent: Agent): Promise<void> {
    this.agent = agent
    // Initialize API server if needed
  }

  async tick(agent: Agent): Promise<void> {
    // Periodic tasks for API extension
  }

  private getDefaultSettings(): ApiSettings {
    return {
      port: 3000,
      host: '0.0.0.0',
      cors: {
        enabled: true,
        origins: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        headers: ['Content-Type', 'Authorization']
      },
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 100
      },
      websocket: {
        enabled: true,
        path: '/ws',
        heartbeatInterval: 30000
      },
      auth: {
        enabled: false,
        type: 'bearer',
        secret: process.env.API_SECRET || 'default-secret'
      },
      logging: {
        enabled: true,
        level: 'info',
        format: 'combined'
      }
    }
  }

  private setupMiddleware(): void {
    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // CORS
    if (this.apiConfig.cors.enabled) {
      this.app.use(cors({
        origin: this.apiConfig.cors.origins,
        methods: this.apiConfig.cors.methods,
        allowedHeaders: this.apiConfig.cors.headers,
        credentials: true
      }))
    }

    // Rate limiting
    if (this.apiConfig.rateLimit.enabled) {
      const limiter = rateLimit({
        windowMs: this.apiConfig.rateLimit.windowMs,
        max: this.apiConfig.rateLimit.maxRequests,
        message: { error: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false
      })
      this.app.use(limiter)
    }

    // Authentication middleware
    if (this.apiConfig.auth.enabled) {
      this.app.use(this.authMiddleware.bind(this))
    }
  }

  private authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const token = authHeader.substring(7)
    if (token !== this.apiConfig.auth.secret) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    next()
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.version
      })
    })

    // Status endpoint
    this.app.get('/status', (req, res) => {
      res.json({
        agent: {
          id: this.agent?.id || 'unknown',
          status: this.agent?.status || 'unknown',
          uptime: process.uptime()
        },
        extensions: {
          loaded: this.agent?.extensions?.length || 0,
          active: this.agent?.extensions?.filter(ext => ext.enabled).length || 0
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal
        }
      })
    })

    // Chat endpoint
    this.app.post('/chat', async (req, res) => {
      try {
        const chatRequest: ChatRequest = req.body
        if (!chatRequest.message) {
          res.status(400).json({ error: 'Message is required' })
          return
        }

        // Process chat message through agent
        const response = await this.processChatMessage(chatRequest)
        res.json(response)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    // Memory endpoints
    this.app.get('/memory', async (req, res) => {
      try {
        const memories = await this.getMemories()
        res.json({ memories })
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve memories' })
      }
    })

    this.app.post('/memory', async (req, res) => {
      try {
        const memoryRequest: MemoryRequest = req.body
        const result = await this.storeMemory(memoryRequest)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Failed to store memory' })
      }
    })

    // Action endpoint
    this.app.post('/action', async (req, res) => {
      try {
        const actionRequest: ActionRequest = req.body
        const result = await this.executeAction(actionRequest)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Failed to execute action' })
      }
    })
  }

  private async processChatMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.agent) {
      return {
        response: 'Agent not initialized',
        timestamp: new Date().toISOString()
      }
    }

    if (!this.agent.portal) {
      return {
        response: 'No portal configured for agent',
        timestamp: new Date().toISOString()
      }
    }

    const messages = [{ role: 'user', content: request.message }]

    const start = Date.now()
    try {
      const result = await this.agent.portal.generateChat(messages as any, {
        maxTokens: request.options?.maxTokens
      })

      return {
        response: result.message.content,
        sessionId: request.context?.sessionId,
        timestamp: new Date().toISOString(),
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          processingTime: Date.now() - start
        }
      }
    } catch (error) {
      console.error('Chat processing error:', error)
      return {
        response: 'Failed to process chat',
        sessionId: request.context?.sessionId,
        timestamp: new Date().toISOString(),
        metadata: { processingTime: Date.now() - start }
      }
    }
  }

  private async getMemories(): Promise<any[]> {
    if (!this.agent) return []

    try {
      return await this.agent.memory.retrieve(this.agent.id, 'recent', 20)
    } catch (error) {
      console.error('Memory retrieval error:', error)
      return []
    }
  }

  private async storeMemory(request: MemoryRequest): Promise<MemoryResponse> {
    if (!this.agent) {
      return {
        success: false,
        id: '',
        timestamp: new Date().toISOString(),
        error: 'Agent not initialized'
      }
    }

    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId: this.agent.id,
      type: (request.type as any) || 'experience',
      content: request.content,
      metadata: request.metadata || {},
      importance: 0.5,
      timestamp: new Date(),
      tags: [],
      duration: 'long_term'
    }

    try {
      await this.agent.memory.store(this.agent.id, memory as any)
      return {
        success: true,
        id: memory.id,
        timestamp: memory.timestamp.toISOString()
      }
    } catch (error) {
      console.error('Memory storage error:', error)
      return {
        success: false,
        id: memory.id,
        timestamp: memory.timestamp.toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async executeAction(request: ActionRequest): Promise<ActionResponse> {
    if (!this.agent) {
      return { success: false, executionTime: 0, error: 'Agent not initialized' }
    }

    const start = Date.now()

    for (const ext of this.agent.extensions) {
      const action = ext.actions[request.action]
      if (action) {
        try {
          const res = await action.execute(this.agent, request.parameters || {})
          return {
            success: res.success,
            result: res.result,
            error: res.error,
            executionTime: Date.now() - start
          }
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            executionTime: Date.now() - start
          }
        }
      }
    }

    return {
      success: false,
      error: `Action '${request.action}' not found`,
      executionTime: Date.now() - start
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app)
        
        // Setup WebSocket server if enabled
        if (this.apiConfig.websocket.enabled) {
          this.setupWebSocketServer()
        }

        this.server.listen(this.apiConfig.port, this.apiConfig.host, () => {
          console.log(`🚀 API Server running on ${this.apiConfig.host}:${this.apiConfig.port}`)
          this.status = ExtensionStatus.ENABLED
          resolve()
        })

        this.server.on('error', (error) => {
          console.error('❌ API Server error:', error)
          this.status = ExtensionStatus.ERROR
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close()
      }

      if (this.server) {
        this.server.close(() => {
          console.log('🛑 API Server stopped')
          this.status = ExtensionStatus.DISABLED
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  private setupWebSocketServer(): void {
    if (!this.server) return

    this.wss = new WebSocketServer({ 
      server: this.server,
      path: this.apiConfig.websocket.path
    })

    this.wss.on('connection', (ws: WebSocket, req) => {
      const connectionId = this.generateConnectionId()
      this.connections.set(connectionId, ws)

      console.log(`🔌 WebSocket client connected: ${connectionId}`)

      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          await this.handleWebSocketMessage(connectionId, message)
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }))
        }
      })

      ws.on('close', () => {
        this.connections.delete(connectionId)
        console.log(`🔌 WebSocket client disconnected: ${connectionId}`)
      })

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${connectionId}:`, error)
        this.connections.delete(connectionId)
      })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        connectionId,
        timestamp: new Date().toISOString()
      }))
    })
  }

  private async handleWebSocketMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const ws = this.connections.get(connectionId)
    if (!ws) return

    try {
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
          break
        case 'chat':
          // Handle chat message
          const response = await this.processChatMessage({ message: message.data })
          ws.send(JSON.stringify({ type: 'chat_response', data: response }))
          break
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }))
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Failed to process message' }))
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  getConnectionInfo(): ConnectionInfo[] {
    return Array.from(this.connections.entries()).map(([id, ws]) => ({
      id,
      readyState: ws.readyState,
      connectedAt: new Date().toISOString() // This would need to be tracked properly
    }))
  }
}