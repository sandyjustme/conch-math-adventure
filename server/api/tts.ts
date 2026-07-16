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
    const body = await req.json();
    const payload = {
      app: { appid: appId, token, cluster: "volcano_tts" },
      user: { uid: "conch-student" },
      audio: {
        voice_type: "zh_female_qingxin",
        encoding: "mp3",
        speed_ratio: 0.9,
      },
      request: { text: body.text, text_type: "plain" },
    };

    const response = await fetch(
      "https://openspeech.bytedance.com/api/v1/tts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      status: response.status,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
