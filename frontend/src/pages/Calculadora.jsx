import { Calculator } from 'lucide-react';

export default function Calculadora() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Calculator size={24} className="text-accent" />
          <h1 className="text-2xl font-bold text-text">Calculadora</h1>
        </div>
        <p className="text-muted text-sm">Consórcio vs Financiamento — compare na hora</p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-dark-800 border border-dark-600">
          <Calculator size={28} className="text-muted" />
        </div>
        <div>
          <p className="text-text font-medium">Em construção</p>
          <p className="text-muted text-sm mt-1">A calculadora está sendo preparada. Disponível em breve.</p>
        </div>
      </div>
    </div>
  );
}
