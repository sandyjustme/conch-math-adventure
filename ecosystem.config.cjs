// PM2 进程管理配置 — 阿里云轻量服务器
// 用法: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "conch",
      script: "serve.cjs",
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
