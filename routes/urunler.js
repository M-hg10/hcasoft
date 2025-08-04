const express = require('express');
const router = express.Router();
const pool = require('../db');
const apiAuth = require('../middleware/auth');

// GET: Belirli bir firma ID'sine ait ürünleri getir
router.get('/:firma_id',apiAuth ,async (req, res) => {
  const { firma_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.*
       FROM urunler u
       
       WHERE u.firma_id = $1`,
      [firma_id]
    );

    res.json({
      urunler: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router;
