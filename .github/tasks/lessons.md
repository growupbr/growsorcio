# GrowSorcio — Lições Aprendidas

---

## [2026-03-28] Vite não processa JSX em arquivos .js por padrão

**Contexto:** Build da Vercel quebrou com `Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.`

**Causa:** `useAtividades.js` retornava JSX (`<AtividadesContext.Provider>`), mas a extensão era `.js`.

**Regra:** Qualquer arquivo que contenha JSX (mesmo que seja só um Provider wrapper) **deve ter extensão `.jsx`**. O Vite não habilita o transform de JSX em `.js` por padrão.

**Checagem preventiva:** Antes de cada PR/commit que crie hooks ou utilitários novos, rodar:
```bash
grep -rn "<[A-Z]" frontend/src/**/*.js
```
Se houver match, renomear o arquivo para `.jsx`.

**Imports:** Como o projeto já usa caminhos sem extensão nos imports (`from '../hooks/useAtividades'`), a renomeação não requer atualização de imports — o Vite resolve automaticamente `.jsx` antes de `.js`.
