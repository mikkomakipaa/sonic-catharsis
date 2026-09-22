import { cn } from '@/lib/utils';
import { Stage } from '@/lib/theme';

interface StageHeaderProps {
  stage: Stage;
  align?: 'center' | 'left';
}

export default function StageHeader({ stage, align = 'center' }: StageHeaderProps) {
  return (
    <div
      className={cn('flex items-baseline gap-4', align === 'left' ? 'justify-start' : 'justify-center')}
    >
      <span className="font-mono text-[44px] leading-none" style={{ color: stage.color, textShadow: `0 0 18px ${stage.color}55` }}>
        {stage.roman}
      </span>
      <h2 className="text-3xl uppercase tracking-widest font-bold leading-none" style={{ color: stage.color }}>
        {stage.name}
      </h2>
    </div>
  );
}
