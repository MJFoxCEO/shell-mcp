import type { ZodSchema } from "zod";

export const fetchWithThrow = async (req: Request) => {
  const resp = await fetch(req);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Request (${req.method}) to ${req.url} failed with status ${resp.status}: ${text}`);
  }
  return resp;
};

export const fetchJSON = async <T>(req: Request, schema: ZodSchema<T>) => {
  const resp = await fetchWithThrow(req);
  const body = await resp.json();
  return schema.parse(body);
};
