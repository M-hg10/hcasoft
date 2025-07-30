require('dotenv').config({ 
  quiet: true,

});
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const urunlerRouter = require('./urunler');

app.use(cors());

// JSON body parse
app.use(express.json());

// Basit ana sayfa route
app.get('/', (req, res) => {
  res.send(`Sunucu çalışıyor: http://localhost:${port}`);
});

// Firma rotasını dahil et
const firmaRouter = require('./firma');
app.use('/firmalar', firmaRouter);
app.use('/urunler', urunlerRouter);

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} portunda çalışıyor`);
});
