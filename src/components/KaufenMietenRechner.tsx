import { useState, useMemo, useCallback } from 'react';
import { Heading } from '@mmp/shared-ui';
import type { Mode, SharedInputs, EigenInputs, KapitalInputs } from '../utils/kaufen-mieten';
import { calcEigen, calcKapital } from '../utils/kaufen-mieten';
import InputSection, { type InputValues } from './InputSection';
import ResultCard from './ResultCard';
import InsightsSection from './InsightsSection';
import WealthChart from './WealthChart';
import RenditeKennzahlenCard from './RenditeKennzahlen';

const DEFAULT_VALUES: InputValues = {
  infl: 2.5, rend: 6, kest: 18.46,
  kaufpreis: 400000, mod: 0, ws: 2,
  gest: 3.5, notar: 2, makler: 3.57,
  ek: 100000, zins: 3.8, tilg: 2, verw: 200, ih: 1.5,
  miete: 1200, ms: 2.5, xspar: 0,
  mietein: 1400, ms2: 2, leer: 2, grenz: 42, afa: 2,
};

function toShared(v: InputValues): SharedInputs {
  return {
    infl: v.infl / 100, rend: v.rend / 100, kest: v.kest / 100,
    kp: v.kaufpreis, mod: v.mod, ws: v.ws / 100,
    gest: v.gest / 100, notar: v.notar / 100, makl: v.makler / 100,
    ek: v.ek, zins: v.zins / 100, tilg: v.tilg / 100,
    verw: v.verw, ih: v.ih / 100,
  };
}

function toEigen(v: InputValues): EigenInputs {
  return { miete: v.miete, ms: v.ms / 100, xSpar: v.xspar };
}

function toKapital(v: InputValues): KapitalInputs {
  return { mietein: v.mietein, ms2: v.ms2 / 100, leer: v.leer / 100, grenz: v.grenz / 100, afa: v.afa / 100 };
}

export default function KaufenMietenRechner() {
  const [mode, setMode] = useState<Mode>('eigen');
  const [values, setValues] = useState<InputValues>(DEFAULT_VALUES);

  const handleChange = useCallback((key: keyof InputValues, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const shared = useMemo(() => toShared(values), [values]);
  const eigenResult = useMemo(() => mode === 'eigen' ? calcEigen(shared, toEigen(values)) : null, [mode, shared, values]);
  const kapitalResult = useMemo(() => mode === 'kapital' ? calcKapital(shared, toKapital(values)) : null, [mode, shared, values]);

  const result = mode === 'eigen' ? eigenResult : kapitalResult;
  const noteText = mode === 'eigen'
    ? '<strong>Selbst einziehen vs. Mieten:</strong> K\u00e4uferin-Verm\u00f6gen = Immobilienwert \u2212 Restschuld. Mieterin-Depot = EK als Einmalanlage + monatliche Differenz (Kaufkosten \u2212 Miete), verzinst mit Depot-Rendite, nach KESt. Instandhaltung w\u00e4chst mit Inflation, Miete mit Mietsteigerungsrate. Kein Steuerabzug auf Immobiliengewinn bei Eigennutzung \u2265 3 J.'
    : '<strong>Vermieten vs. ETF:</strong> Die ETF-Investorin legt das EK als Einmalanlage an und investiert zus\u00e4tzlich monatlich den Eigenanteil der Vermieterin (Annuit\u00e4t + Kosten \u2212 Mieteinnahmen nach Steuern, min. 0). Das ETF-Depot kann niemals schrumpfen. Vermieterin-Verm\u00f6gen = Immobilien-EK + reinvestierter Miet\u00fcberschuss. Immobiliengewinn nach 10 J. Haltedauer steuerfrei. AfA und Zinsen steuerlich absetzbar.';

  return (
    <div className="bg-km-creme text-gray-600 p-4 md:p-8 font-sans">
      <div className="max-w-[780px] mx-auto">
        <Heading as="h1" size="h3" className="font-serif text-black mb-1">Immobilie kaufen — oder nicht?</Heading>
        <p className="text-sm text-km-muted mb-7">
          Wähle deinen Vergleich und finde heraus, welche Strategie mehr Vermögen aufbaut.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <ModeButton
            active={mode === 'eigen'}
            onClick={() => setMode('eigen')}
            title="Selbst einziehen vs. Mieten"
            desc="Kaufe ich eine Immobilie und wohne selbst darin — oder wohne ich weiter zur Miete und investiere den Unterschied?"
          />
          <ModeButton
            active={mode === 'kapital'}
            onClick={() => setMode('kapital')}
            title="Vermieten vs. ETF-Depot"
            desc="Kaufe ich eine Immobilie und vermiete sie — oder lege ich dasselbe Kapital in einem ETF-Depot an?"
          />
        </div>

        <InputSection mode={mode} values={values} onChange={handleChange} />

        {result && (
          <div className="space-y-4 mt-4">
            <ResultCard headline={result.headline} subtitle={result.subtitle} win={result.win} metrics={result.metrics} />

            {mode === 'kapital' && kapitalResult && (
              <RenditeKennzahlenCard rendite={kapitalResult.rendite} ek={values.ek} />
            )}

            <InsightsSection insights={result.insights} />

            <WealthChart
              data={result.chartData}
              breakeven={result.breakeven}
              labelA={mode === 'eigen' ? 'Käuferin (Eigennutzung)' : 'Vermieterin'}
              labelB={mode === 'eigen' ? 'Mieterin + ETF (nach KESt)' : 'ETF-Investorin (nach KESt)'}
              explain={result.chartExplain}
            />

            <div className="bg-km-ice rounded-km p-5">
              <p
                className="text-xs text-km-muted leading-relaxed [&_strong]:text-black [&_strong]:font-medium"
                dangerouslySetInnerHTML={{ __html: noteText }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-km p-5 border-2 transition-colors w-full ${
        active
          ? 'bg-km-uv border-km-uv'
          : 'bg-white border-km-lav hover:border-km-uv'
      }`}
    >
      <div className={`font-serif text-[1.05rem] font-semibold mb-1 ${active ? 'text-white' : 'text-black'}`}>{title}</div>
      <div className={`text-[0.8rem] leading-relaxed ${active ? 'text-white/80' : 'text-km-muted'}`}>{desc}</div>
    </button>
  );
}
