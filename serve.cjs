// 喵喵趣学生产服务器（阿里云 PM2）
// 静态文件 + 限流在本文件；AI/TTS 代理逻辑唯一实现见 server/api/*.ts，
// 由 `npm run build:server` 编译到 server/dist 后在此动态 import。
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");
const API_DIST = path.join(__dirname, "server", "dist", "api");

// 轻量内存限流：每 IP 每分钟最多 30 次 /api 请求
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT;
}
// 每 5 分钟清理过期条目，防止 Map 无限增长
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, rec] of hits) {
    if (rec.start < cutoff) hits.delete(ip);
  }
}, 300_000).unref();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".webmanifest": "application/json",
};

function serveFile(filePath, res) {
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader(
      "Cache-Control",
      ext === ".html" ? "no-cache" : "public, max-age=86400"
    );
    res.end(content);
  } catch {
    // SPA fallback: all non-file routes return index.html
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(path.join(DIST, "index.html")));
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

/** 适配 Node req/res → 标准 Request/Response，复用 server/api 唯一实现 */
async function dispatchApi(req, res, pathname) {
  try {
    const mod =
      pathname === "/api/tts"
        ? await import(path.join(API_DIST, "tts.js"))
        : await import(path.join(API_DIST, "chat.js"));
    const body = await readBody(req);
    const request = new Request(`http://localhost:${PORT}${pathname}`, {
      method: "POST",
      body,
    });
    const response = await mod.handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error("API dispatch error:", e);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split("?")[0];

  if (pathname.startsWith("/api/")) {
    if (req.method !== "POST") {
      res.writeHead(405).end("Method not allowed");
      return;
    }
    const ip = req.socket.remoteAddress || "unknown";
    if (rateLimited(ip)) {
      res.writeHead(429).end(JSON.stringify({ error: "Too many requests" }));
      return;
    }
    if (pathname === "/api/tts" || pathname.startsWith("/api/deepseek/")) {
      return dispatchApi(req, res, pathname);
    }
    res.writeHead(404).end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const resolved = path.normalize(
    path.join(DIST, pathname === "/" ? "index.html" : pathname)
  );
  if (!resolved.startsWith(DIST)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  serveFile(resolved, res);
});

server.listen(PORT, () => {
  console.log(`喵喵趣学 · 服务器已启动 → http://localhost:${PORT}`);
});
