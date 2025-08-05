const express = require('express');
const app = express();

// ✅ JSON body verisini almak için middleware
app.use(express.json());

// ✅ Ürünler route'u
const urunlerRouter = require('./routes/urunler');
app.use('/api/urunler', urunlerRouter);

// ✅ Sunucuyu başlat (TEK bir kere çağrılmalı)
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 HCASOFT API ${PORT} portunda çalışıyor`);
  console.log(`📋 Health check: http://localhost:${PORT}`);
  console.log(`🔑 API Key: hcasoft-api-key-2024`);
});










