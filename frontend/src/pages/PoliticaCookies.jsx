/**
 * Página de Política de Cookies — /cookies
 * Acessível sem autenticação.
 * Lista completa de todos os armazenamentos identificados no GrowSorcio.
 */
import { ArrowLeft, Cookie } from 'lucide-react';

const ULTIMA_ATUALIZACAO = '28 de março de 2026';

const COOKIES = [
  {
    categoria: 'Essencial',
    cor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    itens: [
      {
        nome: 'sb-{ref}-auth-token',
        local: 'localStorage',
        tipo: 'Essencial',
        duracao: 'Sessão da conta (expira com o logout)',
        finalidade: 'Armazena o token JWT de autenticação do Supabase Auth. Sem esse token, você não consegue acessar o sistema.',
      },
      {
        nome: 'growsorcio_cookie_consent',
        local: 'localStorage',
        tipo: 'Essencial',
        duracao: '1 ano',
        finalidade: 'Salva sua escolha de preferências de cookies (aceitar todos, somente essenciais, configuração personalizada). Impede que o banner reapareça após sua decisão.',
      },
    ],
  },
  {
    categoria: 'Funcional',
    cor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    itens: [
      {
        nome: 'seen_welcome_v{n}',
        local: 'localStorage',
        tipo: 'Funcional',
        duracao: '90 dias',
        finalidade: 'Controla se o modal de boas-vindas ao sistema já foi exibido ao usuário. Evita exibição repetitiva.',
      },
      {
        nome: 'tec_confetti_fired',
        local: 'sessionStorage',
        tipo: 'Funcional',
        duracao: 'Sessão do navegador (apagado ao fechar a aba)',
        finalidade: 'Evita que a animação de confete na landing page TEC seja reproduzida mais de uma vez por sessão.',
      },
      {
        nome: 'filtro_leads_periodo_{orgId}',
        local: 'sessionStorage',
        tipo: 'Funcional',
        duracao: 'Sessão do navegador',
        finalidade: 'Lembra o filtro de período selecionado na tela de Leads para preservar a visualização ao navegar entre páginas.',
      },
      {
        nome: 'notif_session_ts',
        local: 'sessionStorage',
        tipo: 'Funcional',
        duracao: 'Sessão do navegador',
        finalidade: 'Registra o timestamp da última verificação de notificações na sessão, evitando chamadas redundantes à API.',
      },
      {
        nome: 'propostas_v{n}_{orgId}',
        local: 'sessionStorage',
        tipo: 'Funcional',
        duracao: 'Sessão do navegador',
        finalidade: 'Preserva os dados de uma proposta em edição durante a navegação, evitando perda de informações não salvas.',
      },
    ],
  },
];

function Badge({ texto, cor }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cor}`}>
      {texto}
    </span>
  );
}

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-['Inter',sans-serif]">
      {/* Navbar mínima */}
      <header className="sticky top-0 z-10 border-b border-white/8 bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            Voltar
          </a>
          <div className="flex items-center gap-2">
            <Cookie size={16} className="text-[#FF4500]" />
            <span className="text-sm font-semibold text-white">GrowSorcio</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Transparência</p>
          <h1 className="text-3xl font-bold text-white mb-3">Política de Cookies</h1>
          <p className="text-zinc-500 text-sm">
            Última atualização: <span className="text-zinc-300">{ULTIMA_ATUALIZACAO}</span>
          </p>
          <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/8">
            <p className="text-sm text-zinc-300 leading-relaxed">
              O GrowSorcio <strong className="text-white">não usa cookies de rastreamento, analytics ou marketing</strong>.
              Usamos apenas armazenamento local (<code className="text-[#FF4500] bg-[#FF4500]/10 px-1 rounded">localStorage</code> e{' '}
              <code className="text-blue-400 bg-blue-400/10 px-1 rounded">sessionStorage</code>) estritamente necessários para
              o funcionamento do sistema e melhoria da sua experiência.
            </p>
          </div>
        </div>

        {/* O que são cookies */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-white/8">
            O que são cookies e armazenamento local?
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Cookies são pequenos arquivos de texto salvos no seu navegador. O <strong className="text-zinc-200">localStorage</strong>{' '}
            e o <strong className="text-zinc-200">sessionStorage</strong> são tecnologias similares usadas por aplicações web modernas.
            O sessionStorage é apagado automaticamente ao fechar a aba ou o navegador. O localStorage persiste até ser
            apagado manualmente ou pelo sistema.
          </p>
        </section>

        {/* Tabelas por categoria */}
        {COOKIES.map((cat) => (
          <section key={cat.categoria} className="mb-10">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/8">
              <h2 className="text-lg font-bold text-white">Cookies {cat.categoria}s</h2>
              <Badge texto={cat.categoria} cor={cat.cor} />
            </div>
            <div className="space-y-4">
              {cat.itens.map((item) => (
                <div key={item.nome} className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <code className="text-sm font-mono text-zinc-100 break-all">{item.nome}</code>
                    <Badge texto={item.tipo} cor={cat.cor} />
                  </div>
                  <div className="space-y-1 text-xs text-zinc-500">
                    <p>
                      <span className="text-zinc-400 font-medium">Armazenamento:</span> {item.local}
                    </p>
                    <p>
                      <span className="text-zinc-400 font-medium">Duração:</span> {item.duracao}
                    </p>
                    <p className="mt-2 text-zinc-400 leading-relaxed">{item.finalidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Como gerenciar */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-white/8">
            Como gerenciar suas preferências
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-3">
            Você pode alterar suas preferências de cookies a qualquer momento clicando em{' '}
            <strong className="text-zinc-200">"Configurar cookies"</strong> no banner que aparece na primeira visita,
            ou limpando o armazenamento local do seu navegador nas configurações de privacidade.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Atenção: remover o armazenamento essencial (como o token de autenticação) irá desconectar
            sua conta automaticamente.
          </p>
        </section>

        {/* Footer da página */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 GrowSorcio · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/privacidade" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              Política de Privacidade
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
