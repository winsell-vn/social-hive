module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/source/Backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '768M',
      min_uptime: '10s',
      kill_timeout: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/source/Backend/logs/pm2-error.log',
      out_file: '/source/Backend/logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'frontend',
      cwd: '/source/Frontend',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '512M',
      min_uptime: '10s',
      kill_timeout: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/source/Frontend/logs/pm2-error.log',
      out_file: '/source/Frontend/logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};