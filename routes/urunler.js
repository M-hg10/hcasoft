const express = require('express');
const router = express.Router();
const pool = require('../db'); // db bağlantısı
// const bcrypt = require('bcrypt'); // Şifreler hashli ise aç

// POST: Kullanıcı kodu + şifre ile ürünleri getir
router.post('/', async (req, res) => {
  const { kullanici_kodu, sifre } = req.body;

  try {
    // 1. Kullanıcıyı bul
    const firmaResult = await pool.query(
      'SELECT * FROM firmalar WHERE kullanici_kodu = $1',
      [kullanici_kodu]
    );

    if (firmaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const firma = firmaResult.rows[0];

    // 2. Şifre kontrolü
    if (firma.sifre !== sifre) {
      // eğer hashliyse: if (!await bcrypt.compare(sifre, firma.sifre))
      return res.status(401).json({ message: 'Şifre hatalı' });
    }

    // 3. Firma ID'sine göre ürünleri getir
    const urunResult = await pool.query(
      'SELECT * FROM urunler WHERE firma_id = $1',
      [firma.id]
    );

    res.json(urunResult.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
