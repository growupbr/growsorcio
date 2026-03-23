import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, Star, Shield } from "lucide-react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import CheckoutModal from "../CheckoutModal";

const ABACATEPAY_LINKS = {
  start: {
    monthly: import.meta.env.VITE_ABACATEPAY_LINK_START_MONTHLY,
    yearly: import.meta.env.VITE_ABACATEPAY_LINK_START_YEARLY,
  },
  pro: {
    monthly: import.meta.env.VITE_ABACATEPAY_LINK_PRO_MONTHLY,
    yearly: import.meta.env.VITE_ABACATEPAY_LINK_PRO_YEARLY,
  },
  elite: {
    monthly: import.meta.env.VITE_ABACATEPAY_LINK_ELITE_MONTHLY,
    yearly: import.meta.env.VITE_ABACATEPAY_LINK_ELITE_YEARLY,
  },
};

const PLANS = [
  {
    id: "start",
    name: "Grow START",
    price: 147,
    yearlyPrice: 117,
    period: "mês",
    description: "Organização que uma planilha nunca vai te dar",
    buttonText: "Começar com o START",
    href: "#",
    isPopular: false,
    features: [
      "Funil Blessed 4.0 (10 etapas)",
      "Integração Meta Ads via Webhook",
      "Click-to-Zap dinâmico",
      "Qualificação Blessed nativa",
      "Calculadora Consórcio x Financiamento",
      "Gestão de Snooze & Histórico",
      "01 usuário",
    ],
  },
  {
    id: "pro",
    name: "Grow PRO",
    price: 447,
    yearlyPrice: 357,
    period: "mês",
    description: "Para quem já tem ritmo e quer escalar com time",
    buttonText: "Escalar com o PRO",
    href: "#",
    isPopular: true,
    features: [
      "Tudo do START +",
      "Até 03 usuários",
      "Calculadora com sua marca (PDF)",
      "Cofre Digital de Documentos",
      "Follow-up Inteligente com alertas",
      "Notificações em tempo real",
      "Automação de Pré-Venda",
    ],
  },
  {
    id: "elite",
    name: "Grow ELITE AI",
    price: 997,
    yearlyPrice: 797,
    period: "mês",
    description: "Para operações com volume alto e equipe de vendas",
    buttonText: "Quero o ELITE AI",
    href: "#",
    isPopular: false,
    features: [
      "Tudo do PRO +",
      "Usuários ilimitados",
      "Agente IA de Qualificação 24/7",
      "Lead Scoring por IA (1–5 estrelas)",
      "Agendamento automático via IA",
      "Painel BI de equipe",
      "WhatsApp API integrado",
      "Onboarding VIP com o time",
    ],
  },
];

// Fix #1: AnimatedPrice substitui NumberFlow (sem bugs de dígitos em coluna)
function AnimatedPrice({ value }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    setDisplayed(value);
  }, [value]);

  return (
    <span className="text-5xl font-bold text-white tabular-nums transition-all duration-500 font-['Space_Grotesk',sans-serif]">
      {displayed.toLocaleString("pt-BR")}
    </span>
  );
}

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FF4500", "#FF6B35", "#27272a", "#ffffff"],
  });
}

