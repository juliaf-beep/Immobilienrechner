// ── Types ──────────────────────────────────────────────────────────────────
export type Mode = 'eigen' | 'kapital';

export interface SharedInputs {
  infl: number; rend: number; kest: number;
  kp: number; mod: number; ws: number;
  gest: number; notar: number; makl: number;
  ek: number; zins: number; tilg: number;
  verw: number; ih: number;
}

export interface EigenInputs {
  miete: number; ms: number; xSpar: number;
}

export interface KapitalInputs {
  mietein: number; ms2: number; leer: number; grenz: number; afa: number;
}

export interface Nebenkosten {
  gest: number; notar: number; makl: number; total: number;
}

export interface Metric {
  label: string; value: string; sub?: string; positive?: boolean;
}

export interface Insight {
  title: string; text: string;
}

export interface ChartData {
  year: number; kaeufer: number; mieter: number;
}

export interface EigenResult {
  metrics: Metric[];
  insights: Insight[];
  chartData: ChartData[];
  breakeven: number | null;
  headline: string;
  subtitle: string;
  win: boolean;
  chartExplain: string;
}

export interface RenditeKennzahlen {
  nettoRendite: number;
  ekRendite: number | null;
  cashflowMonat: number;
  jahresmiete: number;
  kostenJ: number;
  nmt: number;
  gesamtinvest: number;
  zinsenJ: number;
  reinertrag: number;
  leverageText: string;
  leverageType: 'pos' | 'neg' | 'neutral';
}

export interface KapitalResult {
  metrics: Metric[];
  insights: Insight[];
  chartData: ChartData[];
  breakeven: number | null;
  headline: string;
  subtitle: string;
  win: boolean;
  chartExplain: string;
  rendite: RenditeKennzahlen;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const N = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(n));
const E = (n: number) => N(n) + ' \u20ac';

export function calcNebenkosten(s: SharedInputs): Nebenkosten {
  const gv = s.kp * s.gest, nv = s.kp * s.notar, mv = s.kp * s.makl;
  return { gest: gv, notar: nv, makl: mv, total: gv + nv + mv };
}

