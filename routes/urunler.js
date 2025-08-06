// urunler.js

const express = require('express');
const router = express.Router();
const pool = require('../db'); // Veritabanı bağlantısı buradan yapılır

// ÜRÜN EKLEME ENDPOINT'İ
// POST /api/urunler
router.post('/', async (req, res) => {
  console.log('Gelen body:', req.body);
  try {
    // İstek gövdesinden gelen verileri al
    const {
      isim,
      aciklama,
      kisa_aciklama,
      aktif,
      kategori_id,
      marka,
      urun_durumu_id,
      alt_kategori_id,
      firma_id
    } = req.body;

    // Gerekli kontroller (örneğin zorunlu alanlar)
    if (!isim || !kategori_id) {
      return res.status(400).json({ message: 'Zorunlu alanlar eksik' });
    }

    // Ürünü veritabanına ekle
    const result = await pool.query(
      `INSERT INTO urunler (
        isim,
        aciklama,
        kisa_aciklama,
        aktif,
        kategori_id,
        marka,
        urun_durumu_id,
        alt_kategori_id,
        firma_id
        tarih
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        isim,
        aciklama || null,
        kisa_aciklama || null,
        aktif ?? true, // Varsayılan olarak true
        kategori_id,
        marka || null,
        urun_durumu_id || null,
        alt_kategori_id || null,
        firma_id || null
        
      ]
    );

    // Başarıyla eklenmiş ürünü döndür
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;


router.get('/:firma_id', async (req, res) => {
  const { firma_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        urunler.*,
        kategoriler.isim AS kategori_adi,
        alt_kategoriler.isim AS alt_kategori_adi,
        urun_durumlari.ad AS urun_durumu,
        firmalar.firma_adi AS firma_adi
      FROM urunler
      LEFT JOIN kategoriler ON urunler.kategori_id = kategoriler.id
      LEFT JOIN alt_kategoriler ON urunler.alt_kategori_id = alt_kategoriler.id
      LEFT JOIN urun_durumlari ON urunler.urun_durumu_id = urun_durumlari.id
      LEFT JOIN firmalar ON urunler.firma_id = firmalar.id
      WHERE urunler.firma_id = $1
      ORDER BY urunler.id DESC`,
      [firma_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Firma filtreleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

