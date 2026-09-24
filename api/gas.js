// api/gas.js
const GAS_URL = "https://script.google.com/macros/s/AKfycbxPK0ENPGf4RuA-IFLKYE1nd7FRDdqjn0-O5aKkdAggIGSvU0fkLVG0PVCoM3i9Ru1BfA/exec";

module.exports = async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      redirect: 'follow'
    });

    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Proxy error: ' + e.message });
  }
};

module.exports.config = { maxDuration: 60 };
