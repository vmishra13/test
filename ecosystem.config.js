module.exports = {
  apps: [{
    name: 'reliacare-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
      // PM2 will automatically load environment variables
      // from the system environment where it runs
    }
  }]
};
