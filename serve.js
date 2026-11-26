// Máy chủ tĩnh nhỏ để chạy thử game trên máy tính: node serve.js  → http://localhost:5200
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "www");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(process.env.PORT || 5200, () => console.log("Brick Keep: http://localhost:" + (process.env.PORT || 5200)));
