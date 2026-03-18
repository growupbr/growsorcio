#!/bin/bash
# Script para iniciar o CRM Grow Up

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Iniciando CRM Grow Up..."
echo ""

# Verifica se porta 3334 está livre
if lsof -ti:3334 > /dev/null 2>&1; then
  echo "⚠️  Porta 3334 ocupada. Matando processo..."
  lsof -ti:3334 | xargs kill -9
  sleep 1
fi

# Verifica se porta 3000 está livre
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Porta 3000 ocupada. Matando processo..."
  lsof -ti:3000 | xargs kill -9
  sleep 1
fi

# Inicia backend em background
echo "▶ Backend iniciando na porta 3334..."
cd "$ROOT/backend" && node server.js &
BACKEND_PID=$!
sleep 2

# Verifica se backend subiu
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend falhou ao iniciar. Verifique os erros acima."
  exit 1
fi

echo "✅ Backend rodando (PID $BACKEND_PID)"
echo ""
echo "▶ Frontend iniciando na porta 3000..."
echo "   Acesse: http://localhost:3000"
echo ""
echo "   Para parar: Ctrl+C"
echo ""

# Cleanup ao sair
trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM

# Inicia frontend (foreground)
cd "$ROOT/frontend" && npm run dev
