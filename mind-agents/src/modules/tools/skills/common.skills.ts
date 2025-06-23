import { ToolSpec } from '../../../../extensions/mcp-client/types';
import type { DynamicToolSystem } from '..';

/**
 * Creates common tool specifications for the SYMindX system
 */
export function createCommonToolSpecs(system: DynamicToolSystem): ToolSpec[] {
  const executeCode: ToolSpec = {
    id: 'execute-code',
    name: 'Execute Code',
    description: 'Execute code in a sandboxed environment',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The code to execute' },
        language: {
          type: 'string',
          enum: ['javascript', 'typescript', 'python'],
          default: 'javascript',
          description: 'The programming language of the code'
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in milliseconds',
          default: 30000
        }
      },
      required: ['code']
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeCodeTool(this, input);
    }
  };

  const runCommand: ToolSpec = {
    id: 'run-command',
    name: 'Run Command',
    description: 'Run a terminal command',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to run' },
        args: {
          type: 'array',
          items: { type: 'string' },
          default: [],
          description: 'Command-line arguments'
        },
        cwd: { type: 'string', description: 'Working directory for the command' },
        env: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Environment variables'
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in milliseconds'
        }
      },
      required: ['command']
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeTerminalTool(this, input);
    }
  };

  const readFile: ToolSpec = {
    id: 'read-file',
    name: 'Read File',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to read' },
        encoding: {
          type: 'string',
          enum: ['utf8', 'base64', 'hex'],
          default: 'utf8',
          description: 'File encoding'
        }
      },
      required: ['path']
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeCodeTool(this, input);
    }
  };

  const writeFile: ToolSpec = {
    id: 'write-file',
    name: 'Write File',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to write' },
        content: { type: 'string', description: 'Content to write to the file' },
        encoding: {
          type: 'string',
          enum: ['utf8', 'base64', 'hex'],
          default: 'utf8',
          description: 'File encoding'
        },
        mode: {
          type: 'string',
          enum: ['write', 'append', 'overwrite'],
          default: 'write',
          description: 'Write mode'
        }
      },
      required: ['path', 'content']
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeCodeTool(this, input);
    }
  };

  const listDirectory: ToolSpec = {
    id: 'list-directory',
    name: 'List Directory',
    description: 'List the contents of a directory',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the directory to list',
          default: '.'
        },
        recursive: {
          type: 'boolean',
          default: false,
          description: 'Whether to list contents recursively'
        },
        include: {
          type: 'string',
          description: 'Glob pattern to filter files',
          default: '**/*'
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'Glob patterns to exclude',
          default: []
        }
      }
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeCodeTool(this, input);
    }
  };

  const httpRequest: ToolSpec = {
    id: 'http-request',
    name: 'HTTP Request',
    description: 'Make an HTTP request',
    parameters: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          default: 'GET',
          description: 'HTTP method'
        },
        url: { type: 'string', description: 'The URL to make the request to' },
        headers: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Request headers'
        },
        params: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'URL parameters'
        },
        data: { type: ['string', 'object'], description: 'Request body data' },
        timeout: { type: 'number', description: 'Request timeout in milliseconds' },
        responseType: {
          type: 'string',
          enum: ['json', 'text', 'arraybuffer', 'stream'],
          default: 'json',
          description: 'Expected response type'
        }
      },
      required: ['url']
    },
    async execute(this: ToolSpec, input: any) {
      return system.executeCodeTool(this, input);
    }
  };

  return [
    executeCode,
    runCommand,
    readFile,
    writeFile,
    listDirectory,
    httpRequest
  ];
}
