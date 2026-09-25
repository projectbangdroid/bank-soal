// api/gas.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbxPK0ENPGf4RuA-IFLKYE1nd7FRDdqjn0-O5aKkdAggIGSvU0fkLVG0PVCoM3i9Ru1BfA/exec";

async function bacaBody(req) {
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  if (typeof req.body === 'string' && req.body.length) return req.body;

  // body text/plain harus dibaca manual dari stream
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

module.exports = async (req, res) => {
  // Buka /api/gas di browser -> harus muncul {"ok":true}
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, pesan: 'Proxy aktif. Gunakan POST untuk memanggil Apps Script.' });
  }

  const body = await bacaBody(req);
  if (!body) {
    return res.status(200).json({ status: 'error', message: 'Body request kosong.' });
  }

  console.log('[proxy] body masuk:', body.substring(0, 120));

  let lastText = '';
  let lastStatus = 0;

  for (let coba = 1; coba <= 3; coba++) {
    try {
      const r = await fetch(GAS_URL + '?t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: body,
        redirect: 'follow'
      });

      const text = await r.text();
      lastText = text;
      lastStatus = r.status;

      console.log('[proxy] percobaan', coba, '-> HTTP', r.status, '| awal:', text.substring(0, 80));

      if (text.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(text);
      }
    } catch (e) {
      lastText = 'Fetch error: ' + e.message;
      lastStatus = 0;
      console.log('[proxy] fetch error:', e.message);
    }

    await new Promise((r) => setTimeout(r, 800 * coba));
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify({
    status: 'error',
    message: 'Apps Script tidak mengembalikan JSON (status ' + lastStatus + '). Cuplikan: ' +
             String(lastText).replace(/\s+/g, ' ').substring(0, 160)
  }));
};

module.exports.config = { maxDuration: 60 };
