---
name: GrowSorcio — arquitetura frontend
description: Stack real, estrutura de páginas e componentes do frontend GrowSorcio
type: project
---

Stack real: React + Vite (não Next.js). TailwindCSS. @dnd-kit para Kanban. Recharts para gráficos. React Router v6.

Páginas: Dashboard, Kanban, Leads, NovoLead, LeadPerfil (modal).
Componentes: Navbar, Modal, QuickAddModal, TemperaturaBadge, EtapaTag.
Hooks: useNotificacoes (polling de follow-ups + Web Notifications API).
Utils: waWindow.js (singleton popup WhatsApp).

Funil Kanban: Lead Anúncio → Analisar Perfil → Seguiu Perfil → Abordagem Enviada → Respondeu → Em Desenvolvimento → Follow-up Ativo → Lead Capturado → Reunião Agendada → Reunião Realizada → Proposta Enviada → Follow-up Proposta → Fechado → Perdido (14 etapas).

LandingPage criada em 2026-03-14 em `/frontend/src/pages/LandingPage.jsx`. Rota `/landing` adicionada no App.jsx (`/` mantida no Dashboard). Autossuficiente: SVGs inline, sem lucide-react/framer-motion. Seções: Header sticky, Hero+KanbanMockup, Features, Pricing (3 planos), FAQ accordion, Footer.

Não há página de Inbox WhatsApp — o "Inbox" é um popup singleton (waWindow.js) que abre web.whatsapp.com.

Design System aplicado em 2026-03-14:
- Font: Plus Jakarta Sans (Google Fonts) — substituiu Montserrat
- Paleta dark: bg=#020617, surface=#0F172A, surface-2=#1E293B, surface-3=#334155
- Texto: text=#F8FAFC, muted=#94A3B8. Accent exclusivo: #FF4500
- CSS tokens em :root (--color-*) + aliases no tailwind.config
- Botões min-height 44px. Transições 150ms ease-out. overscrollBehavior contain no Kanban.

**Why:** Base clonada de crm-growup. Redesign aplicado para alinhar ao design system UI-UX Pro Max.
**How to apply:** Usar variáveis CSS (--color-*) ou tokens Tailwind. Não usar cores antigas raw (#080B14, #0D1117, #1C2333, #8B949E). Ao trabalhar em "Inbox", criar novo módulo; não confundir com botão WA do Navbar.
