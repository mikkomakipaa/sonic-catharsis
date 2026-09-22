import { cn } from '@/lib/utils';

interface RiteHeaderProps {
  onGoHome?: () => void;
  showHeadline?: boolean;
}

// Reframed masthead: a quiet kicker (the wordmark/"go home" control) above
// the actual hero statement, in the new calm palette — replacing the
// blackletter blood-red logo treatment. The hero statement itself only
// belongs to the selection screen — later screens (analysis, descent) keep
// just the kicker as a quiet nav element, not the "how are you feeling"
// question that's already been answered.
export default function RiteHeader({ onGoHome, showHeadline = true }: RiteHeaderProps) {
  return (
    <header className={cn('text-center', showHeadline ? 'mb-6' : 'mb-4')}>
      <button
        type="button"
        onClick={onGoHome}
        disabled={!onGoHome}
        aria-label="Sonic Catharsis — back to start"
        className="uppercase transition-opacity duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"
        style={{
          fontFamily: 'var(--font-plex-sans, sans-serif)',
          fontSize: 11,
          letterSpacing: '0.18em',
          color: '#a6a297',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: onGoHome ? 'pointer' : 'default',
        }}
        onMouseEnter={(e) => onGoHome && (e.currentTarget.style.color = '#726f66')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
      >
        Sonic Catharsis
      </button>

      {showHeadline && (
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-fraunces, serif)',
            fontWeight: 500,
            fontSize: 'clamp(26px, 5vw, 34px)',
            lineHeight: 1.25,
            color: '#2f2e2b',
            maxWidth: '22ch',
            margin: '12px auto 0',
          }}
        >
          How are you feeling today?
        </h1>
      )}

      <div className="h-px w-16 mx-auto mt-4" style={{ background: '#e6e2d8' }} />
    </header>
  );
}
