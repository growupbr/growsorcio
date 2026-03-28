/**
 * useAtividades — Context compartilhado para atividades pendentes
 *
 * Provê estado unificado consumido pelo Kanban (LeadCard) e pelo Dashboard
 * (AlertaSection), garantindo sync em tempo real dentro da mesma sessão:
 * marcar no Dashboard remove do contador do Kanban e vice-versa.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AtividadesContext = createContext(null);

export function AtividadesProvider({ children }) {
  const [atividades, setAtividades] = useState([]);
  // IDs em processo de conclusão (para animação visual)
  const [concluindo, setConcluindo] = useState(new Set());

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarCadenciaPendentes();
      setAtividades(Array.isArray(data) ? data : []);
    } catch (_) {
      // Falha silenciosa — não crítico para a navegação
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  /**
   * concluir(id)
   * 1. Inicia animação (line-through + opacity-50)
   * 2. Chama a API
   * 3. Após 800ms remove do estado local
   * Se a API falhar, reverte o estado visual.
   */
  const concluir = useCallback(async (id) => {
    setConcluindo((prev) => new Set(prev).add(id));
    try {
      await api.concluirCadencia(id);
      setTimeout(() => {
        setAtividades((prev) => prev.filter((a) => a.id !== id));
        setConcluindo((prev) => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        });
      }, 800);
    } catch (_) {
      // Rollback visual
      setConcluindo((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }, []);

  const getByLead = useCallback(
    (leadId) => atividades.filter((a) => a.lead_id === leadId),
    [atividades],
  );

  const countByLead = useCallback(
    (leadId) => atividades.filter((a) => a.lead_id === leadId).length,
    [atividades],
  );

  return (
    <AtividadesContext.Provider
      value={{ atividades, concluindo, concluir, getByLead, countByLead, recarregar: carregar }}
    >
      {children}
    </AtividadesContext.Provider>
  );
}

export function useAtividades() {
  const ctx = useContext(AtividadesContext);
  if (!ctx) throw new Error('useAtividades deve ser usado dentro de AtividadesProvider');
  return ctx;
}
