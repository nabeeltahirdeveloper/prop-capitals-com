module.exports = {
  apps: [
    {
      name: 'prop-capitals-frontend',
      script: 'server.mjs',
      cwd: '/var/www/prop-capitals-prod/prop-capitals-com/props-capital-frontend',
      exec_mode: 'fork',
      instances: 1,
      env: {
        PORT: 3006,
        NODE_ENV: 'production',
        // IPINFO_TOKEN is provided by the VPS environment / pm2 env, not committed.
      },
    },
  ],
};
