import { cn } from '@/lib/utils';

interface RiteHeaderProps {
  onGoHome?: () => void;
  showHeadline?: boolean;
}

// Reframed masthead: just the quiet kicker (the wordmark/"go home" control),
// in the new calm palette — replacing the blackletter blood-red logo
// treatment. No hero question here — the incident text prompt in
// StateOfMindPanel is the page's dominant first interaction (situation-
// first, not emotion-first; see docs/model.md), so this header doesn't
// duplicate or precede it with a framing question of its own. `showHeadline`
// only controls the selection screen's extra breathing room below the
// kicker now, not a second heading.
export default function RiteHeader({ onGoHome, showHeadline = true }: RiteHeaderProps) {
  return (
    <header className={cn('text-center', showHeadline ? 'mb-6' : 'mb-4')}>
      <button
        type="button"
        onClick={onGoHome}
        disabled={!onGoHome}
        aria-label="Sonic Catharsis — back to start"
        className="rite-kicker uppercase transition-opacity duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 text-[11px] max-[480px]:text-[14px] tracking-[0.18em] max-[480px]:tracking-[0.14em]"
        style={{
          fontFamily: 'var(--font-plex-sans, sans-serif)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: onGoHome ? 'pointer' : 'default',
        }}
        onMouseEnter={(e) => onGoHome && (e.currentTarget.style.color = '#726f66')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
      >
        Sonic Catharsis
      </button>

      <div className={cn('h-px w-16 mx-auto', showHeadline ? 'mt-6' : 'mt-4')} style={{ background: '#e6e2d8' }} />
    </header>
  );
}
