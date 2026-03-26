import LockedFeature from '../components/LockedFeature';
import { useSubscription } from '../hooks/useSubscription';

export default function GrowIA() {
  const { hasFeature, loading } = useSubscription();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">GrowIA</h1>
        <p className="text-muted text-sm">Agente de IA que qualifica leads, agenda reuniões e pontua perfis automaticamente</p>
      </div>
      {!loading && !hasFeature('growia') && (
        <LockedFeature
          title="Agente de Inteligência Artificial"
          plan="Elite"
        />
      )}
    </div>
  );
}
