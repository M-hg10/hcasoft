
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// En çok satan ürünler - GET /api/raporlar/en-cok-satan
router.get('/en-cok-satan', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        u.urun_adi,
        SUM(sd.miktar) as toplam_satilan,
        SUM(sd.miktar * sd.birim_fiyat) as toplam_ciro
      FROM urunler u
      JOIN satis_detaylari sd ON u.id = sd.urun_id
      GROUP BY u.id, u.urun_adi
      ORDER BY toplam_satilan DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('En çok satan ürünler hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor oluşturulamadı'
    });
  }
});

// Kritik stok raporu - GET /api/raporlar/kritik-stok
router.get('/kritik-stok', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        urun_adi,
        stok_miktari,
        minimum_stok,
        CASE 
          WHEN stok_miktari = 0 THEN 'TÜKENDI'
          WHEN stok_miktari <= minimum_stok THEN 'KRİTİK'
          ELSE 'DÜŞÜK'
        END as durum
      FROM urunler
      WHERE stok_miktari <= minimum_stok
      ORDER BY stok_miktari ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Kritik stok raporu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kritik stok raporu oluşturulamadı'
    });
  }
});

module.exports = router;