// ── FALL 1: Selbst einziehen vs. Mieten ────────────────────────────────────
export function calcEigen(s: SharedInputs, e: EigenInputs): EigenResult | null {
  if (!s.kp || !e.miete) return null;

  const nk = calcNebenkosten(s).total;
  const darl = s.kp + s.mod + nk - s.ek;
  if (darl <= 0) return null;

  const ann = darl * (s.zins + s.tilg) / 12;
  const mr = s.zins / 12;
  const initIH = s.kp * s.ih / 12;
  const initKosten = ann + s.verw + initIH;
  const initSpar = Math.max(0, initKosten - e.miete) + e.xSpar;
  const initZinsM = darl * s.zins / 12;
  const initTilgM = ann - initZinsM;

  // Simulation
  const Y = 30;
  const chartData: ChartData[] = [];
  let rs = darl, immo = s.kp, depot = s.ek, inv = s.ek, rent = e.miete, ih = initIH;

  for (let y = 0; y <= Y; y++) {
    const kVal = Math.round(immo - rs);
    const gains = Math.max(0, depot - inv);
    const mVal = Math.round(depot - gains * s.kest);
    chartData.push({ year: y, kaeufer: kVal, mieter: mVal });
    if (y < Y) {
      // Nach Kreditende fällt die Annuität weg
      const annYear = rs > 0 ? ann : 0;
      const spar = Math.max(0, annYear + s.verw + ih - rent) + e.xSpar;
      inv += spar * 12;
      for (let m = 0; m < 12; m++) { if (rs <= 0) break; rs = Math.max(0, rs - (ann - rs * mr)); }
      immo *= (1 + s.ws); depot = depot * (1 + s.rend) + spar * 12; rent *= (1 + e.ms); ih *= (1 + s.infl);
    }
  }

  let be: number | null = null;
  for (let y = 1; y <= Y; y++) {
    if (chartData[y].kaeufer >= chartData[y].mieter && (y === 1 || chartData[y - 1].kaeufer < chartData[y - 1].mieter)) {
      be = y; break;
    }
  }

  let headline: string, subtitle: string, win: boolean;
  if (be) {
    headline = `Kauf lohnt sich ab Jahr ${be}`;
    subtitle = 'Ab dann \u00fcbersteigt das K\u00e4uferinnenverm\u00f6gen das ETF-Depot.';
    win = true;
  } else if (chartData[Y].kaeufer >= chartData[Y].mieter) {
    headline = 'Kauf lohnt sich langfristig';
    subtitle = 'Kein klarer Kreuzungspunkt \u2014 K\u00e4uferin liegt nach 30 Jahren vorne.';
    win = true;
  } else {
    headline = 'Mieten + Investieren ist besser';
    subtitle = 'Mit diesen Annahmen liegt die Mieterin nach 30 Jahren vorne.';
    win = false;
  }

  const oppK = s.ek * s.rend;
  const diff30 = Math.abs(chartData[Y].kaeufer - chartData[Y].mieter);
  const win30 = chartData[Y].kaeufer >= chartData[Y].mieter ? 'K\u00e4uferin' : 'Mieterin';

  const metrics: Metric[] = [
    { label: 'Monatliche Annuit\u00e4t', value: E(ann), sub: `Zins ${E(initZinsM)} + Tilgung ${E(initTilgM)}` },
    { label: 'Gesamtkosten/Mo.', value: E(initKosten), sub: initKosten > e.miete ? `${E(initKosten - e.miete)} mehr als Miete` : `${E(e.miete - initKosten)} weniger als Miete` },
    { label: 'Sparrate (wenn Miete)', value: `${E(initSpar)}/Mo.`, sub: 'geht ins ETF-Depot der Mieterin', positive: initSpar > 0 },
    { label: 'Mietmultiplikator', value: `${(s.kp / (e.miete * 12)).toFixed(1)}x`, sub: 'Kaufpreis \u00f7 Jahreskaltmiete' },
  ];

  const insights: Insight[] = [
    {
      title: 'Dein Startpunkt: Warum die K\u00e4uferin nicht mit vollem EK startet',
      text: `Du bringst <strong>${E(s.ek)}</strong> EK mit \u2014 davon verschwinden sofort <strong>${E(nk)}</strong> als Kaufnebenkosten (nicht r\u00fcckholbar). Dein Eigenkapital in der Immobilie betr\u00e4gt in Jahr 0 nur <strong>${E(chartData[0].kaeufer)}</strong>. Die Mieterin beh\u00e4lt das volle EK im Depot.`,
    },
    {
      title: 'Opportunit\u00e4tskosten: Was dein EK im Depot verdienen w\u00fcrde',
      text: `Dein EK von <strong>${E(s.ek)}</strong> steckt in der Immobilie \u2014 es kann nicht gleichzeitig im ETF wachsen. Entgangene Rendite im ersten Jahr: ca. <strong>${E(oppK)}</strong> (${(s.rend * 100).toFixed(1)}% p.a.). Das ist der unsichtbare Preis des Kaufens.`,
    },
    {
      title: initKosten > e.miete ? 'Monatliche Mehrbelastung: Der Startvorteil der Mieterin' : 'Monatliche Ersparnis: Kauf g\u00fcnstiger als Mieten',
      text: initKosten > e.miete
        ? `Deine Kaufkosten (<strong>${E(initKosten)}/Mo.</strong>) liegen <em>${E(initKosten - e.miete)}/Mo.</em> \u00fcber der Miete. Genau diese Differenz investiert die Mieterin monatlich ins Depot \u2014 das ist ihr anf\u00e4nglicher Vorteil.`
        : `Deine Kaufkosten (<strong>${E(initKosten)}/Mo.</strong>) liegen <em>${E(e.miete - initKosten)}/Mo.</em> unter der Miete \u2014 das beg\u00fcnstigt den Kauf stark.`,
    },
    {
      title: be ? `Ab Jahr ${be}: Warum die Immobilie dann vorne liegt` : 'Warum das Depot nach 30 Jahren vorne liegt',
      text: be
        ? `Tilgung und Wertsteigerung (<strong>${(s.ws * 100).toFixed(1)}% p.a.</strong>) lassen das Eigenkapital wachsen. Ab Jahr ${be} \u00fcbersteigt es das Depot. <strong>Wichtig:</strong> Du musst mindestens ${be} Jahre bleiben, damit sich der Kauf lohnt.`
        : `Zinseszins bei <strong>${(s.rend * 100).toFixed(1)}% p.a.</strong> auf das volle EK plus monatliche Einzahlungen schl\u00e4gt den Kauf. Nach 30 Jahren liegt die <strong>${win30}</strong> mit <em>${E(diff30)}</em> vorne.`,
    },
  ];

  const chartExplain = `<strong>K\u00e4uferin (violett):</strong> Immobilienwert minus Restschuld \u2014 ihr Netto-Eigenkapital. Startet bei <strong>${E(chartData[0].kaeufer)}</strong> (EK minus ${E(nk)} Nebenkosten). | <strong>Mieterin (gestrichelt):</strong> ETF-Depot nach KESt \u2014 startet mit dem vollen EK und investiert die Kostendifferenz monatlich (anf\u00e4ngs ${E(initSpar)}/Mo.).`
    + (be ? ` <strong>Kreuzungspunkt: Jahr ${be}.</strong>` : '');

  return { metrics, insights, chartData, breakeven: be, headline, subtitle, win, chartExplain };
}

