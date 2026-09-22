interface RiteHeaderProps {
  onGoHome?: () => void;
}

export default function RiteHeader({ onGoHome }: RiteHeaderProps) {
  return (
    <header className="text-center mb-6">
      <h1>
        <button
          type="button"
          onClick={onGoHome}
          disabled={!onGoHome}
          aria-label="Sonic Catharsis — back to start"
          className="text-6xl font-normal tracking-wide leading-tight text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-500 to-red-700 transition-opacity duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60 focus-visible:outline-offset-4"
          style={{
            letterSpacing: '0.04em',
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 24px rgba(239, 68, 68, 0.5)',
            fontFamily: 'var(--font-shadow-prayer), system-ui, sans-serif',
            fontWeight: 400,
            lineHeight: '1.2',
            cursor: onGoHome ? 'pointer' : 'default',
          }}
          onMouseEnter={(e) => onGoHome && (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          SONIC CATHARSIS
        </button>
      </h1>
      <div className="h-0.5 w-32 mx-auto mt-4 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />
    </header>
  );
}
