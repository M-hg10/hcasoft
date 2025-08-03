// Express.js API: Flutter uygulamaları için uç noktalar
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Giriş - Kullanıcı kodu ve şifre
router.post('/login', async (req, res) => {
  const { kullanici_kodu, sifre } = req.body;
  try {
    const result = await pool.query('SELECT * FROM firmalar WHERE kullanici_kodu = $1', [kullanici_kodu]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    const firma = result.rows[0];
    if (firma.sifre !== sifre) return res.status(401).json({ message: 'Şifre hatalı' });
    res.json({
      kullanici: {
        id: firma.id,
        ad: firma.ad,
        kullanici_turu: firma.kullanici_turu
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ürünler
router.get('/urunler/:firma_id', async (req, res) => {
  const { firma_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.*, k.kategori_adi, m.marka_adi
      FROM urunler u
      LEFT JOIN kategoriler k ON u.kategori_id = k.id
      LEFT JOIN markalar m ON u.marka_id = m.id
      WHERE u.firma_id = $1`, [firma_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Favoriler
router.get('/favoriler/:kullanici_id', async (req, res) => {
  const { kullanici_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT fu.*, u.urun_adi, u.gorsel_url
      FROM favori_urunler fu
      JOIN urunler u ON fu.urun_id = u.id
      WHERE fu.kullanici_id = $1`, [kullanici_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/favoriler', async (req, res) => {
  const { kullanici_id, urun_id } = req.body;
  try {
    await pool.query(`INSERT INTO favori_urunler (kullanici_id, urun_id) VALUES ($1, $2)`, [kullanici_id, urun_id]);
    res.json({ message: 'Favori eklendi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.delete('/favoriler/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM favori_urunler WHERE id = $1`, [id]);
    res.json({ message: 'Favori silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Siparişler
router.get('/siparisler/:kullanici_id', async (req, res) => {
  const { kullanici_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT s.*, su.urun_id, su.adet, u.urun_adi
      FROM siparisler s
      LEFT JOIN siparis_urunleri su ON s.id = su.siparis_id
      LEFT JOIN urunler u ON su.urun_id = u.id
      WHERE s.kullanici_id = $1
      ORDER BY s.tarih DESC`, [kullanici_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/siparisler', async (req, res) => {
  const { kullanici_id, urunler } = req.body; // urunler: [{urun_id, adet}]
  try {
    const result = await pool.query(
      `INSERT INTO siparisler (kullanici_id, tarih) VALUES ($1, NOW()) RETURNING id`,
      [kullanici_id]
    );
    const siparis_id = result.rows[0].id;

    for (const urun of urunler) {
      await pool.query(
        `INSERT INTO siparis_urunleri (siparis_id, urun_id, adet) VALUES ($1, $2, $3)`,
        [siparis_id, urun.urun_id, urun.adet]
      );
    }

    res.json({ message: 'Sipariş oluşturuldu', siparis_id });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;


//  Flutter uygulaman için gereken API uç noktaları:

// POST /api/login → Giriş yap

// GET /api/urunler/:firmaId → Ürün listesi

// GET /api/favoriler/:firmaId → Favoriler

// POST /api/favoriler → Favoriye ekle

// GET /api/siparisler/:firmaId → Sipariş listesi

// POST /api/siparisler → Yeni sipariş oluştur

