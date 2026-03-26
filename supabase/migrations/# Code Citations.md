# Code Citations

## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```


## License: MIT
https://github.com/lblod/ember-rdfa-editor/blob/bd8f1355e90369585ee9b7b8785c4b21ff17af34/addon/components/plugins/table/vertical-align.ts

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="
```


## License: unknown
https://github.com/Lavie92/FinanceSystem_Netcore6/blob/659bffd723bb083d2b12b9131d4abc788e7323bd/FinanceSystem/Views/Shared/_Layout.cshtml

```
Tenho todo o contexto necessário. Estou no modo Ask (read-only), então vou apresentar todos os arquivos completos para você aplicar. São 8 arquivos.

---

## 1. Migration SQL

**Criar:** `supabase/migrations/20260323_funnel_stages.sql`

```sql
-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros podem ler
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem escrever
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- Função para popular etapas padrão em novas orgs
create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a855f7', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#eab308', false),
    (p_org_id, 'Reunião Realizada',  9,  '#eab308', false),
    (p_org_id, 'Proposta Enviada',   10, '#eab308', false),
    (p_org_id, 'Follow-up Proposta', 11, '#eab308', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- Atualiza handle_new_user para semear etapas em novas orgs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- Backfill de orgs existentes sem etapas
do $$
declare
  org record;
begin
  for org in
    select o.id from public.organizations o
    where not exists (
      select 1 from public.funnel_stages f where f.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
```

---

## 2. Backend: Nova rota `/api/funil`

**Criar:** `backend/routes/funil.js`

```js
const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// GET /api/funil — lista etapas da org ordenadas
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');
    return res.json(data || []);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });
  }
  try {
    const { supabase: db, organizationId } = req;

    // Pega o maior display_order atual
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order: nextOrder })
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ erro: 'Nome não pode ser vazio' });
  }
  try {
    const { supabase: db, organizationId } = req;
    const patch = {};
    if (name !== undefined) patch.name = name.trim();
    if (color !== undefined) patch.color = color;
    if (is_lost !== undefined) patch.is_lost = Boolean(is_lost);

    const { data, error } = await db
      .from('funnel_stages')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id, display_order }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de reordenação inválido' });
  }
  try {
    const { supabase: db, organizationId } = req;
    // Valida que todos os ids pertencem à org
    const ids = items.map((i) => i.id);
    const { data: owned } = await db
      .from('funnel_stages')
      .select('id')
      .eq('organization_id', organizationId)
      .in('id', ids);
    const ownedIds = new Set((owned || []).map((r) => r.id));
    if (ids.some((id) => !ownedIds.has(id))) {
      return res.status(403).json({ erro: 'Etapa não pertence à organização' });
    }

    // Atualiza cada display_order
    await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();
    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    // Conta leads nessa etapa
    const { count } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (count > 0) {
      return res.status(409).json({
        erro: `Existem ${count} lead(s) nessa etapa. Mova-os antes de excluí-la.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);
    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (err) {
    return handleSupabaseError(res, err, 'Erro ao excluir etapa');
  }
});

module.exports = router;
```

---

## 3. Registrar rota no `server.js`

**Modificar:** `backend/server.js` — adicionar após a linha do `/api/cadencia`:

```js
app.use('/api/funil', authMiddleware, require('./routes/funil'));
```

---

## 4. Atualizar validação em `backend/routes/leads.js`

Substituir a função helper para validar etapas dinamicamente. As 3 ocorrências de `!ETAPAS_VALIDAS.includes(etapa_funil)` viram chamadas à função abaixo.

**No topo do arquivo**, substituir:
```js
const { ETAPAS_VALIDAS } = require('../constants/etapas');
```
por nada (remover essa linha).

**Adicionar essa função helper** logo após `resolverTemperatura`:
```js
async function validarEtapa(db, organizationId, etapa_funil) {
  if (!etapa_funil) return null; // sem etapa = ok, default será aplicado
  const { data } = await db
    .from('funnel_stages')
    .select('name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapa_funil)
    .maybeSingle();
  return data; // null = etapa inválida
}
```

**No `POST /api/leads`**, substituir:
```js
if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
}
```
por:
```js
// (validação movida para dentro do try, após ter db disponível)
```
E dentro do `try {}`, antes de checar duplicatas:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
  if (stage.is_lost && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }
}
```

**No `PUT /api/leads/:id`**, dentro do `try {}` após obter `atual`, adicionar:
```js
if (etapa_funil) {
  const stage = await validarEtapa(db, organizationId, etapa_funil);
  if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
}
```
E substituir `etapaSelecionada === 'Perdido'` por verificação de `is_lost`.

**No `PATCH /:id/etapa`**, substituir:
```js
if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
  return res.status(400).json({ erro: 'Etapa inválida' });
}
if (etapa_funil === 'Perdido' && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```
por (dentro do `try`, após `const { supabase: db, organizationId } = req;`):
```js
const stage = await validarEtapa(db, organizationId, etapa_funil);
if (!stage) return res.status(400).json({ erro: 'Etapa inválida' });
if (stage.is_lost && !motivo_descarte) {
  return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
}
```

