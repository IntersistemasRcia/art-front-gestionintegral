// server.js

const path = require('path');
const fs = require('fs');

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');

//  Leemos el puerto desde el entorno (inyectado por PM2), o usamos 8600 por defecto
const PORT = process.env.PORT || 8600; 

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificados/api.artmutualrural.org.ar.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificados/api.artmutualrural.org.ar.crt')),
};

app.prepare().then(() => {
  //  Usamos la constante PORT aquí
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Servidor HTTPS nativo corriendo en el puerto ${PORT}`);
  });
});
