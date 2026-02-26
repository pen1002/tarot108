const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'not allowed' }); return; }
  var apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'no key' }); return; }
  var messages = req.body && req.body.messages ? req.body.messages : [];
  var payload = JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, messages: messages });
  var opts = {
    hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload) }
  };
  var r = https.request(opts, function(response) {
    var chunks = [];
    response.on('data', function(c) { chunks.push(Buffer.from(c)); });
    response.on('end', function() {
      try {
        var body = Buffer.concat(chunks).toString('utf8');
        res.status(response.statusCode).json(JSON.parse(body));
      } catch(e) { res.status(500).json({ error: 'parse error' }); }
    });
  });
  r.on('error', function(e) { res.status(500).json({ error: e.message }); });
  r.write(payload);
  r.end();
};
