const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL bağlantısı
const bcrypt = require('bcryptjs');

// Kullanıcı kayıt
router.post('/register', async (req, res) => {
  const { kullanici_adi, email, telefon, adres_metni, sifre,firma_id } = req.body;

  if (!kullanici_adi || !email || !sifre) {
    return res.status(400).json({ message: 'Zorunlu alanlar eksik.' });
  }

  try {
    // Email daha önce alınmış mı kontrol et
    const existing = await pool.query(
      'SELECT * FROM kullanicilar WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Bu email ile kayıtlı bir kullanıcı var.' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Veritabanına ekle
    const result = await pool.query(
      `INSERT INTO kullanicilar 
        (kullanici_adi, email, telefon, adres_metni, aktif, sifre, firma_id,kayit_tarihi)
       VALUES ($1, $2, $3, $4, true, $5,1 ,CURRENT_TIMESTAMP)
       RETURNING id, kullanici_adi, email, aktif`,
      [kullanici_adi, email, telefon || null, adres_metni || null, hashedPassword,firma_id || 1]
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      kullanici: result.rows[0]
    });

  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
router.post('/login', async (req, res) => {
  const { email, sifre } = req.body;

  if (!email || !sifre) {
    return res.status(400).json({ message: 'Email ve şifre zorunludur.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM kullanicilar WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.rows[0];

    // bcrypt ile şifreyi karşılaştır
    const match = await bcrypt.compare(sifre, user.sifre);
    if (!match) {
      return res.status(401).json({ message: 'Şifre hatalı.' });
    }

    // Giriş başarılı
    res.status(200).json({
      message: 'Giriş başarılı',
      kullanici: {
        id: user.id,
        kullanici_adi: user.kullanici_adi,
        email: user.email,
        aktif: user.aktif
      }
    });

  } catch (err) {
    console.error('Giriş hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;