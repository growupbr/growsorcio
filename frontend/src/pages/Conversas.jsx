import LockedFeature from '../components/LockedFeature';

export default function Conversas() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Conversas WhatsApp</h1>
        <p className="text-muted text-sm">Inbox unificado de WhatsApp com histórico e automações</p>
      </div>
      <LockedFeature
        title="Inbox de WhatsApp integrado"
        plan="ELITE AI"
      />
    </div>
  );
}
