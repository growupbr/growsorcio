const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3334;

const ORIGENS_PERMITIDAS = process.env.NODE_ENV === 'production'
  ? ['https://app.growsorcio.com.br']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: ORIGENS_PERMITIDAS,
  credentials: true,
}));
app.use(express.json());

// Rotas
app.use('/api/leads', require('./routes/leads'));
app.use('/api/interacoes', require('./routes/interacoes'));
app.use('/api/cadencia', require('./routes/cadencia'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/billing', require('./routes/billing'));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GrowSorcio — Backend rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
