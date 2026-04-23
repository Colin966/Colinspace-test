module.exports = {
  apps: [
    {
      name: 'colinspace-app',
      script: 'server.js',
      // 使用单进程模式，配置简单，适合当前小型项目
      instances: 1,
      exec_mode: 'fork',
      // 服务异常退出后自动拉起，避免手动重启
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // 统一日志文件，便于排查线上问题
      out_file: 'pm2-out.log',
      error_file: 'pm2-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
