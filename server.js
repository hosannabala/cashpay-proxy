const http = require('http');

const TARGET = 'https://api.bitnob.com';
const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // Health check — don't forward to Bitnob
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'cashpay-bitnob-proxy' }));
    return;
  }

  const url = TARGET + req.url;

  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['connection'];
  headers['host'] = 'api.bitnob.com';

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      const options = {
        method: req.method,
        headers,
      };
      if (body && req.method !== 'GET' && req.method !== 'HEAD') {
        options.body = body;
      }

      const response = await fetch(url, options);

      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      res.writeHead(response.status, responseHeaders);
      const responseBody = await response.text();
      res.end(responseBody);
    } catch (err) {
      console.error('[proxy] error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`CashPay Bitnob proxy running on port ${PORT}`);
});
