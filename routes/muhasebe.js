const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Aylık satış raporu - GET /api/muhasebe/aylik-satis
router.get('/aylik-satis', async (req, res) => {
  try {
    const { yil, ay } = req.query;
    const currentDate = new Date();
    const year = yil || currentDate.getFullYear();
    const month = ay || (currentDate.getMonth() + 1);

    const result = await pool.query(`
      SELECT 
        DATE(s.tarih) as gun,
        COUNT(s.id) as satis_sayisi,
        SUM(s.net_tutar) as gunluk_ciro
      FROM satislar s
      WHERE EXTRACT(YEAR FROM s.tarih) = $1 
        AND EXTRACT(MONTH FROM s.tarih) = $2
      GROUP BY DATE(s.tarih)
      ORDER BY gun
    `, [year, month]);

    // Aylık toplam
    const toplam = await pool.query(`
      SELECT 
        COUNT(s.id) as toplam_satis,
        SUM(s.net_tutar) as toplam_ciro
      FROM satislar s
      WHERE EXTRACT(YEAR FROM s.tarih) = $1 
        AND EXTRACT(MONTH FROM s.tarih) = $2
    `, [year, month]);

    res.json({
      success: true,
      data: {
        gunluk: result.rows,
        toplam: toplam.rows[0],
        donem: { yil: year, ay: month }
      }
    });
  } catch (error) {
    console.error('Aylık satış raporu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor oluşturulamadı'
    });
  }
});

// Stok değer raporu - GET /api/muhasebe/stok-deger
router.get('/stok-deger', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        urun_adi,
        stok_miktari,
        alis_fiyati,
        satis_fiyati,
        stok_miktari * alis_fiyati as alis_toplam,
        stok_miktari * satis_fiyati as satis_toplam
      FROM urunler
      WHERE stok_miktari > 0
      ORDER BY stok_miktari * satis_fiyati DESC
    `);

    // Genel toplam
    const toplam = await pool.query(`
      SELECT 
        SUM(stok_miktari * alis_fiyati) as toplam_alis_degeri,
        SUM(stok_miktari * satis_fiyati) as toplam_satis_degeri
      FROM urunler
      WHERE stok_miktari > 0
    `);

    res.json({
      success: true,
      data: {
        urunler: result.rows,
        toplam: toplam.rows[0]
      }
    });
  } catch (error) {
    console.error('Stok değer raporu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Stok değer raporu oluşturulamadı'
    });
  }
});

module.exports = router;
