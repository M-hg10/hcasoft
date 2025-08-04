require('dotenv').config({ 
  quiet: true,

});
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const urunlerRouter = require('./routes/urunler.js');
const fiyatRouter = require('./routes/fiyat.js');
const apiKeyRoutes = require('./routes/apiKeys');



app.use(cors());

// JSON body parse
app.use(express.json());

// Basit ana sayfa route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ön Muhasebe API Sistemi',
    
    
  });
});
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 15 dakikada en fazla 100 istek
  message: { message: 'Rate limit aşıldı' }
});

app.use('/api/', apiLimiter); // tüm /api endpointlerine uygula

// Firma rotasını dahil et
const firmaRouter = require('./firma');
app.use('/firmalar', firmaRouter);
app.use('/urunler', urunlerRouter);
app.use('/api/fiyat', fiyatRouter); // Yeni fiyat endpoint'leri
app.use('/api', apiKeyRoutes);


app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} portunda çalışıyor`);
});
