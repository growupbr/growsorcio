import LockedFeature from '../components/LockedFeature';

export default function GrowIA() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">GrowIA</h1>
        <p className="text-muted text-sm">Agente de IA que qualifica leads, agenda reuniões e pontua perfis automaticamente</p>
      </div>
      <LockedFeature
        title="Agente de Inteligência Artificial"
        plan="ELITE AI"
      />
    </div>
  );
}
