require('dotenv').config({ 
  quiet: true,

});
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// JSON body parse
app.use(express.json());

// Basit ana sayfa route
app.get('/', (req, res) => {
  res.send(`Sunucu çalışıyor: http://localhost:${port}`);
});

// Firma rotasını dahil et
const firmaRouter = require('./firma');
app.use('/firmalar', firmaRouter);

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} portunda çalışıyor`);
});
