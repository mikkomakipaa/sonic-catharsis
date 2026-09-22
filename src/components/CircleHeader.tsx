import { cn } from '@/lib/utils';
import { Circle } from '@/lib/theme';

interface CircleHeaderProps {
  circle: Circle;
  align?: 'center' | 'left';
}

export default function CircleHeader({ circle, align = 'center' }: CircleHeaderProps) {
  return (
    <div
      className={cn('flex items-baseline gap-4', align === 'left' ? 'justify-start' : 'justify-center')}
    >
      <span className="font-mono text-[44px] leading-none" style={{ color: circle.color, textShadow: `0 0 18px ${circle.color}55` }}>
        {circle.roman}
      </span>
      <h2 className="text-3xl uppercase tracking-widest font-bold leading-none" style={{ color: circle.color }}>
        {circle.name}
      </h2>
    </div>
  );
}
