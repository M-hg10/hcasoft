const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// API Key doğrulama middleware (örneğin token ile kullanıcıyı buluyor)
const authMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ message: 'API key gerekli' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM firmalar WHERE api_key = $1`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Geçersiz API key' });
    }

    req.kullanici = result.rows[0];
    next();
  } catch (err) {
    console.error('API auth hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Middleware'i tüm rotalara uygula
router.use(authMiddleware);

// 🔍 GET: Mevcut API key’leri getir
router.get('/keys', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM api_keys WHERE kullanici_id = $1 ORDER BY id DESC`,
      [req.kullanici.id]
    );
    res.json({ keys: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Key listesi alınamadı' });
  }
});

// ➕ POST: Yeni API key oluştur
router.post('/keys', async (req, res) => {
  const yeniKey = crypto.randomBytes(32).toString('hex');

  try {
    const result = await pool.query(
      `INSERT INTO api_keys (kullanici_id, api_key) VALUES ($1, $2) RETURNING *`,
      [req.kullanici.id, yeniKey]
    );
    res.status(201).json({ key: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'API key oluşturulamadı' });
  }
});

// ❌ DELETE: Belirli bir API key’i sil
router.delete('/keys/:id', async (req, res) => {
  const keyId = req.params.id;

  try {
    await pool.query(
      `DELETE FROM api_keys WHERE id = $1 AND kullanici_id = $2`,
      [keyId, req.kullanici.id]
    );
    res.json({ message: 'API key silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'API key silinemedi' });
  }
});

// 📜 GET: Kullanım loglarını getir
router.get('/keys/logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM api_key_logs WHERE kullanici_id = $1 ORDER BY tarih DESC`,
      [req.kullanici.id]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Loglar alınamadı' });
  }
});

module.exports = router;
