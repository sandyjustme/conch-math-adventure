import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";

const PORT = process.env.PORT || 3456;

/** 把 Node req/res 适配成标准 Request/Response，交给 server/api 下的唯一实现 */
async function dispatch(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
) {
  const mod =
    pathname === "/api/tts"
      ? await import("./api/tts")
      : await import("./api/chat");
  const body = await readBody(req);
  const request = new Request(`http://localhost:${PORT}${pathname}`, {
    method: "POST",
    body,
  });
  const response = await mod.handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  const buf = await response.arrayBuffer();
  res.end(Buffer.from(buf));
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (
    req.method === "POST" &&
    (url.pathname === "/api/tts" || url.pathname.startsWith("/api/deepseek/"))
  ) {
    await dispatch(req, res, url.pathname);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

server.listen(PORT, () => {
  console.log(`API proxy running on http://localhost:${PORT}`);
});