---

## 5. Frontend API — `client.js`

**Adicionar** ao objeto `export const api` em `frontend/src/api/client.js`:

```js
// Funil
listarEtapas: () => request('/funil'),
criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),
```

---

## 6. Hook compartilhado

**Criar:** `frontend/src/hooks/useFunilStages.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFunilStages() {
  const [etapas, setEtapas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.listarEtapas();
      setEtapas(dados);
    } catch {
      setEtapas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return { etapas, carregando, recarregar: carregar };
}
```

---

## 7. `Kanban.jsx` — substituir import estático pelo hook

**Modificar:** `frontend/src/pages/Kanban.jsx`

Substituir:
```js
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Remover o objeto `FASE_DOT` (linhas com `const FASE_DOT = {...}`).

Dentro de `export default function Kanban()`, adicionar:
```js
const { etapas, carregando: carregandoEtapas } = useFunilStages();
```

Alterar o loading check:
```js
if (carregando || carregandoEtapas) return <KanbanSkeleton />;
```

Substituir `leadsPorEtapa` para usar `etapas` (array com `{ id, name, color, is_lost }`):
```js
const leadsPorEtapa = useMemo(() => {
  const mapa = {};
  etapas.forEach(({ name }) => { mapa[name] = []; });
  leads.forEach((lead) => {
    if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    // leads em etapas deletadas ficam no limbo — ignorar silenciosamente
  });
  return mapa;
}, [leads, etapas]);
```

No `handleAdicionarLead`, a detecção de `Lead Anúncio` continua funcionando (o nome ainda existe por padrão).

No header do Kanban, substituir o `FASE_DOT` legend por cores únicas das etapas:
```jsx
<div className="flex items-center gap-3 flex-wrap">
  {[...new Map(etapas.map((e) => [e.color, e.color])).values()].map((color) => (
    <span key={color} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
  ))}
</div>
```

No `<Coluna>`, a prop `etapa` agora tem shape `{ id, name, color, is_lost }`. Alterar `Coluna`:
```js
function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.name }); // era etapa.nome
  const dotColor = etapa.color;
  // ...
  // trocar etapa.nome → etapa.name em todos os lugares dentro de Coluna
}
```

No render `{ETAPAS.map(...)}`:
```jsx
{etapas.map((etapa) => (
  <Coluna
    key={etapa.id}
    etapa={etapa}
    leads={leadsPorEtapa[etapa.name] || []}
    onCardClick={setLeadAberto}
    isOver={sobreColuna === etapa.name}
    adicionando={colunaAdicionando === etapa.name}
    onIniciarAdd={() => setColunaAdicionando(etapa.name)}
    onAdd={handleAdicionarLead}
    onCancelarAdd={() => setColunaAdicionando(null)}
  />
))}
```

> **Nota:** Em `handleDragEnd`, `over.id` já é o `etapa.name` pois o `useDroppable` é registrado com `id: etapa.name`.

---

## 8. `LeadPerfil.jsx` — MoverEtapaModal dinâmico

**Modificar:** `frontend/src/pages/LeadPerfil.jsx`

Substituir:
```js
import { ETAPAS } from '../constants/etapas';
```
por:
```js
import { useFunilStages } from '../hooks/useFunilStages';
```

Dentro de `export default function LeadPerfil(...)`, adicionar o hook:
```js
const { etapas } = useFunilStages();
```

Passar `etapas` para `MoverEtapaModal`:
```jsx
{mudandoEtapa && (
  <MoverEtapaModal
    lead={lead}
    etapas={etapas}
    onMover={handleMoverEtapa}
    onFechar={() => setMudandoEtapa(false)}
  />
)}
```

Atualizar `MoverEtapaModal` para receber `etapas` como prop:
```js
function MoverEtapaModal({ lead, etapas, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const stageAtual = etapas.find((e) => e.name === etapaSelecionada);
  const descartando = stageAtual?.is_lost ?? false;

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {etapas.map((etapa) => (
          <button key={etapa.id} onClick={() => setEtapaSelecionada(etapa.name)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa.name ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa.name ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}>
            {etapaSelecionada === etapa.name && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa.name ? 'font-semibold' : ''}>{etapa.name}</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## 9. `Config.jsx` — Interface admin completa

**Substituir todo o conteúdo** de `frontend/src/pages/Config.jsx`:

```jsx
import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const CORES_PRESET = [
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#52525b',
];

// ─── Item da lista de etapas (drag-and-drop) ─────────────────────────────────

function EtapaItem({ etapa, onEditar, onExcluir, editandoId, onSalvar, onCancelar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const [form, setForm] = useState({ name: etapa.name, color: etapa.color, is_lost: etapa.is_lost });
  const [salvando, setSalvando] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isEditando = editandoId === etapa.id;

  async function handleSalvar() {
    if (!form.name.trim()) return;
    setSalvando(true);
    await onSalvar(etapa.id, form);
    setSalvando(false);
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group"
      style={{ ...style, background: '#18181b', border: '1px solid #3f3f46' }}>

      {/* Handle de drag */}
      <button {...listeners} {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
      
```

