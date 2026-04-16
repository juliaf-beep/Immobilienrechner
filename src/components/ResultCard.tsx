import type { Metric } from '../utils/kaufen-mieten';

interface ResultCardProps {
  headline: string;
  subtitle: string;
  win: boolean;
  metrics: Metric[];
}

export default function ResultCard({ headline, subtitle, win, metrics }: ResultCardProps) {
  return (
    <div className={`rounded-km p-8 ${win ? 'bg-km-uv' : 'bg-km-zit'}`}>
      <h2 className={`font-serif text-[1.75rem] font-semibold mb-1 ${win ? 'text-white' : 'text-km-bord'}`}>
        {headline}
      </h2>
      <p className={`text-sm mb-6 ${win ? 'text-white/80' : 'text-km-bord/55'}`}>
        {subtitle}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {metrics.map(m => (
          <div key={m.label} className={`rounded-xl p-3.5 ${win ? 'bg-white/15' : 'bg-black/[.07]'}`}>
            <div className={`text-[11px] mb-1 leading-tight ${win ? 'text-white/70' : 'text-km-bord/55'}`}>{m.label}</div>
            <div className={`text-base font-medium ${
              m.positive ? (win ? 'text-km-zit' : 'text-km-uv') : (win ? 'text-white' : 'text-black')
            }`}>{m.value}</div>
            {m.sub && <div className={`text-[10px] mt-0.5 leading-tight ${win ? 'text-white/45' : 'text-km-bord/40'}`}>{m.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
