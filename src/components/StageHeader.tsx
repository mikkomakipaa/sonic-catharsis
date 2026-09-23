import { cn } from '@/lib/utils';
import { Stage } from '@/lib/theme';

interface StageHeaderProps {
  stage: Stage;
  align?: 'center' | 'left';
}

export default function StageHeader({ stage, align = 'center' }: StageHeaderProps) {
  return (
    <div
      className={cn(
        // Slightly smaller and tighter than before, and deliberately close
        // to the rail below it (see the reduced gap in ScreenAnalysis.tsx/
        // ScreenDescent.tsx) — this reads as one combined "diagnosis +
        // scale" unit now rather than a big hero header competing with the
        // prescription card underneath it.
        'flex items-baseline gap-3 max-[480px]:flex-col max-[480px]:gap-0',
        align === 'left' ? 'justify-start max-[480px]:items-start' : 'justify-center max-[480px]:items-center'
      )}
    >
      <span className="font-mono text-[36px] max-[480px]:text-[44px] leading-none" style={{ color: stage.color, textShadow: `0 0 18px ${stage.color}55` }}>
        {stage.roman}
      </span>
      <h2 className="text-2xl max-[480px]:text-[26px] uppercase tracking-widest max-[480px]:tracking-wide font-bold leading-none max-[480px]:leading-tight" style={{ color: stage.color }}>
        {stage.name}
      </h2>
    </div>
  );
}
