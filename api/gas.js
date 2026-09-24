// api/gas.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbxPK0ENPGf4RuA-IFLKYE1nd7FRDdqjn0-O5aKkdAggIGSvU0fkLVG0PVCoM3i9Ru1BfA/exec";

module.exports = async (req, res) => {
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  let lastText = '';
  let lastStatus = 0;

  // Coba sampai 3x: kadang echo Google juga gagal saat diakses server
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

      // Balasan sehat = JSON dari Apps Script
      if (text.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(text);
      }
    } catch (e) {
      lastText = 'Proxy error: ' + e.message;
      lastStatus = 0;
    }

    await new Promise(function (r) { setTimeout(r, 800 * coba); });
  }

  // Kalau 3x gagal, balas JSON error yang rapi supaya UI bisa menampilkan pesannya
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify({
    status: 'error',
    message: 'Apps Script tidak mengembalikan JSON yang valid (status ' + lastStatus +
             '). Cuplikan: ' + String(lastText).substring(0, 160)
  }));
};

module.exports.config = { maxDuration: 60 };
