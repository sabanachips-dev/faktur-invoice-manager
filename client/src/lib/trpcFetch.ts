export function isUnexpectedHtmlResponse(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  return response.ok && contentType.includes("text/html");
}

export async function fetchTrpcWithHtmlRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: { fetcher?: typeof fetch; delayMs?: number } = {},
) {
  const fetcher = options.fetcher ?? globalThis.fetch;
  let response = await fetcher(input, init);
  if (!isUnexpectedHtmlResponse(response)) return response;
  await new Promise(resolve => setTimeout(resolve, options.delayMs ?? 350));
  response = await fetcher(input, init);
  return response;
}
