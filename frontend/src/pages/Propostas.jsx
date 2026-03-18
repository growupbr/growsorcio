import LockedFeature from '../components/LockedFeature';

export default function Propostas() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Propostas</h1>
        <p className="text-muted text-sm">Geração e gestão de propostas em PDF com a sua marca</p>
      </div>
      <LockedFeature
        title="Propostas com a sua marca"
        plan="PRO"
      />
    </div>
  );
}
