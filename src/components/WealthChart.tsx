import { Card } from '@mmp/shared-ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ChartData } from '../utils/kaufen-mieten';

const fmt = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' \u20ac';
const fmtAxis = (v: number) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + ' Mio' : (v / 1e3).toFixed(0) + ' T') + ' \u20ac';

interface WealthChartProps {
  data: ChartData[];
  breakeven: number | null;
  labelA: string;
  labelB: string;
  explain: string;
}

export default function WealthChart({ data, breakeven, labelA, labelB, explain }: WealthChartProps) {
  return (
    <Card className="bg-white rounded-km p-6 md:p-8">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="font-serif text-base font-semibold text-black">Vermögensentwicklung — 30 Jahre</div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-km-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-km-uv" />{labelA}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-km-muted">
            <span className="w-[18px] h-0.5 bg-km-lav" />{labelB}
          </div>
          {breakeven !== null && (
            <div className="flex items-center gap-1.5 text-xs text-km-muted">
              <span className="w-[18px] h-0.5 bg-km-apr" />Break-Even
            </div>
          )}
        </div>
      </div>

      <div
        className="text-xs text-km-muted leading-relaxed mb-4 p-3 bg-km-ice rounded-xl [&_strong]:text-black [&_strong]:font-medium"
        dangerouslySetInnerHTML={{ __html: explain }}
      />

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="year"
              tickFormatter={v => `Jahr ${v}`}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              stroke="rgba(174,180,244,.2)"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={fmtAxis}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              stroke="rgba(174,180,244,.2)"
              width={70}
            />
            <Tooltip
              contentStyle={{ background: '#000', borderRadius: 10, border: 'none', padding: 12 }}
              labelStyle={{ color: '#AEB4F4' }}
              itemStyle={{ color: '#fff' }}
              formatter={(v, name) => [fmt(v as number), name as string]}
              labelFormatter={l => `Jahr ${l}`}
            />
            {breakeven !== null && (
              <ReferenceLine x={breakeven} stroke="#FFC163" strokeDasharray="4 4" strokeWidth={2} />
            )}
            <Line
              type="monotone"
              dataKey="kaeufer"
              name={labelA}
              stroke="#6100FF"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="mieter"
              name={labelB}
              stroke="#AEB4F4"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
