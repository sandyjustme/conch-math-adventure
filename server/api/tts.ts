// 火山引擎 TTS 代理 — 全仓库唯一实现（dev.ts / serve.cjs 共用）。凭据只在服务端。
export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const appId = process.env.VOLCANO_TTS_APP_ID;
  const token = process.env.VOLCANO_TTS_TOKEN;

  if (!appId || !token) {
    return new Response(JSON.stringify({ error: "TTS not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as { text?: unknown };
    const text = body.text;
    if (typeof text !== "string" || !text || text.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const payload = {
      app: { appid: appId, token, cluster: "volcano_tts" },
      user: { uid: "conch-student" },
      audio: {
        // 大模型音色（bigtts 系列），走 volcano_tts 集群 + v1 端点。
        // 可选（该账号已授权）：
        //   zh_female_tianmeixiaoyuan_moon_bigtts  甜美小源 ← 当前
        //   zh_female_linjianvhai_moon_bigtts      邻家女孩
        //   zh_female_qingxinnvsheng_mars_bigtts   清新女声
        //   zh_female_shuangkuaisisi_moon_bigtts   爽快思思
        //   zh_female_wanwanxiaohe_moon_bigtts     湾湾小何（台湾腔）
        // 选甜美小源：甜的声线念渗人的内容，反差本身就是恐怖手法。
        voice_type: "zh_female_tianmeixiaoyuan_moon_bigtts",
        encoding: "mp3",
        speed_ratio: 1.15, // 孩子嫌慢，实测 0.9 会让他拼命点屏幕跳过
      },
      request: {
        // reqid 必填，火山用它做请求去重与排查
        reqid: crypto.randomUUID(),
        text,
        text_type: "plain",
        // operation 必填："query" = 一次性合成（HTTP 非流式）；
        // 缺了会返回 3001 Missing required: request.operation
        operation: "query",
      },
    };

    const response = await fetch(
      "https://openspeech.bytedance.com/api/v1/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 注意分隔符是英文分号不是空格 —— 火山的鉴权就是这么怪，
          // 写成 "Bearer <token>" 会静默鉴权失败。
          Authorization: `Bearer;${token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      }
    );

    // 火山这个接口永远返回 JSON：{ code, message, data: "<base64 mp3>" }。
    // 直接把 body 当 mp3 透传会让前端拿到一坨 JSON 当音频播——必须解出来。
    const result = (await response.json()) as {
      code?: number;
      message?: string;
      data?: string;
    };

    if (result.code !== 3000 || !result.data) {
      console.error("Volcano TTS error:", result.code, result.message);
      return new Response(
        JSON.stringify({
          error: "TTS upstream error",
          code: result.code,
          message: result.message,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const bin = atob(result.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
