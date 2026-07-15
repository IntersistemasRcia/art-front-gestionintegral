module.exports = {
  apps: [
    {
      name: process.env.SITE_NAME || "ArtFrontGestionIntegral",
      script: "server.js", // Directo al archivo custom
      cwd: "C:\\inetpub\\sitios\\ArtFrontGestionIntegral", // Asegura el directorio de trabajo en Windows
      interpreter: "node",
      exec_mode: "fork",
      out_file: "./_deploy_logs/pm2_out.log",
      error_file: "./_deploy_logs/pm2_err.log",
      env_file: ".env.production", 
      env: {
        NODE_ENV: "production",
        PORT: 8600
      }
    }
  ]
};
