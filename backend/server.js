const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3334;

app.use(cors());
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
