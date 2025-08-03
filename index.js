require('dotenv').config({ 
  quiet: true,

});
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const urunlerRouter = require('./routes/urunler.js');
const fiyatRouter = require('./routes/fiyat.js');

app.use(cors());

// JSON body parse
app.use(express.json());

// Basit ana sayfa route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ön Muhasebe API Sistemi',
    endpoints: {
      urunler: '/api/urunler',
      fiyat: {
        fiyat_ekle: '/api/fiyat/fiyat-ekle',
        toplu_guncelle: '/api/fiyat/toplu-fiyat-guncelle',
        urunler_fiyatli: '/api/fiyat/urunler-fiyatli',
        fiyat_gecmisi: '/api/fiyat/fiyat-gecmisi',
        aktif_fiyatli: '/api/fiyat/aktif-fiyatli-urunler'
      }
    }
  });
});

const apiRoutes = require('./routes/newurunler.js');
app.use('/api', apiRoutes);


// Firma rotasını dahil et
const firmaRouter = require('./firma');
app.use('/firmalar', firmaRouter);
app.use('/urunler', urunlerRouter);
app.use('/api/fiyat', fiyatRouter); // Yeni fiyat endpoint'leri


app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} portunda çalışıyor`);
});
