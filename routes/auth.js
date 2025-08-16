const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL bağlantısı
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

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
    (kullanici_adi, email, telefon, adres_metni, aktif, sifre, firma_id, kayit_tarihi)
   VALUES ($1, $2, $3, $4, true, $5, $6, CURRENT_TIMESTAMP)
   RETURNING id, kullanici_adi, email, aktif`,
  [kullanici_adi, email, telefon || null, adres_metni || null, hashedPassword, firma_id || 1]
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
      `SELECT 
         k.*, 
         f.id AS firma_id, 
         f.firma_adi, 
         f.adres, 
         f.telefon
       FROM kullanicilar k
       LEFT JOIN firmalar f ON k.firma_id = f.id
       WHERE k.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.rows[0];

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
        aktif: user.aktif,
        firma: {
          id: user.firma_id,
          firma_adi: user.firma_adi,
          adres: user.adres,
          telefon: user.telefon
        }
      }
    });

  } catch (err) {
    console.error('Giriş hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;





// Email transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'seninmail@gmail.com',
    pass: 'mailsifre'
  }
});

// 1️⃣ Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query('SELECT * FROM kullanicilar WHERE email=$1', [email]);
    if (!user.rows.length) return res.status(404).json({ msg: 'Email bulunamadı' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 saat geçerli

    await pool.query(
      'UPDATE kullanicilar SET reset_token=$1, reset_expires=$2 WHERE email=$3',
      [token, expires, email]
    );

    const resetLink = `https://soft.hggrup.com/auth/reset-password/${token}`;

    await transporter.sendMail({
      from: '"Şifre Sıfırlama" <seninmail@gmail.com>',
      to: email,
      subject: 'Şifre Sıfırlama Linki',
      html: `<p>Şifrenizi sıfırlamak için linke tıklayın: <a href="${resetLink}">${resetLink}</a></p>`
    });

    res.json({ msg: 'Şifre sıfırlama linki gönderildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// 2️⃣ Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await pool.query(
      'SELECT * FROM kullanicilar WHERE reset_token=$1 AND reset_expires > NOW()',
      [token]
    );
    if (!user.rows.length) return res.status(400).json({ msg: 'Geçersiz veya süresi dolmuş token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE kullanicilar SET password=$1, reset_token=NULL, reset_expires=NULL WHERE reset_token=$2',
      [hashedPassword, token]
    );

    res.json({ msg: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

module.exports = router;
