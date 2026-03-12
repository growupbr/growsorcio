import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';

const INTERVALO_MS  = 30 * 60 * 1000;          // 30 minutos
const SESSION_KEY   = 'crm_notif_ts';           // timestamp da última notificação
const FILTRO_KEY    = 'crm_filtro_periodo';     // filtro a aplicar ao abrir Leads

// Ícone inline SVG como data URI (funciona sem arquivo de favicon separado)
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230a0d1a'/%3E%3Ctext y='72' x='50' text-anchor='middle' font-size='64' font-family='Arial' font-weight='900' fill='%23FF4500'%3EG%3C/text%3E%3C/svg%3E";

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

async function contarFollowUps() {
  const hoje   = dataHoje();
  const todos  = await api.listarLeads({});
  const ativos = todos.filter((lead) => {
    const data = lead.data_proxima_acao?.slice(0, 10);
    return data && data <= hoje; // vencidos + hoje
  });
  return ativos.length;
}

function jaNotificouNaSessao() {
  // Considera "mesma sessão" como: notificou há menos de 30 min
  const ts = sessionStorage.getItem(SESSION_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < INTERVALO_MS;
}

function marcarNotificado() {
  sessionStorage.setItem(SESSION_KEY, String(Date.now()));
}

export function useNotificacoes() {
  const permissaoSolicitadaRef = useRef(false);

  const disparar = useCallback(async () => {
    // Notificações não suportadas ou permissão negada
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // Já notificou nesta sessão/intervalo
    if (jaNotificouNaSessao()) return;

    let quantidade = 0;
    try {
      quantidade = await contarFollowUps();
    } catch {
      return; // silencioso — backend pode estar off
    }

    if (quantidade === 0) return;

    marcarNotificado();

    const titulo = 'Grow Up CRM';
    const corpo  = quantidade === 1
      ? 'Você tem 1 follow-up pendente para hoje'
      : `Você tem ${quantidade} follow-ups pendentes para hoje`;

    const notif = new Notification(titulo, {
      body:             corpo,
      icon:             ICON,
      tag:              'crm-followup',   // agrupa — só 1 notif por vez
      renotify:         false,             // não vibra se já existe com mesmo tag
      requireInteraction: false,
    });

    notif.onclick = () => {
      // Sinaliza para a página Leads qual filtro aplicar ao montar
      sessionStorage.setItem(FILTRO_KEY, 'hoje');
      window.focus();
      // Navega para /leads (funciona mesmo com app em background)
      window.location.href = '/leads';
      notif.close();
    };
  }, []);

  const solicitarEDisparar = useCallback(async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      // Pede permissão uma única vez por sessão
      if (permissaoSolicitadaRef.current) return;
      permissaoSolicitadaRef.current = true;
      const resultado = await Notification.requestPermission();
      if (resultado !== 'granted') return;
    }

    if (Notification.permission === 'granted') {
      disparar();
    }
  }, [disparar]);

  useEffect(() => {
    // Pequeno delay para não bloquear o carregamento inicial
    const timeout = setTimeout(solicitarEDisparar, 3000);

    // Reverifica a cada 30 min, mas pausa quando a aba está em background
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') disparar();
    }, INTERVALO_MS);

    // Dispara ao retornar para a aba após longa ausência
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') disparar();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [solicitarEDisparar, disparar]);
}
