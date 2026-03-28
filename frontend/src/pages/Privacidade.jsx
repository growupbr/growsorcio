/**
 * Página de Política de Privacidade — /privacidade
 * Acessível sem autenticação.
 * Gerada com base no levantamento real dos dados coletados pelo GrowSorcio (2026-03-28).
 */
import { ArrowLeft, Shield } from 'lucide-react';

const ULTIMA_ATUALIZACAO = '28 de março de 2026';
const VERSAO = '2026-03-28';
const DPO_EMAIL = 'privacidade@growsorcio.com.br';

function Section({ id, titulo, children }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-white/8">{titulo}</h2>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  );
}

function P({ children }) {
  return <p>{children}</p>;
}

function Ul({ items }) {
  return (
    <ul className="list-none space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-[#FF4500]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Tabela({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8 mt-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-bold text-zinc-300 bg-white/3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-zinc-400 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Privacidade() {
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
            <Shield size={16} className="text-[#FF4500]" />
            <span className="text-sm font-semibold text-white">GrowSorcio</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Cabeçalho */}
        <div className="mb-10">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Conformidade LGPD</p>
          <h1 className="text-3xl font-bold text-white mb-3">Política de Privacidade</h1>
          <p className="text-zinc-500 text-sm">
            Última atualização: <span className="text-zinc-300">{ULTIMA_ATUALIZACAO}</span>
            {' · '}Versão: <span className="text-zinc-300">{VERSAO}</span>
          </p>
          <div className="mt-4 p-4 rounded-xl bg-[#FF4500]/8 border border-[#FF4500]/20">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Esta Política de Privacidade descreve como o <strong className="text-white">GrowSorcio</strong> coleta,
              usa, armazena e compartilha seus dados pessoais, em conformidade com a{' '}
              <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </div>
        </div>

        {/* 1 — Controlador */}
        <Section id="controlador" titulo="1. Quem é o controlador dos dados">
          <P>
            O controlador responsável pelo tratamento dos seus dados pessoais é:
          </P>
          <div className="mt-3 p-4 rounded-xl bg-white/3 border border-white/8 text-sm space-y-1">
            <p><span className="text-zinc-300 font-semibold">Razão Social:</span> GrowSorcio (empresa em constituição)</p>
            <p><span className="text-zinc-300 font-semibold">Nome fantasia:</span> GrowSorcio</p>
            <p><span className="text-zinc-300 font-semibold">Produto:</span> CRM para corretores de consórcio</p>
            <p><span className="text-zinc-300 font-semibold">Contato DPO:</span>{' '}
              <a href={`mailto:${DPO_EMAIL}`} className="text-[#FF4500] hover:text-orange-400 transition-colors underline underline-offset-2">
                {DPO_EMAIL}
              </a>
            </p>
          </div>
        </Section>

        {/* 2 — Dados coletados */}
        <Section id="dados-coletados" titulo="2. Quais dados são coletados e por quê">
          <P>Coletamos dois tipos de dados: dados dos <strong className="text-zinc-200">usuários (corretores)</strong> e dados dos <strong className="text-zinc-200">leads (clientes dos corretores)</strong>.</P>

          <h3 className="text-sm font-bold text-zinc-200 mt-5 mb-2">2.1 Dados dos usuários (corretores)</h3>
          <Tabela
            headers={['Dado', 'Finalidade', 'Base legal']}
            rows={[
              ['E-mail', 'Identificação e autenticação na conta', 'Execução de contrato (art. 7º, V)'],
              ['Nome completo', 'Personalização da interface e comunicações', 'Execução de contrato (art. 7º, V)'],
              ['Telefone / WhatsApp', 'Contato para suporte', 'Execução de contrato (art. 7º, V)'],
              ['Foto de perfil', 'Exibição no sistema (opcional)', 'Consentimento (art. 7º, I)'],
              ['CPF, e-mail, celular (checkout)', 'Cobrança via AbacatePay', 'Execução de contrato (art. 7º, V)'],
              ['Aceite dos Termos e Política', 'Registro de consentimento com data e IP', 'Cumprimento de obrigação legal (art. 7º, II)'],
            ]}
          />

          <h3 className="text-sm font-bold text-zinc-200 mt-6 mb-2">2.2 Dados dos leads (clientes dos corretores)</h3>
          <P>
            Os corretores cadastram dados de seus clientes prospectivos no sistema. O GrowSorcio atua como{' '}
            <strong className="text-zinc-200">operador</strong> desses dados — o corretor é o controlador perante os seus leads.
          </P>
          <Tabela
            headers={['Dado', 'Origem', 'Base legal do corretor']}
            rows={[
              ['Nome, WhatsApp, e-mail, Instagram', 'Cadastro manual ou webhook Meta Ads', 'Legítimo interesse (art. 7º, IX)'],
              ['Restrição de CPF (sim/não)', 'Cadastro manual pelo corretor', 'Legítimo interesse (art. 7º, IX)'],
              ['Valor da carta, recurso para lance', 'Cadastro manual pelo corretor', 'Legítimo interesse (art. 7º, IX)'],
              ['Urgência, tipo de bem', 'Cadastro manual pelo corretor', 'Legítimo interesse (art. 7º, IX)'],
              ['Anotações e observações', 'Inseridas pelo corretor', 'Legítimo interesse (art. 7º, IX)'],
              ['Histórico de interações e cadências', 'Inseridas pelo corretor', 'Legítimo interesse (art. 7º, IX)'],
            ]}
          />
        </Section>

        {/* 3 — Como usamos */}
        <Section id="uso" titulo="3. Como os dados são usados">
          <Ul items={[
            'Autenticar e manter sua sessão no sistema',
            'Personalizar a interface do CRM com seu nome e foto',
            'Processar pagamentos e emitir cobranças via AbacatePay',
            'Enviar comunicações relacionadas à sua conta (confirmações, suporte)',
            'Permitir que o corretor gerencie seu funil de leads e interações',
            'Registrar aceites de documentos legais para fins de auditoria',
          ]} />
          <P>
            Não usamos seus dados para publicidade de terceiros, criação de perfis comportamentais
            ou qualquer finalidade incompatível com a descrita acima.
          </P>
        </Section>

        {/* 4 — Compartilhamento */}
        <Section id="compartilhamento" titulo="4. Com quem compartilhamos seus dados">
          <P>
            Compartilhamos dados apenas com os prestadores de serviço estritamente necessários, todos
            atuando como <strong className="text-zinc-200">operadores</strong> sob nossas instruções:
          </P>
          <Tabela
            headers={['Parceiro', 'Dados compartilhados', 'Finalidade']}
            rows={[
              ['Supabase (EUA)', 'Todos os dados do sistema', 'Banco de dados e autenticação (PostgreSQL + Auth)'],
              ['AbacatePay (Brasil)', 'Nome, e-mail, CPF, celular', 'Processamento de pagamentos PIX e cartão'],
              ['Meta Platforms (EUA)', 'Leads recebidos via webhook', 'Recebimento de leads gerados por anúncios Meta Ads'],
              ['Vercel (EUA)', 'Dados de navegação e requisições', 'Hospedagem e CDN do frontend'],
            ]}
          />
          <P>
            Não vendemos dados pessoais a terceiros. Não compartilhamos dados com corretores de
            outras organizações. Cada organização tem acesso exclusivo aos seus próprios dados.
          </P>
        </Section>

        {/* 5 — Retenção */}
        <Section id="retencao" titulo="5. Por quanto tempo guardamos seus dados">
          <Tabela
            headers={['Categoria', 'Prazo de retenção', 'Motivo']}
            rows={[
              ['Dados da conta (perfil, email)', 'Enquanto a conta estiver ativa', 'Execução do contrato'],
              ['Dados financeiros (cobranças, CPF)', '5 anos após a última transação', 'Obrigação legal (Código Tributário e Lei 9430/96)'],
              ['Leads e interações cadastrados', 'Enquanto a conta estiver ativa', 'Sob controle do corretor'],
              ['Registros de aceite (consent_records)', '10 anos', 'Prova de cumprimento da LGPD'],
              ['Após exclusão da conta', 'Dados pessoais anonimizados imediatamente', 'Direito ao apagamento (art. 18, VI)'],
            ]}
          />
        </Section>

        {/* 6 — Direitos */}
        <Section id="direitos" titulo="6. Seus direitos como titular de dados">
          <P>
            Pela LGPD, você tem os seguintes direitos sobre seus dados pessoais:
          </P>
          <Ul items={[
            'Acesso — saber quais dados temos sobre você (disponível em Minha Conta → Meus Dados)',
            'Correção — atualizar dados incompletos ou desatualizados (disponível em Configurações → Perfil)',
            'Exclusão — solicitar a exclusão da sua conta e anonimização dos seus dados pessoais',
            'Portabilidade — exportar seus dados em formato JSON (disponível em Minha Conta → Meus Dados)',
            'Revogação do consentimento — retirar seu consentimento para o tratamento baseado nessa base legal',
            'Informação sobre compartilhamento — saber com quem compartilhamos seus dados (seção 4 acima)',
            'Oposição — se opor ao tratamento em casos específicos',
          ]} />
          <P>
            Para exercer qualquer um desses direitos, acesse{' '}
            <strong className="text-zinc-200">Configurações → Minha Conta</strong>{' '}
            no app, ou entre em contato com{' '}
            <a href={`mailto:${DPO_EMAIL}`} className="text-[#FF4500] hover:text-orange-400 underline underline-offset-2 transition-colors">
              {DPO_EMAIL}
            </a>.
            Respondemos dentro de 15 dias úteis.
          </P>
        </Section>

        {/* 7 — Segurança */}
        <Section id="seguranca" titulo="7. Como protegemos seus dados">
          <Ul items={[
            'Banco de dados com Row Level Security (RLS): cada organização acessa somente seus próprios dados',
            'Autenticação via JWT com expiração automática de sessão',
            'Comunicação criptografada via HTTPS/TLS em todos os endpoints',
            'Acesso ao banco restrito a serviços autorizados — sem acesso direto externo',
            'Dados financeiros (CPF, meios de pagamento) processados exclusivamente pelo AbacatePay — não armazenamos dados de cartão',
          ]} />
        </Section>

        {/* 8 — Cookies */}
        <Section id="cookies" titulo="8. Cookies e armazenamento local">
          <P>
            Usamos apenas armazenamentos essenciais e funcionais — sem cookies de rastreamento,
            analytics ou marketing. Para detalhes completos, consulte a{' '}
            <a href="/cookies" className="text-[#FF4500] hover:text-orange-400 underline underline-offset-2 transition-colors">
              Política de Cookies
            </a>.
          </P>
        </Section>

        {/* 9 — Transferência internacional */}
        <Section id="transferencia" titulo="9. Transferência internacional de dados">
          <P>
            Alguns de nossos parceiros (Supabase, Vercel, Meta) estão localizados nos Estados Unidos.
            Essas transferências são realizadas com base em cláusulas contratuais padrão e garantias
            adequadas de proteção, conforme art. 33 da LGPD.
          </P>
        </Section>

        {/* 10 — Contato */}
        <Section id="contato" titulo="10. Contato e DPO">
          <P>
            Para dúvidas, solicitações de direitos ou qualquer questão relacionada ao tratamento de
            dados pessoais, entre em contato com o nosso Encarregado de Proteção de Dados (DPO):
          </P>
          <div className="mt-3 p-4 rounded-xl bg-white/3 border border-white/8">
            <p className="text-sm text-zinc-300 font-semibold">GrowSorcio — DPO</p>
            <a
              href={`mailto:${DPO_EMAIL}`}
              className="text-[#FF4500] hover:text-orange-400 underline underline-offset-2 transition-colors text-sm"
            >
              {DPO_EMAIL}
            </a>
            <p className="text-xs text-zinc-500 mt-1">Prazo de resposta: até 15 dias úteis</p>
          </div>
        </Section>

        {/* Footer da página */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 GrowSorcio · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/cookies" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              Política de Cookies
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
