const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const TTS_APP_ID = process.env.VOLCANO_TTS_APP_ID || "";
const TTS_TOKEN = process.env.VOLCANO_TTS_TOKEN || "";
const DIST = path.join(__dirname, "dist");

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

function proxyDeepseek(req, res) {
  if (!API_KEY) {
    res.writeHead(500).end(JSON.stringify({ error: "API key not configured" }));
    return;
  }
  const apiPath = req.url.replace("/api/deepseek/", "");
  const body = [];
  req.on("data", (chunk) => body.push(chunk));
  req.on("end", async () => {
    try {
      const raw = Buffer.concat(body).toString();
      const response = await fetch(`https://api.deepseek.com/${apiPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: raw,
      });
      const data = await response.text();
      res.setHeader("Content-Type", "application/json");
      res.end(data);
    } catch (e) {
      res.writeHead(500).end(JSON.stringify({ error: "Proxy error" }));
    }
  });
}

function proxyTts(req, res) {
  if (!TTS_APP_ID || !TTS_TOKEN) {
    res.writeHead(500).end(JSON.stringify({ error: "TTS not configured" }));
    return;
  }
  const body = [];
  req.on("data", (chunk) => body.push(chunk));
  req.on("end", async () => {
    try {
      const { text } = JSON.parse(Buffer.concat(body).toString());
      if (typeof text !== "string" || !text || text.length > 500) {
        res.writeHead(400).end(JSON.stringify({ error: "Invalid text" }));
        return;
      }
      const response = await fetch(
        "https://openspeech.bytedance.com/api/v1/tts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app: {
              appid: TTS_APP_ID,
              token: TTS_TOKEN,
              cluster: "volcano_tts",
            },
            user: { uid: "conch-student" },
            audio: {
              voice_type: "zh_female_qingxin",
              encoding: "mp3",
              speed_ratio: 0.9,
            },
            request: { text, text_type: "plain" },
          }),
        }
      );
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      res.writeHead(response.status, {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      });
      res.end(audioBuffer);
    } catch (e) {
      res.writeHead(500).end(JSON.stringify({ error: "TTS proxy error" }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    if (req.method !== "POST") {
      res.writeHead(405).end("Method not allowed");
      return;
    }
    const ip = req.socket.remoteAddress || "unknown";
    if (rateLimited(ip)) {
      res.writeHead(429).end(JSON.stringify({ error: "Too many requests" }));
      return;
    }
    if (req.url.startsWith("/api/deepseek/")) return proxyDeepseek(req, res);
    if (req.url === "/api/tts") return proxyTts(req, res);
    res.writeHead(404).end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let filePath = path.join(
    DIST,
    req.url === "/" ? "index.html" : req.url.split("?")[0]
  );
  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`海螺咖啡馆 · 服务器已启动 → http://localhost:${PORT}`);
});
