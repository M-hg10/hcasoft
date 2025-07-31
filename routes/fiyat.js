const express = require('express');
const router = express.Router();
const pool = require('../db'); // Mevcut db bağlantınız

// 1. POST: Ürün fiyatı ekleme/güncelleme
router.post('/fiyat-ekle', async (req, res) => {
  const { kullanici_kodu, sifre, urun_id, fiyat, para_birimi = 'TRY' } = req.body;

  try {
    // Kullanıcı doğrulama
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

    // Ürünün bu firmaya ait olup olmadığını kontrol et
    const urunKontrol = await pool.query(
      'SELECT id FROM urunler WHERE id = $1 AND firma_id = $2',
      [urun_id, firma.id]
    );

    if (urunKontrol.rows.length === 0) {
      return res.status(404).json({ message: 'Ürün bulunamadı veya bu firmaya ait değil' });
    }

    // Eski aktif fiyatı kapat
    await pool.query(
      'UPDATE urun_fiyatlari SET bitis_tarihi = CURRENT_TIMESTAMP WHERE urun_id = $1 AND bitis_tarihi IS NULL',
      [urun_id]
    );

    // Yeni fiyat ekle
    const fiyatResult = await pool.query(`
      INSERT INTO urun_fiyatlari 
      (urun_id, fiyat, para_birimi, baslangic_tarihi, olusturulma_tarihi) 
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [urun_id, fiyat, para_birimi]);

    res.json({
      success: true,
      message: 'Ürün fiyatı başarıyla eklendi',
      data: fiyatResult.rows[0]
    });

  } catch (err) {
    console.error('Fiyat ekleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 2. POST: Toplu fiyat güncelleme
router.post('/toplu-fiyat-guncelle', async (req, res) => {
  const { kullanici_kodu, sifre, fiyat_listesi } = req.body;

  try {
    // Kullanıcı doğrulama
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

    if (!Array.isArray(fiyat_listesi) || fiyat_listesi.length === 0) {
      return res.status(400).json({ message: 'Geçerli bir fiyat listesi gönderilmelidir' });
    }

    // Transaction başlat
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let guncellenen_sayisi = 0;

      for (const item of fiyat_listesi) {
        const { urun_id, fiyat, para_birimi = 'TRY' } = item;

        // Ürünün bu firmaya ait olup olmadığını kontrol et
        const urunKontrol = await client.query(
          'SELECT id FROM urunler WHERE id = $1 AND firma_id = $2',
          [urun_id, firma.id]
        );

        if (urunKontrol.rows.length > 0) {
          // Eski aktif fiyatı kapat
          await client.query(
            'UPDATE urun_fiyatlari SET bitis_tarihi = CURRENT_TIMESTAMP WHERE urun_id = $1 AND bitis_tarihi IS NULL',
            [urun_id]
          );

          // Yeni fiyat ekle
          await client.query(`
            INSERT INTO urun_fiyatlari 
            (urun_id, fiyat, para_birimi, baslangic_tarihi, olusturulma_tarihi) 
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [urun_id, fiyat, para_birimi]);

          guncellenen_sayisi++;
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `${guncellenen_sayisi} ürünün fiyatı güncellendi`,
        guncellenen_sayisi
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Toplu fiyat güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 3. POST: Firma ürünlerini fiyatlarıyla getir
router.post('/urunler-fiyatli', async (req, res) => {
  const { kullanici_kodu, sifre } = req.body;

  try {
    // Kullanıcı doğrulama (mevcut sisteminizle aynı)
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

    // Ürünleri aktif fiyatlarıyla getir
    const urunResult = await pool.query(`
      SELECT 
        u.*,
        uf.fiyat,
        uf.para_birimi,
        uf.baslangic_tarihi as fiyat_tarihi
      FROM urunler u
      LEFT JOIN urun_fiyatlari uf ON u.id = uf.urun_id 
        AND uf.bitis_tarihi IS NULL
        AND uf.baslangic_tarihi <= CURRENT_TIMESTAMP
      WHERE u.firma_id = $1
      ORDER BY u.urun_adi
    `, [firma.id]);

    res.json(urunResult.rows);

  } catch (err) {
    console.error('Ürünler getirme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 4. POST: Belirli ürünün fiyat geçmişini getir
router.post('/fiyat-gecmisi', async (req, res) => {
  const { kullanici_kodu, sifre, urun_id } = req.body;

  try {
    // Kullanıcı doğrulama
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

    // Ürünün bu firmaya ait olup olmadığını kontrol et
    const urunKontrol = await pool.query(
      'SELECT id, urun_adi FROM urunler WHERE id = $1 AND firma_id = $2',
      [urun_id, firma.id]
    );

    if (urunKontrol.rows.length === 0) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Fiyat geçmişini getir
    const fiyatGecmisi = await pool.query(`
      SELECT 
        uf.*,
        CASE 
          WHEN uf.bitis_tarihi IS NULL THEN 'Aktif'
          ELSE 'Pasif'
        END as durum
      FROM urun_fiyatlari uf
      WHERE uf.urun_id = $1
      ORDER BY uf.baslangic_tarihi DESC
    `, [urun_id]);

    res.json({
      urun: urunKontrol.rows[0],
      fiyat_gecmisi: fiyatGecmisi.rows
    });

  } catch (err) {
    console.error('Fiyat geçmişi getirme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 5. POST: Aktif fiyatı olan ürünler
router.post('/aktif-fiyatli-urunler', async (req, res) => {
  const { kullanici_kodu, sifre } = req.body;

  try {
    // Kullanıcı doğrulama
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

    // Sadece aktif fiyatı olan ürünleri getir
    const urunResult = await pool.query(`
      SELECT 
        u.*,
        uf.fiyat,
        uf.para_birimi,
        uf.baslangic_tarihi as fiyat_tarihi
      FROM urunler u
      INNER JOIN urun_fiyatlari uf ON u.id = uf.urun_id 
        AND uf.bitis_tarihi IS NULL
        AND uf.baslangic_tarihi <= CURRENT_TIMESTAMP
      WHERE u.firma_id = $1
      ORDER BY u.urun_adi
    `, [firma.id]);

    res.json(urunResult.rows);

  } catch (err) {
    console.error('Aktif fiyatlı ürünler getirme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;

/*
PostgreSQL Tablo Oluşturma SQL'i:

CREATE TABLE urun_fiyatlari (
    id SERIAL PRIMARY KEY,
    urun_id INTEGER NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
    fiyat DECIMAL(10,2) NOT NULL,
    para_birimi VARCHAR(3) DEFAULT 'TRY',
    baslangic_tarihi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bitis_tarihi TIMESTAMP NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_urun_fiyatlari_urun_id ON urun_fiyatlari(urun_id);
CREATE INDEX idx_urun_fiyatlari_tarih ON urun_fiyatlari(baslangic_tarihi, bitis_tarihi);
CREATE INDEX idx_urun_fiyatlari_aktif ON urun_fiyatlari(urun_id, bitis_tarihi) WHERE bitis_tarihi IS NULL;

-- Güncelleme tarihi için trigger
CREATE OR REPLACE FUNCTION update_guncelleme_tarihi()
RETURNS TRIGGER AS $$
BEGIN
    NEW.guncelleme_tarihi = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER urun_fiyatlari_guncelleme_tarihi
    BEFORE UPDATE ON urun_fiyatlari
    FOR EACH ROW
    EXECUTE FUNCTION update_guncelleme_tarihi();
*/