const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const Busboy = require('busboy');

const PORT = 3016;
const UPLOAD_DIR = '/workspace/public/video-assets';
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function json(res, code, data) {
  if (res.headersSent) return;
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Filename, X-Original-Name',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Filename, X-Original-Name',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ========== POST /upload ==========
  if (url.pathname === '/upload' && req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return json(res, 400, { error: 'Use multipart/form-data' });
    }

    let bb;
    try {
      bb = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
    } catch (e) {
      return json(res, 400, { error: 'Invalid request: ' + e.message });
    }

    // Track whether we got a file and whether write is done
    let fileReceived = false;
    let writeFinished = false;
    let bbClosed = false;
    let responded = false;
    let result = null;

    function tryRespond() {
      if (responded) return;
      if (writeFinished) {
        responded = true;
        json(res, 200, result);
      } else if (bbClosed && !fileReceived) {
        responded = true;
        json(res, 400, { error: 'No file found in upload' });
      }
    }

    bb.on('file', (fieldname, stream, info) => {
      fileReceived = true;
      const originalName = info.filename || 'video.mp4';
      const ext = path.extname(originalName) || '.mp4';
      const baseName = path.basename(originalName, ext)
        .replace(/[^a-zA-Z0-9\u4e00-\u9fff_\-\.]/g, '_')
        .slice(0, 80);
      const suffix = randomBytes(4).toString('hex');
      const savedName = `${baseName}_${suffix}${ext}`;
      const savedPath = path.join(UPLOAD_DIR, savedName);

      let fileSize = 0;
      let truncated = false;
      const ws = fs.createWriteStream(savedPath);

      stream.on('data', chunk => { fileSize += chunk.length; });
      stream.on('limit', () => { truncated = true; });
      stream.pipe(ws);

      ws.on('finish', () => {
        if (truncated) {
          try { fs.unlinkSync(savedPath); } catch {}
          if (!responded) {
            responded = true;
            json(res, 413, { error: `File too large. Max ${MAX_SIZE / 1024 / 1024}MB` });
          }
          return;
        }

        const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
        console.log(`[upload] ${originalName} → ${savedName} (${sizeMB}MB)`);

        result = {
          ok: true,
          originalName,
          savedName,
          url: `/video-assets/${savedName}`,
          size: fileSize,
          sizeHuman: fileSize > 1024 * 1024 ? `${sizeMB}MB` : `${(fileSize / 1024).toFixed(1)}KB`
        };
        writeFinished = true;
        tryRespond();
      });

      ws.on('error', err => {
        console.error('[upload write error]', err);
        if (!responded) { responded = true; json(res, 500, { error: 'Write error: ' + err.message }); }
      });
    });

    bb.on('close', () => {
      bbClosed = true;
      tryRespond();
    });

    bb.on('error', err => {
      console.error('[busboy error]', err);
      if (!responded) { responded = true; json(res, 500, { error: 'Parse error: ' + err.message }); }
    });

    req.pipe(bb);
    return;
  }

  // ========== GET /list ==========
  if (url.pathname === '/list' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(UPLOAD_DIR)
        .filter(f => /\.(mp4|webm|mov|avi|mkv)$/i.test(f))
        .map(f => {
          const stat = fs.statSync(path.join(UPLOAD_DIR, f));
          return {
            name: f,
            url: `/video-assets/${f}`,
            size: stat.size,
            sizeHuman: stat.size > 1024 * 1024
              ? `${(stat.size / 1024 / 1024).toFixed(2)}MB`
              : `${(stat.size / 1024).toFixed(1)}KB`,
            modified: stat.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
      return json(res, 200, { files, count: files.length });
    } catch (e) {
      return json(res, 500, { error: e.message });
    }
  }

  // ========== POST /delete ==========
  if (url.pathname === '/delete' && req.method === 'POST') {
    const body = await new Promise(resolve => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch { resolve({}); } });
    });
    const name = body.name;
    if (!name) return json(res, 400, { error: 'Missing name' });
    const fp = path.join(UPLOAD_DIR, path.basename(name));
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      return json(res, 200, { ok: true, deleted: name });
    }
    return json(res, 404, { error: 'File not found' });
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Upload API on :${PORT} (busboy streaming)`);
  console.log(`  Upload dir: ${UPLOAD_DIR}`);
  console.log(`  Max: ${MAX_SIZE / 1024 / 1024}MB`);
});
