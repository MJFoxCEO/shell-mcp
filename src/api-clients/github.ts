import { env } from "cloudflare:workers";
import { fetchWithThrow } from "../utils";

export const getRepoTree = async (owner: string, repo: string, ref: string) => {
	const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=true`;

	const headers = {
		"X-GitHub-Api-Version": "2022-11-28",
		Authorization: `Bearer ${env.GITHUB_TOKEN}`,
		"User-Agent": "test-agent",
	};

	const resp = await fetchWithThrow(new Request(url, { headers }));
	return resp.text();
};
