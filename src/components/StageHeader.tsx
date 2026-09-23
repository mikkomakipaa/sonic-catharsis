import { cn } from '@/lib/utils';
import { Stage } from '@/lib/theme';

interface StageHeaderProps {
  stage: Stage;
  align?: 'center' | 'left';
}

export default function StageHeader({ stage, align = 'center' }: StageHeaderProps) {
  return (
    <div
      className={cn('flex items-baseline gap-4 max-[480px]:gap-2.5', align === 'left' ? 'justify-start' : 'justify-center')}
    >
      <span className="font-mono text-[44px] max-[480px]:text-[36px] leading-none" style={{ color: stage.color, textShadow: `0 0 18px ${stage.color}55` }}>
        {stage.roman}
      </span>
      <h2 className="text-3xl max-[480px]:text-2xl uppercase tracking-widest font-bold leading-none" style={{ color: stage.color }}>
        {stage.name}
      </h2>
    </div>
  );
}