// ── FALL 2: Vermieten vs. ETF-Depot ────────────────────────────────────────
export function calcKapital(s: SharedInputs, k: KapitalInputs): KapitalResult | null {
  if (!s.kp || !k.mietein) return null;

  const nk = calcNebenkosten(s).total;
  const darl = s.kp + s.mod + nk - s.ek;
  if (darl <= 0) return null;

  const ann = darl * (s.zins + s.tilg) / 12;
  const mr = s.zins / 12;
  const initIH = s.kp * s.ih / 12;
  const initZinsM = darl * s.zins / 12;
  const initTilgM = ann - initZinsM;

  const initGross = k.mietein * 12 * (1 - k.leer);
  const initZinsJ = darl * s.zins;
  const initAfaJ = s.kp * k.afa;
  const initCostsJ = (s.verw + initIH) * 12;
  const initTaxSave = (initZinsJ + initAfaJ + initCostsJ) * k.grenz;
  // Verluste aus V&V gegen anderes Einkommen verrechenbar (negativer Wert = Steuerersparnis)
  const initTax = (initGross - initZinsJ - initAfaJ - initCostsJ) * k.grenz;
  const initNetInc = initGross - initTax;
  const initPocketM = (ann * 12 + initCostsJ - initNetInc) / 12;
  const initRentalM = -initPocketM;

  // Rendite-Kennzahlen
  const gesamtinvest = s.kp + s.mod + nk;
  const jahresmiete = k.mietein * 12 * (1 - k.leer);
  const kostenJ = initCostsJ;
  const nmt = jahresmiete - kostenJ;
  const nettoR = nmt / gesamtinvest * 100;
  const zinsenJ = darl * s.zins;
  const reinertrag = nmt - zinsenJ;
  const ekrVal = s.ek > 0 ? reinertrag / s.ek * 100 : null;
  const cfM = k.mietein * (1 - k.leer) - (s.verw + initIH) - ann;

  const zinsR = s.zins * 100;
  let leverageText: string;
  let leverageType: 'pos' | 'neg' | 'neutral';
  if (s.ek === 0) {
    leverageType = 'neutral';
    leverageText = `<strong>Kein Eigenkapital:</strong> EKR nicht berechenbar (Division durch 0). Bei Vollfinanzierung ist die EKR theoretisch unendlich \u2014 in der Praxis kaum umsetzbar.`;
  } else if (ekrVal !== null && Math.abs(ekrVal) > 999) {
    leverageType = 'neutral';
    leverageText = `<strong>EK zu gering f\u00fcr aussagekr\u00e4ftige EKR:</strong> Bei sehr kleinem Eigenkapital (hier ${E(s.ek)}) wird die EKR-Zahl mathematisch extrem. Empfehlung: mind. 10\u201320% EK einsetzen.`;
  } else if (nettoR > zinsR + 0.2) {
    leverageType = 'pos';
    leverageText = `<strong>Positiver Hebeleffekt:</strong> Deine Netto-Mietrendite (${nettoR.toFixed(1)}%) liegt \u00fcber dem Zinssatz (${zinsR.toFixed(1)}%). Das Fremdkapital arbeitet f\u00fcr dich \u2014 deine EKR (${ekrVal?.toFixed(1)}%) ist dadurch h\u00f6her als die Mietrendite.`;
  } else if (nettoR < zinsR - 0.2) {
    leverageType = 'neg';
    leverageText = `<strong>Negativer Hebeleffekt:</strong> Deine Netto-Mietrendite (${nettoR.toFixed(1)}%) liegt unter dem Zinssatz (${zinsR.toFixed(1)}%). Jeder Euro Fremdkapital verschlechtert die EKR (${ekrVal?.toFixed(1)}%). Weniger Kredit, mehr EK w\u00e4re besser.`;
  } else {
    leverageType = 'neutral';
    leverageText = `<strong>Neutraler Hebeleffekt:</strong> Mietrendite (${nettoR.toFixed(1)}%) und Zinssatz (${zinsR.toFixed(1)}%) sind nahezu gleich \u2014 Fremdkapital hat kaum Einfluss auf die EKR.`;
  }

  const rendite: RenditeKennzahlen = {
    nettoRendite: nettoR, ekRendite: ekrVal, cashflowMonat: cfM,
    jahresmiete, kostenJ, nmt, gesamtinvest, zinsenJ, reinertrag,
    leverageText, leverageType,
  };

  // Simulation
  const Y = 30;
  const chartData: ChartData[] = [];
  let rs = darl, immo = s.kp, rent = k.mietein, ih = initIH;
  let surplus = 0, surplusInv = 0, etf = s.ek, etfInv = s.ek;

  for (let y = 0; y <= Y; y++) {
    // Surplus-Gewinne unterliegen KESt (reinvestiert in ETF)
    const surplusGains = Math.max(0, surplus - surplusInv);
    const surplusNet = surplus - surplusGains * s.kest;
    chartData.push({ year: y, kaeufer: Math.round((immo - rs) + surplusNet), mieter: Math.round(etf - Math.max(0, etf - etfInv) * s.kest) });
    if (y < Y) {
      const rsPrev = rs;
      // Tilgung: nur wenn noch Restschuld vorhanden
      const annYear = rsPrev > 0 ? ann * 12 : 0;
      for (let m = 0; m < 12; m++) { if (rs <= 0) break; rs = Math.max(0, rs - (ann - rs * mr)); }
      const gross = rent * 12 * (1 - k.leer);
      const zinsD = rsPrev > 0 ? rsPrev * s.zins : 0;
      const afaD = s.kp * k.afa;
      const costs = (s.verw + ih) * 12;
      // Verluste aus V&V verrechenbar (negativer tax = Steuerersparnis)
      const tax = (gross - zinsD - afaD - costs) * k.grenz;
      const netInc = gross - tax;
      const netCF = netInc - annYear - costs;
      const surplusAdd = Math.max(0, netCF);
      surplus = surplus * (1 + s.rend) + surplusAdd;
      surplusInv += surplusAdd;
      const etfInvest = Math.max(0, -netCF);
      etf = etf * (1 + s.rend) + etfInvest;
      etfInv += etfInvest;
      immo *= (1 + s.ws); rent *= (1 + k.ms2); ih *= (1 + s.infl);
    }
  }

  let be: number | null = null;
  for (let y = 1; y <= Y; y++) {
    if (chartData[y].kaeufer >= chartData[y].mieter && (y === 1 || chartData[y - 1].kaeufer < chartData[y - 1].mieter)) {
      be = y; break;
    }
  }

  let headline: string, subtitle: string, win: boolean;
  if (be) {
    headline = `Immobilie rentabler ab Jahr ${be}`;
    subtitle = 'Ab dann \u00fcbersteigt das Verm\u00f6gen der Vermieterin das ETF-Depot.';
    win = true;
  } else if (chartData[Y].kaeufer >= chartData[Y].mieter) {
    headline = 'Immobilie lohnt sich langfristig';
    subtitle = 'Kein klarer Kreuzungspunkt \u2014 Vermieterin liegt nach 30 Jahren vorne.';
    win = true;
  } else {
    headline = 'ETF-Depot ist rentabler';
    subtitle = 'Mit diesen Annahmen liegt die ETF-Investorin nach 30 Jahren vorne.';
    win = false;
  }

  const leverage = (s.kp / Math.max(s.ek, 1)).toFixed(1);
  const diff30 = Math.abs(chartData[Y].kaeufer - chartData[Y].mieter);
  const win30 = chartData[Y].kaeufer >= chartData[Y].mieter ? 'Vermieterin' : 'ETF-Investorin';

  const metrics: Metric[] = [
    { label: 'Monatliche Annuit\u00e4t', value: E(ann), sub: `Zins ${E(initZinsM)} + Tilgung ${E(initTilgM)}` },
    { label: 'Eigenanteil/Mo.', value: initPocketM > 0 ? E(initPocketM) : '0 \u20ac', sub: initPocketM > 0 ? 'Annuit\u00e4t + Kosten \u2212 Miete (netto)' : 'Immobilie tr\u00e4gt sich selbst' },
    { label: 'Nettomietertrag/Mo.', value: `${initRentalM >= 0 ? '+' : ''}${E(initRentalM)}/Mo.`, sub: initRentalM >= 0 ? 'nach Kosten & Steuern' : 'Kosten \u00fcbersteigen Einnahmen', positive: initRentalM >= 0 },
    { label: 'Mietmultiplikator', value: `${(s.kp / (k.mietein * 12)).toFixed(1)}x`, sub: 'Kaufpreis \u00f7 Jahreskaltmiete' },
  ];

  const etfDesc = initPocketM > 0
    ? `EK als Einmalanlage + monatlich ${E(initPocketM)} Eigenanteil (Annuit\u00e4t + Kosten \u2212 Mieteinnahmen netto)`
    : `nur das EK als Einmalanlage \u2014 Immobilie ist cashflow-positiv`;
  const chartExplain = `<strong>Vermieterin (violett):</strong> Immobilien-EK (Wert \u2212 Restschuld) + reinvestierter Miet\u00fcberschuss. | <strong>ETF-Investorin (gestrichelt):</strong> Investiert ${etfDesc} \u2014 exakt denselben monatlichen Geldeinsatz. Depot w\u00e4chst immer, keine Entnahmen.`
    + (be ? ` <strong>Kreuzungspunkt: Jahr ${be}.</strong>` : '');

  const insights: Insight[] = [
    {
      title: 'So funktioniert der faire Vergleich',
      text: initPocketM > 0
        ? `Beide starten mit <strong>${E(s.ek)}</strong> EK. Die Vermieterin zahlt monatlich <em>${E(initPocketM)}</em> netto aus eigener Tasche (Annuit\u00e4t ${E(ann)} + Kosten ${E(s.verw + initIH)} \u2212 Mieteinnahmen netto ${E(initNetInc / 12)}). Die ETF-Investorin legt diesen Betrag stattdessen ins Depot \u2014 <strong>gleicher Geldeinsatz, verschiedene Strategie</strong>.`
        : `Beide starten mit <strong>${E(s.ek)}</strong> EK. Die Immobilie ist cashflow-positiv \u2014 die Vermieterin zahlt nichts zus\u00e4tzlich und verdient <em>+${E(-initPocketM)}/Mo.</em> netto. Die ETF-Investorin investiert nur ihr EK.`,
    },
    {
      title: `Leverage: Mit ${E(s.ek)} EK ein ${E(s.kp)} Objekt steuern`,
      text: `Der Hebel von <em>${leverage}x</em> ist der strukturelle Vorteil der Immobilie: Wertsteigerung (<strong>${(s.ws * 100).toFixed(1)}% p.a.</strong>) wirkt auf den vollen Kaufpreis. Immobiliengewinne nach 10 Jahren Haltedauer <em>steuerfrei</em> \u2014 das ETF-Depot zahlt ${(s.kest * 100).toFixed(2)}% KESt.`,
    },
    {
      title: 'Steuerlicher Vorteil im 1. Jahr',
      text: `Du kannst <strong>${E(initZinsJ + initAfaJ + initCostsJ)}</strong> absetzen: Zinsen (${E(initZinsJ)}) + AfA (${E(initAfaJ)}) + Kosten (${E(initCostsJ)}). Das spart bei ${(k.grenz * 100).toFixed(0)}% Grenzsteuersatz ca. <em>${E(initTaxSave)}</em> im Jahr.`,
    },
    {
      title: be ? `Warum die Immobilie ab Jahr ${be} gewinnt` : 'Warum das ETF-Depot nach 30 Jahren gewinnt',
      text: be
        ? `Anfangs profitiert die ETF-Investorin vom unbelasteten Zinseszins. Ab Jahr ${be} dreht der Hebel: Tilgung hat Eigenkapital aufgebaut, der Wertzuwachs \u00fcbertrumpft das Depot \u2014 plus Steuerfreiheit des Immobiliengewinns.`
        : `Der Zinseszins bei <strong>${(s.rend * 100).toFixed(1)}% p.a.</strong> schl\u00e4gt den Hebeleffekt. Nach 30 Jahren liegt die <strong>${win30}</strong> mit <em>${E(diff30)}</em> vorne. Tipp: H\u00f6here Mietsteigerung, niedrigerer Zins oder mehr EK k\u00f6nnen das Bild kippen.`,
    },
  ];

  return { metrics, insights, chartData, breakeven: be, headline, subtitle, win, chartExplain, rendite };
}
