const express = require('express');
const router = express.Router();
const pool = require('../db');


// Kategoriler
router.get('/kategoriler', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kategoriler ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Kategoriler çekme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Alt Kategoriler
router.get('/alt-kategoriler', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alt_kategoriler ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Alt kategoriler çekme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ürün Durumları
router.get('/urun-durumlari', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM urun_durumlari ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Ürün durumları çekme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Firmalar
router.get('/firmalar', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM firmalar ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Firmalar çekme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
