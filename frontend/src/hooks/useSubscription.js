import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { api } from '../api/client';
import { FEATURE_PLANS } from '../utils/planFeatures';

// Cache em memória para evitar múltiplas requisições simultâneas
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let _cache = null;
let _cacheTime = 0;
let _fetchPromise = null;

function invalidateCache() {
  _cache = null;
  _cacheTime = 0;
  _fetchPromise = null;
}

async function fetchSubscription() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return _cache;
  }
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = api.getSubscription()
    .then((data) => {
      _cache = data;
      _cacheTime = Date.now();
      _fetchPromise = null;
      return data;
    })
    .catch(() => {
      _fetchPromise = null;
      return { plan: null, status: null, isActive: false };
    });

  return _fetchPromise;
}

/**
 * Hook para verificar o plano/assinatura do usuário.
 *
 * Retorna:
 *   plan         — 'start' | 'pro' | 'elite' | null
 *   status       — 'trial' | 'active' | 'pending' | 'expired' | 'cancelled' | null
 *   isActive     — true se o plano está ativo ou trial válido
 *   hasFeature   — função(feature: string) → boolean
 *   loading      — true enquanto busca
 */
export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    if (!user) {
      invalidateCache();
      setSub(null);
      setLoading(false);
      return;
    }

    // Invalida cache se trocar de usuário
    if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      invalidateCache();
    }
    prevUserIdRef.current = user.id;

    setLoading(true);
    fetchSubscription().then((data) => {
      setSub(data);
      setLoading(false);
    });
  }, [user]);

  function hasFeature(feature) {
    if (!sub) return false;
    const required = FEATURE_PLANS[feature];
    // Feature não está no mapa = disponível para todos os planos ativos
    if (!required) return sub.isActive !== false; // gracefully true if no restriction
    return sub.isActive === true && required.includes(sub.plan);
  }

  return {
    plan:       sub?.plan ?? null,
    status:     sub?.status ?? null,
    isActive:   sub?.isActive ?? false,
    trial_ends_at:      sub?.trial_ends_at ?? null,
    current_period_end: sub?.current_period_end ?? null,
    hasFeature,
    loading,
  };
}