export default function PricingSection() {
  const [isMonthly, setIsMonthly] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [checkout, setCheckout] = useState(null); // { plan, billingPeriod }

  function handlePlanClick(planId) {
    const billingPeriod = isMonthly ? "monthly" : "yearly";
    const directCheckoutLink = ABACATEPAY_LINKS?.[planId]?.[billingPeriod];

    if (directCheckoutLink) {
      window.location.href = directCheckoutLink;
      return;
    }

    // Fallback: mantém fluxo atual via modal quando link direto não estiver configurado
    setCheckout({ plan: planId, billingPeriod });
  }

  function handleToggle() {
    const next = !isMonthly;
    setIsMonthly(next);
    if (!next) fireConfetti();
  }

  return (
    <section id="precos" className="max-w-6xl mx-auto px-4 py-24">
      {/* Título */}
      <div className="text-center mb-10">
        <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">
          Investimento
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk',sans-serif]">
          Quanto custa uma venda perdida por mês?
        </h2>
        <p className="text-zinc-500 text-base max-w-2xl mx-auto mt-3">Um corretor médio perde 4 a 6 vendas por mês por falta de organização. O GrowSorcio custa menos que uma comissão.</p>
      </div>

      {/* Fix #4: Toggle com feedback visual claro */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-semibold transition-colors duration-150 ${isMonthly ? "text-white" : "text-zinc-500"}`}>
          Mensal
        </span>
        <button
          onClick={handleToggle}
          aria-label="Alternar cobrança mensal ou anual"
          className="relative w-12 h-6 rounded-full border border-white/20 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500]"
          style={{ backgroundColor: !isMonthly ? "#FF4500" : "rgba(255,255,255,0.1)" }}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
            style={{ left: isMonthly ? 2 : undefined, right: !isMonthly ? 2 : undefined }}
          />
        </button>
        <span className="text-sm flex items-center gap-1">
          <span className={`font-semibold transition-colors duration-150 ${!isMonthly ? "text-[#FF4500]" : "text-zinc-400"}`}>
            Anual
          </span>
          <span className={`text-xs transition-opacity duration-150 text-green-400 ${!isMonthly ? "opacity-100" : "opacity-50"}`}>
            Anual — 2 meses grátis
          </span>
        </span>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {PLANS.map((plan, i) => {
          const isCenter = plan.isPopular;
          const price = isMonthly ? plan.price : plan.yearlyPrice;

          const cardVariants = {
            hidden: { y: 50, opacity: 0 },
            visible: {
              y: isCenter && !isMobile ? -20 : 0,
              opacity: 1,
              scale: isCenter && !isMobile ? 1.0 : isMobile ? 1 : 0.94,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: i * 0.1 + 0.1,
              },
            },
          };

          return (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className={[
                "relative rounded-xl p-6 flex flex-col gap-5 backdrop-blur",
                // Fix #3: ring + shadow no card PRO
                isCenter
                  ? "bg-white/5 border-2 border-[#FF4500] ring-2 ring-[#FF4500] ring-offset-2 ring-offset-zinc-950 shadow-[0_0_40px_rgba(255,69,0,0.2)] z-10"
                  : "bg-white/5 border border-white/10",
              ].join(" ")}
            >
              {/* Badge Recomendado */}
              {isCenter && (
                <span className="flex items-center gap-1 bg-[#FF4500] text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Star size={11} fill="white" strokeWidth={0} />
                  Recomendado
                </span>
              )}

              {/* Cabeçalho */}
              <div>
                <p className="text-white font-bold text-lg font-['Space_Grotesk',sans-serif]">
                  {plan.name}
                </p>
                <p className="text-zinc-500 text-sm mt-0.5">{plan.description}</p>
              </div>

              {/* Fix #1: Preço com AnimatedPrice */}
              <div className="flex flex-col gap-1">
                {isCenter && (
                  <span className="text-xs bg-[#FF4500]/20 text-[#FF4500] px-2 py-0.5 rounded-full font-semibold w-fit">
                    Escolha de quem fatura acima da média
                  </span>
                )}
                <div className="flex items-end gap-1">
                  <span className="text-zinc-400 text-lg font-medium mb-1">R$</span>
                  <AnimatedPrice value={price} />
                  <span className="text-zinc-500 text-sm mb-1.5">/{plan.period}</span>
                </div>
              </div>
              {!isCenter && i === 0 && (
                <p className="text-zinc-500 text-xs text-center">Sem cartão no cadastro</p>
              )}

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-[#FF4500] mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                onClick={() => handlePlanClick(plan.id)}
                className={[
                  "w-full py-3 rounded-lg text-sm font-semibold text-center transition-colors duration-150 min-h-[44px] flex items-center justify-center cursor-pointer",
                  isCenter
                    ? "btn-shimmer text-white"
                    : "border border-white/20 hover:border-white/40 text-white hover:bg-white/5",
                ].join(" ")}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Garantia */}
      <div className="mt-10 flex items-center justify-center gap-2 text-zinc-500 text-sm">
        <Shield size={14} className="text-[#FF4500]" />
        <span>30 dias de garantia incondicional · Sem fidelidade · Cancele quando quiser · Seus dados são seus</span>
      </div>

      {/* Checkout Modal */}
      {checkout && (
        <CheckoutModal
          plan={checkout.plan}
          billingPeriod={checkout.billingPeriod}
          onClose={() => setCheckout(null)}
        />
      )}
    </section>
  );
}
