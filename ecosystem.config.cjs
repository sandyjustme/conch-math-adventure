// PM2 进程管理配置 — 阿里云轻量服务器
// 用法: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "conch",
      script: "serve.cjs",
      // PM2 直接起 serve.cjs，不走 npm start —— 必须在这里传 env-file，
      // 否则 DEEPSEEK_API_KEY / VOLCANO_TTS_* 读不到，TTS 在线上静默失效。
      // 用 if-exists 版本：.env 缺失时不报错启动失败，只是没有凭据。
      // 需要 Node ≥ 20.12。
      node_args: "--env-file-if-exists=.env",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
      // 崩溃自动重启
      autorestart: true,
      // 内存超 200MB 自动重启（防止内存泄漏）
      max_memory_restart: "200M",
      // 日志
      error_file: "/var/log/conch/error.log",
      out_file: "/var/log/conch/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
