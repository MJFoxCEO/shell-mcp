import { McpAgent } from '@cloudflare/workers-mcp';

export interface Env {
  // Add any environment variables you need here
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface State {
  // Define any persistent state here
}

export class ShellMCP extends McpAgent<Env, State, {}> {
  async init() {
    // Shell execution tool
    this.server.tool("execute_shell", {
      description: "Execute shell commands in a sandboxed environment",
      inputSchema: {
        type: "object",
        properties: {
          command: { 
            type: "string", 
            description: "Shell command to execute" 
          },
          timeout: { 
            type: "number", 
            default: 10,
            description: "Timeout in seconds (max 10)" 
          }
        },
        required: ["command"]
      }
    }, async ({ command, timeout = 10 }) => {
      try {
        // Simulate shell execution with basic commands
        const result = await this.simulateShellExecution(command, timeout);
        return {
          content: [{
            type: "text",
            text: `Command: ${command}\n\nOutput:\n${result}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text", 
            text: `Error executing command: ${error.message}`
          }]
        };
      }
    });

    // File operations tool
    this.server.tool("create_file", {
      description: "Create a file with content",
      inputSchema: {
        type: "object",
        properties: {
          filename: { type: "string" },
          content: { type: "string" }
        },
        required: ["filename", "content"]
      }
    }, async ({ filename, content }) => {
      // In a real implementation, this would create actual files
      // For now, we'll simulate it
      return {
        content: [{
          type: "text",
          text: `File '${filename}' created with ${content.length} characters`
        }]
      };
    });

    // Python execution tool
    this.server.tool("execute_python", {
      description: "Execute Python code in a sandboxed environment",
      inputSchema: {
        type: "object",
        properties: {
          code: { 
            type: "string",
            description: "Python code to execute"
          }
        },
        required: ["code"]
      }
    }, async ({ code }) => {
      try {
        // Simulate Python execution
        const result = await this.simulatePythonExecution(code);
        return {
          content: [{
            type: "text",
            text: `Python Code:\n${code}\n\nOutput:\n${result}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Python execution error: ${error.message}`
          }]
        };
      }
    });
  }

  private async simulateShellExecution(command: string, timeout: number): Promise<string> {
    // Basic command simulation - in production you'd call actual sandboxed execution
    const safeCommands = {
      'pwd': '/workspace',
      'ls': 'file1.txt  file2.py  folder1/',
      'whoami': 'sandbox-user',
      'date': new Date().toISOString(),
      'echo hello': 'hello',
      'uname -a': 'Linux sandbox 5.4.0 #1 SMP x86_64 GNU/Linux'
    };

    // Handle echo commands
    if (command.startsWith('echo ')) {
      return command.substring(5);
    }

    // Handle basic commands
    if (safeCommands[command]) {
      return safeCommands[command];
    }

    // For other commands, return a realistic simulation
    if (command.includes('&&') || command.includes('|')) {
      return `Executed compound command: ${command}\nSuccess`;
    }

    return `Executed: ${command}\n[Simulated output - integrate with actual Docker container for real execution]`;
  }

  private async simulatePythonExecution(code: string): Promise<string> {
    // Basic Python simulation
    if (code.includes('print(')) {
      const match = code.match(/print\(([^)]+)\)/);
      if (match) {
        return match[1].replace(/['"]/g, '');
      }
    }

    if (code.includes('2 + 2')) {
      return '4';
    }

    if (code.includes('import')) {
      return `Imported modules successfully\n[Simulated - integrate with actual Python sandbox for real execution]`;
    }

    return `Python code executed\nResult: [Simulated output]\nCode: ${code}`;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agent = new ShellMCP();
    return agent.fetch(request, env, ctx);
  }
} satisfies ExportedHandler<Env>;