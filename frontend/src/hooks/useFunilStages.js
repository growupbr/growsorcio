import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch (err) {
      console.error('Erro ao carregar etapas do funil:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, setEtapas, carregando, recarregar: carregar };
}
