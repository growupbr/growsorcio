/**
 * useCookieConsent
 * Gerencia preferências de cookies no localStorage.
 * Chave: "growsorcio_cookie_consent"
 *
 * Categorias:
 *  - essential  → sempre true (não pode ser recusado)
 *  - functional → controles de UI (welcome modal, filtros, notificações)
 *
 * Nota: o GrowSorcio não usa cookies de analytics nem de marketing.
 * Todos os armazenamentos são essential ou functional.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'growsorcio_cookie_consent';
const CONSENT_VERSION = '2026-03-28';

/** @typedef {{ essential: true, functional: boolean, version: string, savedAt: string }} ConsentState */

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Invalida se for de versão anterior
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(prefs) {
  const payload = {
    essential: true,
    functional: prefs.functional ?? true,
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage bloqueado (modo privado restrito) — sem crash
  }
  return payload;
}

export function useCookieConsent() {
  const stored = readStored();

  // null → banner ainda não foi respondido
  const [consent, setConsent] = useState(stored);
  const [showModal, setShowModal] = useState(false);

  const hasConsented = consent !== null;

  /** Aceita todas as categorias (essential + functional) */
  const acceptAll = useCallback(() => {
    const saved = writeStored({ functional: true });
    setConsent(saved);
    setShowModal(false);
  }, []);

  /** Aceita apenas essenciais (functional = false) */
  const acceptEssential = useCallback(() => {
    const saved = writeStored({ functional: false });
    setConsent(saved);
    setShowModal(false);
  }, []);

  /** Salva preferências customizadas vindas do CookieModal */
  const savePreferences = useCallback((prefs) => {
    const saved = writeStored(prefs);
    setConsent(saved);
    setShowModal(false);
  }, []);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return {
    consent,
    hasConsented,
    showModal,
    acceptAll,
    acceptEssential,
    savePreferences,
    openModal,
    closeModal,
    /** true se cookies funcionais foram aceitos (ou se ainda não decidiu = default permissivo) */
    isFunctionalEnabled: consent?.functional ?? true,
  };
}
