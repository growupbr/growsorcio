import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

// Fallback hardcoded — garantia de que o Kanban sempre mostra colunas
// mesmo se a tabela funnel_stages ainda não foi migrada no banco
const ETAPAS_PADRAO = [
  { id: 'pad-0',  name: 'Lead Anúncio',       display_order: 0,  color: '#a78bfa', is_lost: false },
  { id: 'pad-1',  name: 'Analisar Perfil',     display_order: 1,  color: '#f97316', is_lost: false },
  { id: 'pad-2',  name: 'Seguiu Perfil',       display_order: 2,  color: '#f97316', is_lost: false },
  { id: 'pad-3',  name: 'Abordagem Enviada',   display_order: 3,  color: '#f97316', is_lost: false },
  { id: 'pad-4',  name: 'Respondeu',           display_order: 4,  color: '#38bdf8', is_lost: false },
  { id: 'pad-5',  name: 'Em Desenvolvimento',  display_order: 5,  color: '#38bdf8', is_lost: false },
  { id: 'pad-6',  name: 'Follow-up Ativo',     display_order: 6,  color: '#38bdf8', is_lost: false },
  { id: 'pad-7',  name: 'Lead Capturado',      display_order: 7,  color: '#38bdf8', is_lost: false },
  { id: 'pad-8',  name: 'Reunião Agendada',    display_order: 8,  color: '#f59e0b', is_lost: false },
  { id: 'pad-9',  name: 'Reunião Realizada',   display_order: 9,  color: '#f59e0b', is_lost: false },
  { id: 'pad-10', name: 'Proposta Enviada',    display_order: 10, color: '#f59e0b', is_lost: false },
  { id: 'pad-11', name: 'Follow-up Proposta',  display_order: 11, color: '#f59e0b', is_lost: false },
  { id: 'pad-12', name: 'Fechado',             display_order: 12, color: '#22c55e', is_lost: false },
  { id: 'pad-13', name: 'Perdido',             display_order: 13, color: '#52525b', is_lost: true  },
];

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      // Se a API retornar vazio (org sem etapas e seed falhou), usa padrão
      setEtapas(dados && dados.length > 0 ? dados : ETAPAS_PADRAO);
    } catch (err) {
      console.error('Erro ao carregar etapas do funil — usando padrão:', err);
      setEtapas(ETAPAS_PADRAO);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, setEtapas, carregando, recarregar: carregar };
}

