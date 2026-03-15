import { useState } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import confetti from "canvas-confetti";
import { Check, Star, Shield } from "lucide-react";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const PLANS = [
  {
    name: "Grow START",
    price: 147,
    yearlyPrice: 117,
    period: "mês",
    description: "Para o corretor que quer parar de perder leads",
    buttonText: "Começar Agora",
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
    name: "Grow PRO",
    price: 447,
    yearlyPrice: 357,
    period: "mês",
    description: "Para corretores que querem autoridade máxima",
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
    name: "Grow ELITE AI",
    price: 997,
    yearlyPrice: 797,
    period: "mês",
    description: "Para escritórios que investem pesado em tráfego",
    buttonText: "Falar com Consultor",
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

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#FF4500", "#FF6B35", "#1E293B", "#ffffff"],
  });
}

export default function PricingSection() {
  const [isMonthly, setIsMonthly] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

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
          Planos
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk',sans-serif]">
          Escolha seu plano
        </h2>
      </div>

      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-medium transition-colors duration-150 ${isMonthly ? "text-white" : "text-zinc-500"}`}>
          Mensal
        </span>
        <button
          onClick={handleToggle}
          aria-label="Alternar cobrança mensal ou anual"
          className="relative w-12 h-6 rounded-full bg-white/10 border border-white/20 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500]"
          style={{ backgroundColor: !isMonthly ? "#FF4500" : undefined }}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
            style={{ left: isMonthly ? 2 : undefined, right: !isMonthly ? 2 : undefined }}
          />
        </button>
        <span className={`text-sm font-medium transition-colors duration-150 ${!isMonthly ? "text-white" : "text-zinc-500"}`}>
          Anual{" "}
          <span className="text-emerald-400 text-xs font-semibold">(Economize 20%)</span>
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
                isCenter
                  ? "bg-white/5 border-2 border-[#FF4500]"
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

              {/* Preço animado */}
              <div className="flex items-end gap-1">
                <span className="text-zinc-400 text-lg font-medium">R$</span>
                <NumberFlow
                  value={price}
                  format={{ notation: "standard" }}
                  className="text-white text-4xl font-bold font-['Space_Grotesk',sans-serif] tabular-nums"
                />
                <span className="text-zinc-500 text-sm mb-1">/{plan.period}</span>
              </div>

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
              <a
                href={plan.href}
                className={[
                  "w-full py-3 rounded-lg text-sm font-semibold text-center transition-colors duration-150 min-h-[44px] flex items-center justify-center",
                  isCenter
                    ? "btn-shimmer text-white"
                    : "border border-white/20 hover:border-white/40 text-white",
                ].join(" ")}
              >
                {plan.buttonText}
              </a>
            </motion.div>
          );
        })}
      </div>

      {/* Garantia */}
      <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 text-sm">
        <Shield size={14} className="text-[#FF4500]" />
        <span>30 dias de garantia · Sem fidelidade · Cancele quando quiser</span>
      </div>
    </section>
  );
}
