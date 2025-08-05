const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Satış oluştur - POST /api/satislar
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { musteri_id, urunler, indirim_tutari = 0 } = req.body;
    
    // Satış kaydı oluştur
    const satisResult = await client.query(`
      INSERT INTO satislar (musteri_id, kullanici_id, indirim_tutari)
      VALUES ($1, $2, $3) RETURNING id
    `, [musteri_id, req.user.id, indirim_tutari]);
    
    const satisId = satisResult.rows[0].id;
    let toplamTutar = 0;
    
    // Ürün detaylarını ekle
    for (const urun of urunler) {
      const { urun_id, miktar, birim_fiyat } = urun;
      
      // Stok kontrolü
      const stokResult = await client.query(
        'SELECT stok_miktari FROM urunler WHERE id = $1',
        [urun_id]
      );
      
      if (stokResult.rows[0].stok_miktari < miktar) {
        throw new Error('Yetersiz stok');
      }
      
      // Satış detayı ekle
      await client.query(`
        INSERT INTO satis_detaylari (satis_id, urun_id, miktar, birim_fiyat)
        VALUES ($1, $2, $3, $4)
      `, [satisId, urun_id, miktar, birim_fiyat]);
      
      // Stok güncelle
      await client.query(`
        UPDATE urunler SET stok_miktari = stok_miktari - $1 WHERE id = $2
      `, [miktar, urun_id]);
      
      toplamTutar += miktar * birim_fiyat;
    }
    
    // Net tutarı güncelle
    const netTutar = toplamTutar - indirim_tutari;
    await client.query(`
      UPDATE satislar SET brut_tutar = $1, net_tutar = $2 WHERE id = $3
    `, [toplamTutar, netTutar, satisId]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: { id: satisId, net_tutar: netTutar },
      message: 'Satış başarıyla oluşturuldu'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Satış oluşturma hatası:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    client.release();
  }
});

// Satış listesi - GET /api/satislar
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.tarih,
        s.net_tutar,
        m.ad_soyad as musteri_adi,
        u.username as satan_kullanici
      FROM satislar s
      LEFT JOIN musteriler m ON s.musteri_id = m.id
      LEFT JOIN users u ON s.kullanici_id = u.id
      ORDER BY s.tarih DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Satış listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Satışlar listelenemedi'
    });
  }
});

module.exports = router;
