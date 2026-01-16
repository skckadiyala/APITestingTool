module.exports = {
  apps: [
    {
      name: 'api-testing-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      combine_logs: true
    },
    {
      name: 'api-testing-frontend',
      cwd: './frontend',
      script: 'C:\\Users\\sumakad\\AppData\\Roaming\\npm\\node_modules\\serve\\build\\main.js',
      args: 'dist -l 5173',
      env: {
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      combine_logs: true
    }
  ]
};