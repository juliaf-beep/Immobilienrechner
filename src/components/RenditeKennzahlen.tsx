import { Card } from '@mmp/shared-ui';
import type { RenditeKennzahlen as RK } from '../utils/kaufen-mieten';

const fmt = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' €';

interface Props {
  rendite: RK;
  ek: number;
}

export default function RenditeKennzahlenCard({ rendite: r, ek }: Props) {
  const ekrTxt = r.ekRendite !== null ? r.ekRendite.toFixed(1) + ' %' : '—';

  return (
    <Card className="bg-white rounded-km p-6">
      <div className="text-base font-semibold text-black mb-4 flex items-center gap-2.5 font-serif after:content-[''] after:flex-1 after:h-px after:bg-km-lav/50">
        Rendite-Kennzahlen
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        <MetricBox label="Objektrendite" value={`${r.nettoRendite.toFixed(1)} %`} positive={r.nettoRendite >= 0} hint="Nettomietertrag ÷ Gesamtinvestition" />
        <MetricBox label="Eigenkapitalrendite" value={ekrTxt} positive={r.ekRendite === null ? undefined : r.ekRendite >= 0} hint="Jahresreinertrag ÷ Eigenkapital" />
        <MetricBox label="Monatl. Cashflow" value={`${r.cashflowMonat >= 0 ? '+' : ''}${fmt(r.cashflowMonat)}`} positive={r.cashflowMonat >= 0} hint="Miete − Kosten − Annuität (vor Steuern)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <CalcTable title="Objektrendite" rows={[
          ['Jahres-Kaltmiete', fmt(r.jahresmiete)],
          ['– Bewirtschaftungskosten', fmt(r.kostenJ)],
          ['= Nettomietertrag p. a.', fmt(r.nmt), true],
          ['÷ Gesamtinvestition', fmt(r.gesamtinvest)],
          ['= Objektrendite', `${r.nettoRendite.toFixed(1)} %`, true, true],
        ]} />
        <CalcTable title="Eigenkapitalrendite" rows={[
          ['Nettomietertrag p. a.', fmt(r.nmt)],
          ['– Zinsen p. a.', fmt(r.zinsenJ)],
          ['= Jahresreinertrag', fmt(r.reinertrag), true],
          ['÷ Eigenkapital', ek > 0 ? fmt(ek) : '0 € (100% Finanzierung)'],
          ['= Eigenkapitalrendite', ekrTxt, true, true],
        ]} />
      </div>

      <div
        className={`rounded-xl p-3.5 text-xs leading-relaxed border-l-[3px] [&_strong]:text-black [&_strong]:font-medium ${
          r.leverageType === 'pos' ? 'bg-green-500/[.07] border-l-green-500 text-km-muted'
          : r.leverageType === 'neg' ? 'bg-red-500/[.07] border-l-red-500 text-km-muted'
          : 'bg-km-ice border-l-km-lav text-km-muted'
        }`}
        dangerouslySetInnerHTML={{ __html: r.leverageText }}
      />
    </Card>
  );
}

function MetricBox({ label, value, positive, hint }: { label: string; value: string; positive?: boolean; hint: string }) {
  return (
    <div className="bg-km-ice rounded-xl p-3.5">
      <div className="text-[11px] font-medium tracking-wider uppercase text-km-muted mb-1">{label}</div>
      <div className={`text-xl font-semibold mb-0.5 ${positive === undefined ? 'text-black' : positive ? 'text-green-700' : 'text-red-700'}`}>{value}</div>
      <div className="text-[10px] text-gray-400 leading-tight">{hint}</div>
    </div>
  );
}

function CalcTable({ title, rows }: { title: string; rows: [string, string, boolean?, boolean?][] }) {
  return (
    <div className="bg-km-ice rounded-xl p-4">
      <div className="text-[11px] font-medium text-km-muted uppercase tracking-wider mb-3">{title}</div>
      {rows.map(([label, val, isResult, isHighlight], i) => (
        <div
          key={i}
          className={`flex justify-between text-xs py-1 ${
            isResult ? 'border-t border-km-lav/40 mt-1 pt-2 font-semibold text-black' : 'text-km-muted'
          }`}
        >
          <span className={isResult ? 'text-black' : 'text-km-muted'}>{label}</span>
          <span className={`font-medium ${isHighlight ? 'text-km-uv text-base font-semibold' : isResult ? 'text-black' : 'text-gray-600'}`}>{val}</span>
        </div>
      ))}
    </div>
  );
}
