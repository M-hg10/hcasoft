const express = require('express');
const router = express.Router();
const pool = require('./db');

// Tüm firmaları getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM firmalar');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Sunucu hatası');
  }
});

// Firma ekle
router.post('/', async (req, res) => {
  const { kullanici_kodu, sifre, firma_adi, adres, telefon, email, web_sitesi } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO firmalar (kullanici_kodu, sifre, firma_adi, adres, telefon, email, web_sitesi)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [kullanici_kodu, sifre, firma_adi, adres, telefon, email, web_sitesi]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Firma eklenemedi');
  }
});

router.get('/kullanici', async (req, res) => {
  try {
    const result = await pool.query('SELECT kullanici_kodu, sifre FROM firmalar');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Firmalar getirilemedi');
  }
});

module.exports = router;
