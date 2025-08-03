const express = require('express');
const router = express.Router();
const pool = require('../db'); // db bağlantısı
// const bcrypt = require('bcrypt'); // Şifreler hashli ise aç

// POST: Kullanıcı kodu + şifre ile giriş ve veri döndürme
router.post('/', async (req, res) => {
  const { kullanici_kodu, sifre } = req.body;

  try {
    const firmaResult = await pool.query(
      'SELECT * FROM firmalar WHERE kullanici_kodu = $1',
      [kullanici_kodu]
    );

    if (firmaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const firma = firmaResult.rows[0];

    if (firma.sifre !== sifre) {
      return res.status(401).json({ message: 'Şifre hatalı' });
    }

    // Ürünleri kategori ve marka ile getir
    const urunler = await pool.query(
      `SELECT u.*, k.kategori_adi, m.marka_adi 
       FROM urunler u
       LEFT JOIN kategoriler k ON u.kategori_id = k.id
       LEFT JOIN markalar m ON u.marka_id = m.id
       WHERE u.firma_id = $1`,
      [firma.id]
    );

    // Favori ürünleri getir
    const favoriler = await pool.query(
      `SELECT fu.*, u.urun_adi, u.gorsel_url
       FROM favori_urunler fu
       INNER JOIN urunler u ON fu.urun_id = u.id
       WHERE fu.kullanici_id = $1`,
      [firma.id]
    );

    // Sipariş geçmişini getir
    const siparisler = await pool.query(
      `SELECT s.*, su.urun_id, su.adet, u.urun_adi
       FROM siparisler s
       LEFT JOIN siparis_urunleri su ON s.id = su.siparis_id
       LEFT JOIN urunler u ON su.urun_id = u.id
       WHERE s.kullanici_id = $1
       ORDER BY s.tarih DESC`,
      [firma.id]
    );

    // JSON yanıtı
    res.json({
      kullanici: {
        id: firma.id,
        ad: firma.ad,
        kullanici_turu: firma.kullanici_turu
      },
      urunler: urunler.rows,
      favoriler: favoriler.rows,
      siparisler: siparisler.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router;
