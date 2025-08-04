const pool = require('../db');

module.exports = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'API anahtarı eksik' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM firmalar WHERE api_key = $1 AND aktif = true`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Geçersiz veya pasif API anahtarı' });
    }

    // kullanıcı bilgisi middleware sonrası kullanılabilir
    req.kullanici = result.rows[0];
    next();
  } catch (err) {
    console.error('API key kontrol hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};


// const apiAuth = require('../middleware/auth'); // API key kontrolü
// router.get('/:firma_id', apiAuth, async (req, res) => { ... });
// x-api-key: *****
