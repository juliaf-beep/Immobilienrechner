import { Card } from '@mmp/shared-ui';
import type { Insight } from '../utils/kaufen-mieten';

interface InsightsSectionProps {
  insights: Insight[];
}

export default function InsightsSection({ insights }: InsightsSectionProps) {
  return (
    <Card className="bg-white rounded-km p-6">
      <div className="text-base font-semibold text-black mb-4 flex items-center gap-2.5 font-serif after:content-[''] after:flex-1 after:h-px after:bg-km-lav/50">
        So liest du die Ergebnisse
      </div>
      <div className="divide-y divide-km-lav/25">
        {insights.map((ins, i) => (
          <div key={i} className={`flex gap-3 py-3.5 ${i === 0 ? 'pt-0' : ''} ${i === insights.length - 1 ? 'pb-0' : ''}`}>
            <div className="w-[22px] h-[22px] rounded-full bg-km-uv text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-black mb-0.5">{ins.title}</div>
              <div
                className="text-xs text-km-muted leading-relaxed [&_strong]:text-black [&_strong]:font-medium [&_em]:text-km-uv [&_em]:not-italic [&_em]:font-medium"
                dangerouslySetInnerHTML={{ __html: ins.text }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
