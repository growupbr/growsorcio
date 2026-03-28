import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * useFaturamento
 * Busca o faturamento acumulado histórico (soma de valor_da_carta de leads "Fechado").
 *
 * @returns {{ faturamento: number, loading: boolean, erro: string|null }}
 */
export function useFaturamento() {
  const [faturamento, setFaturamento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      try {
        setLoading(true);
        setErro(null);
        const data = await api.faturamentoAcumulado();
        if (!cancelado) {
          setFaturamento(data?.faturamento_acumulado ?? 0);
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err?.message ?? 'Erro ao carregar faturamento');
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    buscar();
    return () => { cancelado = true; };
  }, []);

  return { faturamento, loading, erro };
}
