module.exports = {
  apps: [
    {
      // Use SITE_NAME environment variable if provided by the runner, otherwise fallback
      name: process.env.SITE_NAME || "ArtFrontGestionIntegral",

      // Run Next's start script directly with node to avoid invoking npm on Windows
      // and prevent PM2 from attempting to parse npm.cmd as JS.
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 8600",
      interpreter: "node",
      exec_mode: "fork",

      // Capture logs to a deploy logs folder (runner should create/own this folder)
      out_file: "./_deploy_logs/pm2_out.log",
      error_file: "./_deploy_logs/pm2_err.log",

      env: {
        NODE_ENV: "production",
        PORT: 8600,
      },
    },
  ],
};
