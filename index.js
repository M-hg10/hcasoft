const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());


// ✅ JSON body verisini almak için middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 API Sunucusu Başarıyla Çalışıyor</h1>
    <p>Kullanılabilir Endpointler:</p>
    <ul>
      <li><code>POST /auth/register</code> – Yeni kullanıcı kaydı</li>
      <li><code>POST /auth/login</code> – Kullanıcı girişi</li>
    </ul>
  `);
});

// ✅ Ürünler route'u
const urunlerRouter = require('./routes/urunler');
const authRoutes = require('./routes/auth');
const sabitlerRoutes = require('./routes/sabitler');

app.use('/api/urunler', urunlerRouter);
app.use('/auth', authRoutes); // /auth/register ve /auth/login
app.use('/sabit', sabitlerRoutes);// firmalar,kategoriler ürün durumlarını şeker



// ✅ Sunucuyu başlat (TEK bir kere çağrılmalı)
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 HCASOFT API ${PORT} portunda çalışıyor`);
  console.log(`📋 Health check: http://localhost:${PORT}`);
  console.log(`🔑 API Key: hcasoft-api-key-2024`);
});










