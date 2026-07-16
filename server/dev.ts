import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve } from "path";

const PORT = process.env.PORT || 3456;

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

  if (url.pathname === "/api/chat" && req.method === "POST") {
    const { handler } = await import("./api/chat");
    const body = await readBody(req);
    const request = new Request(`http://localhost:${PORT}/api/chat`, {
      method: "POST",
      body,
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));
    return;
  }

  if (url.pathname === "/api/tts" && req.method === "POST") {
    const { handler } = await import("./api/tts");
    const body = await readBody(req);
    const request = new Request(`http://localhost:${PORT}/api/tts`, {
      method: "POST",
      body,
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

function readBody(
  req: ReturnType<typeof createServer> extends { on: infer T } ? any : any
): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

server.listen(PORT, () => {
  console.log(`API proxy running on http://localhost:${PORT}`);
});
