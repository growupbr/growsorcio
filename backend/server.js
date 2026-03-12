const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializa banco de dados
initDb();

// Rotas
app.use('/api/leads', require('./routes/leads'));
app.use('/api/interacoes', require('./routes/interacoes'));
app.use('/api/cadencia', require('./routes/cadencia'));
app.use('/api/webhook', require('./routes/webhook'));

app.listen(PORT, () => {
  console.log(`CRM Grow Up — Backend rodando em http://localhost:${PORT}`);
});
