import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inspectBuild } from "./inspect-build";

// Define our MCP server with tools to expose to clients
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Cloudflare Builds",
		version: "0.0.1",
	});

	async init() {
		// Expose a tool to inspect a Workers Build by ID
		this.server.tool(
			"inspect-cloudflare-workers-build",
			{ buildID: z.string() },
			async ({ buildID }) => {
				const result = await inspectBuild(buildID).catch((err => {
					console.error(err);
					return 'Failed to inspect the build'
				}))

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, undefined, 2),
						},
					],
				};
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// @ts-ignore
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-ignore
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
