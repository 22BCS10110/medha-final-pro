const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function sendFile(filePath, res) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Parse the URL to get pathname (ignore query strings)
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  let requestPath = url.pathname;

  // Route: "/" and "/portal" both serve the download page (index.html)
  if (requestPath === '/' || requestPath === '/portal') {
    requestPath = '/index.html';
  }

  const normalizedPath = path.normalize(requestPath).replace(/^(\.\.[\\/])+/, '');
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  sendFile(filePath, res);
});

server.listen(port, () => {
  console.log(`Medha web frontend running at http://127.0.0.1:${port}`);
  console.log(`  /        → Download page`);
  console.log(`  /portal  → Download page`);
});
