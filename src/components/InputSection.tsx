import { useState } from 'react';
import { Card } from '@mmp/shared-ui';
import type { Mode } from '../utils/kaufen-mieten';

interface FieldDef {
  id: string;
  label: string;
  tip: string;
  step?: number;
}

function Field({ id, label, tip, value, step, onChange }: FieldDef & { value: number; onChange: (v: number) => void }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="flex flex-col pb-5 relative">
      <div className="flex items-center gap-1.5 mb-1.5">
        <label htmlFor={id} className="text-[11px] font-medium tracking-wider uppercase text-km-muted leading-tight">{label}</label>
        <button
          type="button"
          className="w-4 h-4 rounded-full border-[1.5px] border-km-lav bg-transparent text-km-muted text-[9px] font-bold inline-flex items-center justify-center flex-shrink-0 hover:border-km-uv hover:text-km-uv transition-all"
          onClick={e => { e.stopPropagation(); setShowTip(!showTip); }}
        >i</button>
      </div>
      <input
        id={id}
        type="number"
        value={value}
        step={step ?? 1}
        onChange={e => onChange(+e.target.value || 0)}
        className="w-full bg-transparent border-b-2 border-km-lav outline-none py-1.5 px-0.5 text-base text-black transition-colors focus:border-km-uv [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {showTip && (
        <div
          className="absolute top-full -mt-3 left-0 w-[280px] bg-km-ice border border-km-lav rounded-xl p-3 text-xs text-km-muted leading-relaxed z-50"
          onClick={e => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: tip }}
        />
      )}
    </div>
  );
}

interface NebenkostenDisplayProps {
  kp: number; gest: number; notar: number; makler: number;
}

function NebenkostenDisplay({ kp, gest, notar, makler }: NebenkostenDisplayProps) {
  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' \u20ac';
  const gv = kp * gest / 100, nv = kp * notar / 100, mv = kp * makler / 100, tot = gv + nv + mv;
  return (
    <div className="bg-km-ice rounded-xl p-3.5 mt-1">
      {[['Grunderwerbsteuer', gv], ['Notar + Grundbuch', nv], ['Maklerprovision', mv]].map(([l, v]) => (
        <div key={l as string} className="flex justify-between text-xs py-0.5 text-km-muted">
          <span>{l as string}</span><span>{fmt(v as number)}</span>
        </div>
      ))}
      <div className="flex justify-between text-[13px] font-semibold text-black pt-2 mt-1 border-t border-km-lav/40">
        <span>Nebenkosten gesamt</span><span>{fmt(tot)}</span>
      </div>
    </div>
  );
}

export interface InputValues {
  infl: number; rend: number; kest: number;
  kaufpreis: number; mod: number; ws: number;
  gest: number; notar: number; makler: number;
  ek: number; zins: number; tilg: number; verw: number; ih: number;
  miete: number; ms: number; xspar: number;
  mietein: number; ms2: number; leer: number; grenz: number; afa: number;
}

interface InputSectionProps {
  mode: Mode;
  values: InputValues;
  onChange: (key: keyof InputValues, val: number) => void;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="text-base font-semibold text-black mb-4 flex items-center gap-2.5 font-serif after:content-[''] after:flex-1 after:h-px after:bg-km-lav/50">
      {children}
    </div>
  );
}

