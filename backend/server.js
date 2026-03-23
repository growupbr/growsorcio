const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3334;

const ORIGENS_PERMITIDAS = process.env.NODE_ENV === 'production'
  ? [
      'https://app.growsorcio.com.br',
      'https://growsorcio.com.br',
      'https://www.growsorcio.com.br',
    ]
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ORIGENS_PERMITIDAS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origem não permitida por CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

const { authMiddleware } = require('./middleware/auth');

// Rotas públicas (sem autenticação)
app.use('/api/webhook', require('./routes/webhook'));

// Rotas protegidas — JWT obrigatório, req.supabase e req.organizationId injetados
app.use('/api/leads', authMiddleware, require('./routes/leads'));
app.use('/api/interacoes', authMiddleware, require('./routes/interacoes'));
app.use('/api/cadencia', authMiddleware, require('./routes/cadencia'));
app.use('/api/funil', authMiddleware, require('./routes/funil'));
app.use('/api/billing', require('./routes/billing')); // auth aplicado por rota interna

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GrowSorcio — Backend rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
