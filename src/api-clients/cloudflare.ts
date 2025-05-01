import { env } from "cloudflare:workers";
import { z } from "zod";
import { fetchJSON } from "../utils";

export const fetchBuildDetails = async (buildID: string) => {
	const buildSchema = cfApiSchema(
		z.object({
			build_uuid: z.string().uuid(),
			status: z.string(),
			build_outcome: z.string(),
			initializing_on: z.string().datetime(),
			running_on: z.string().datetime(),
			stopped_on: z.string().datetime(),
			created_on: z.string().datetime(),
			modified_on: z.string().datetime(),
			trigger: z.object({
				trigger_uuid: z.string().uuid(),
				external_script_id: z.string(),
				trigger_name: z.string(),
				build_command: z.string(),
				deploy_command: z.string(),
				root_directory: z.string(),
				branch_includes: z.array(z.string()),
				branch_excludes: z.array(z.string()),
				path_includes: z.array(z.string()),
				path_excludes: z.array(z.string()),
				build_caching_enabled: z.boolean(),
				created_on: z.string().datetime(),
				modified_on: z.string().datetime(),
				deleted_on: z.nullable(z.string().datetime()),
				repo_connection: z.object({
					repo_connection_uuid: z.string().uuid(),
					repo_id: z.string(),
					repo_name: z.string(),
					provider_type: z.string(),
					provider_account_id: z.string(),
					provider_account_name: z.string(),
					created_on: z.string().datetime(),
					modified_on: z.string().datetime(),
					deleted_on: z.nullable(z.string().datetime()),
				}),
			}),
			build_trigger_metadata: z.object({
				build_trigger_source: z.string(),
				branch: z.string(),
				commit_hash: z.string(),
				commit_message: z.string(),
				author: z.string(),
				build_command: z.string(),
				deploy_command: z.string(),
				root_directory: z.string(),
				build_token_uuid: z.string().uuid(),
				environment_variables: z.record(z.any()),
				repo_name: z.string(),
				provider_account_name: z.string(),
				provider_type: z.string(),
			}),
		}),
	);

	return fetchJSON(
		new Request(
			`https://api.cloudflare.com/client/v4/accounts/6a65f0e86fa8713e0c387f51dd44994f/builds/builds/${buildID}`,
			{ headers: CF_API_HEADERS },
		),
		buildSchema,
	);
};

export const fetchBuildLogs = async (buildID: string) => {
	const logsSchema = cfApiSchema(
		z.object({
			cursor: z.string(),
			truncated: z.boolean(),
			lines: z.array(
				z.tuple([
					z.number(), // timestamp
					z.string(), // message
				]),
			),
		}),
	);
	return fetchJSON(
		new Request(
			`https://api.cloudflare.com/client/v4/accounts/6a65f0e86fa8713e0c387f51dd44994f/builds/builds/${buildID}/logs`,
			{ headers: CF_API_HEADERS },
		),
		logsSchema,
	);
};

const CF_API_HEADERS = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };

const cfApiSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
	z.object({
		result: resultSchema,
		success: z.boolean(),
		errors: z.array(z.unknown()),
		messages: z.array(z.unknown()),
	});
