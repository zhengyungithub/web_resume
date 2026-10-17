// PM2 进程配置
// 启动：pm2 startOrReload deploy/ecosystem.config.cjs --update-env
// 查看：pm2 logs zhengyun-api
module.exports = {
  apps: [
    {
      name: 'zhengyun-api',
      script: 'server.js',
      cwd: '/var/www/zhengyun/app',
      instances: 1,           // 2G 内存的轻量服务器跑单实例足够，也避免内存里两份检索索引
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '320M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      out_file: '/var/log/zhengyun/api.out.log',
      error_file: '/var/log/zhengyun/api.err.log',
      merge_logs: true,
      time: true
    }
  ]
};