export default function InputSection({ mode, values: v, onChange }: InputSectionProps) {
  const f = (key: keyof InputValues, label: string, tip: string, step?: number) => (
    <Field id={key} label={label} tip={tip} step={step} value={v[key]} onChange={val => onChange(key, val)} />
  );

  return (
    <div className="space-y-4">
      <Card className="bg-white rounded-km p-6">
        <SectionTitle>Immobilie</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
          {f('kaufpreis', 'Kaufpreis (\u20ac)', 'Angebotspreis der Immobilie. Kaufnebenkosten werden zus\u00e4tzlich berechnet.', 10000)}
          {f('mod', 'Modernisierungskosten (\u20ac)', 'Einmalige Renovierungskosten \u2014 werden dem Darlehen addiert, keine Nebenkosten darauf.', 5000)}
          {f('ws', 'Wertsteigerung (% p. a.)', 'J\u00e4hrliche nominale Wertsteigerung. <strong>Historisch DE:</strong> ~2\u20133% nominal. <strong>Regional:</strong> Ballungszentren >4%, l\u00e4ndlich &lt;1%.', 0.5)}
        </div>
      </Card>

      <Card className="bg-white rounded-km p-6">
        <SectionTitle>Kaufnebenkosten</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
          {f('gest', 'Grunderwerbsteuer (%)', 'Je nach Bundesland:<br>Bayern/Sachsen: <strong>3,5%</strong><br>Hamburg: <strong>4,5%</strong><br>Hessen/MV/Th\u00fcringen/Berlin: <strong>5%</strong><br>NRW/Brandenburg/Saarland/SH: <strong>6,5%</strong>', 0.5)}
          {f('notar', 'Notar + Grundbuch (%)', 'Notarkosten ~0,8\u20131,5% + Grundbucheintragung ~0,3\u20130,5%. <strong>Zusammen: 1,5\u20132%.</strong>', 0.25)}
          {f('makler', 'Maklerprovision (%)', 'Seit 2020 h\u00e4lftig geteilt. Gesamtprovision 5,95\u20137,14%, K\u00e4uferanteil 2,975\u20133,57%. Privatverkauf: <strong>0%</strong>.', 0.5)}
        </div>
        <NebenkostenDisplay kp={v.kaufpreis} gest={v.gest} notar={v.notar} makler={v.makler} />
      </Card>

      <Card className="bg-white rounded-km p-6">
        <SectionTitle>Finanzierung</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {f('ek', 'Eigenkapital (\u20ac)', 'Empfehlung: mind. 20% des Kaufpreises. Nebenkosten sollten idealerweise aus EK gedeckt sein.', 10000)}
          {f('zins', 'Zinssatz (% p. a.)', 'Sollzins. <strong>Aktuell (2025):</strong> ~3,5\u20134,5% f\u00fcr 10J. Zinsbindung. Empfehlung: mind. 10, besser 15 Jahre binden.', 0.1)}
          {f('tilg', 'Anf\u00e4ngliche Tilgung (%)', 'Bei 2% + 3,8% Zins: Laufzeit ~28\u201330 Jahre. Bei 1%: \u00fcber 40 Jahre. Empfehlung: mind. 2%.', 0.5)}
          {f('verw', 'Laufende Kosten (\u20ac/Monat)', mode === 'eigen'
            ? 'Hausgeld, Grundsteuer, Versicherung. <strong>Typisch ETW: 150\u2013350 \u20ac/Mo.</strong>'
            : 'Hausverwaltung, Grundsteuer, Versicherung. Steuerlich absetzbar. <strong>Typisch: 150\u2013400 \u20ac/Mo.</strong>', 50)}
          {f('ih', 'Instandhaltung (% p. a.)', 'R\u00fccklage f\u00fcr Reparaturen. <strong>Faustregel:</strong> 1\u20131,5% des Kaufpreises. Neubau ~0,5\u20131%, Altbau 1,5\u20132%. Steigt mit Inflationsrate.', 0.25)}
        </div>
      </Card>

      {mode === 'eigen' ? (
        <Card className="bg-white rounded-km p-6">
          <SectionTitle>Wenn du mietest statt kaufst</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
            {f('miete', 'Vergleichsmiete (\u20ac/Monat)', 'Kaltmiete f\u00fcr eine vergleichbare Wohnung. Nur Kaltanteil \u2014 Betriebskosten fallen bei Kauf und Miete \u00e4hnlich an.', 50)}
            {f('ms', 'Mietsteigerung (% p. a.)', 'J\u00e4hrliche Steigerung der Miete. <strong>Bundesweit:</strong> ~2\u20133%. <strong>Ballungszentren:</strong> 3\u20135%.', 0.5)}
            {f('xspar', 'Zus\u00e4tzliche Sparrate (\u20ac/Monat)', 'Optionaler Betrag \u00fcber die automatisch berechnete Kostendifferenz hinaus.', 50)}
          </div>
        </Card>
      ) : (
        <Card className="bg-white rounded-km p-6">
          <SectionTitle>Wenn du kaufst und vermietest</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
            {f('mietein', 'Mieteinnahmen (\u20ac/Monat)', 'Monatliche Nettokaltmiete als Vermieterin. Orientiere dich am \u00f6rtlichen Mietspiegel.', 50)}
            {f('ms2', 'Mietsteigerung (% p. a.)', 'J\u00e4hrliche Erh\u00f6hung der Mieteinnahmen. Bestandsmietvertr\u00e4ge: max. +20% in 3 Jahren.', 0.5)}
            {f('leer', 'Leerstandsquote (%)', 'Anteil der Zeit ohne Mieteinnahmen. <strong>Gro\u00dfst\u00e4dte:</strong> 1\u20132%. <strong>Bundesweit:</strong> 2\u20135%.', 0.5)}
            {f('grenz', 'Grenzsteuersatz (%)', 'Pers\u00f6nlicher Einkommensteuersatz auf Mieteinnahmen (nicht KESt). Absetzbar: Zinsen, AfA, Instandhaltung, Verwaltung.', 1)}
            {f('afa', 'AfA-Satz (% p. a.)', 'Steuerliche Abschreibung des Geb\u00e4udewerts.<br><strong>Bestand (vor 2023):</strong> 2% p. a.<br><strong>Neubau (ab 2023):</strong> 3% p. a.', 0.5)}
          </div>
        </Card>
      )}

      <Card className="bg-white rounded-km p-6">
        <SectionTitle>Rahmenbedingungen</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">
          {f('infl', 'Inflation (% p. a.)', 'Allgemeine Preissteigerungsrate \u2014 bestimmt, wie schnell Instandhaltungskosten steigen. <strong>Historisch DE:</strong> ~2\u20133%, EZB-Ziel: 2%.', 0.1)}
          {f('rend', 'Depot-Rendite (% p. a.)', 'Erwartete j\u00e4hrliche Rendite des ETF-Depots. <strong>MSCI World:</strong> historisch ~7\u20138% brutto, nach Kosten konservativ 5\u20137%. Anleihen/Tagesgeld: 2\u20134%.', 0.5)}
          {f('kest', 'KESt auf Depot-Gewinne (%)', 'Effektiver Steuersatz auf ETF-Gewinne beim Verkauf.<br><strong>Aktien-ETF:</strong> 25% \u00d7 0,7 Teilfreistellung \u00d7 1,055 Soli = 18,46%<br><strong>Anleihen/Geldmarkt:</strong> 26,375%', 0.5)}
        </div>
      </Card>
    </div>
  );
}
