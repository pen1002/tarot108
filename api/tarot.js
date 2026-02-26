js
const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'API Key 미설정' }); return; }

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: req.body.messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const request = https.request(options, function(response) {
    let data = '';
    response.on('data', function(chunk) { data += chunk; });
    response.on('end', function() {
      try {
        const parsed = JSON.parse(data);
        if (response.statusCode !== 200) {
          res.status(response.statusCode).json({ error: parsed.error?.message || '오류' });
        } else {
          res.status(200).json(parsed);
        }
      } catch(e) {
        res.status(500).json({ error: '파싱 오류: ' + data.slice(0, 80) });
      }
    });
  });

  request.on('error', function(e) {
    res.status(500).json({ error: e.message });
  });

  request.write(payload);
  request.end();
};
