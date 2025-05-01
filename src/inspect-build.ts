import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const model = openai("gpt-4o-2024-11-20");

import { fetchBuildDetails, fetchBuildLogs } from "./api-clients/cloudflare";
import { getRepoTree } from "./api-clients/github";

/**
 * Inspects the specified build and returns suggested fixes (if possible).
 * Response includes build logs to provide the client with additional context for debugging.
 */
export const inspectBuild = async (buildID: string) => {
  console.log(`inspecting build ${buildID}`);

  // Hit the cloudflare API to grab build details and logs
  const [details, logs] = await Promise.all([
    fetchBuildDetails(buildID),
    fetchBuildLogs(buildID),
  ]);

  // Use the build details to grab the current tree (file list) from Github
  const repo = details.result.trigger.repo_connection;
  const gitTree = await getRepoTree(
    repo.provider_account_name,
    repo.repo_name,
    details.result.build_trigger_metadata.commit_hash,
  );

  // Pass the info to a model as context and ask it to suggest fixes:
  // For now, we only want to detect and populate a missing wrangler.jsonc.
  // That's a little simple for AI... but we can at least ask it to auto-populate the right values, which is cool. 
  const result = await generateObject({
    model,
    system: `
        You are a debugging machine!
        
        You will be provided information about a Cloudflare Workers Build and you will need to debug it.
        
        For now, you can only validate that the user has remembered to provide a wrangler configuration file.
        If the build failed for an unrelated reason, just say "build failed for an unknown reason. check logs for more info".
        
        If the user forgot the wrangler file, suggest a new 'wrangler.jsonc' based on the following template.
        Use the build details and git tree to figure out the correct values to fill in.
        
        {
          "name": "<fill in the name of the worker>",
          "main": "<find the correct main file based on the framework>",
          "compatibility_date": "2025-04-01",
          "compatibility_flags": ["nodejs_compat"],
          "observability": {
            "enabled": true
          },
          "upload_source_maps": true,
        }
          
        All suggested fixes MUST be formatted as if they were produced by 'git format-patch'.
        We want the user to be apply to directly 'git apply' the changes.
    `,
    prompt: `
        Build details: ${JSON.stringify(details.result, undefined, 2)}
    
        Build Log: ${JSON.stringify(logs.result.lines, undefined, 2)}
        
        Git Tree: ${gitTree}
    `,
    schema: z.object({
      summary: z.string().describe("a one sentence summary of the recommendation"),
      patch: z.nullable(
        z.string().describe("a fix for the issue in git patch format that can be directly applied via 'git apply'"),
      ),
    }),
  });

  return { analysis: result.object, logs: logs.result.lines };
};
