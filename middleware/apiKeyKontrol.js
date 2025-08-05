const pool = require('../config/db.js');

const apiKeyKontrol = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'X-API-KEY gerekli'
      });
    }

    // Basit API key kontrolü (veritabanında kontrol etmek için)
    // Şimdilik sabit key kullanıyoruz
    if (apiKey !== 'hcasoft-api-key-2024') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz API key'
      });
    }

    next();
  } catch (error) {
    console.error('API Key hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

module.exports = apiKeyKontrol;