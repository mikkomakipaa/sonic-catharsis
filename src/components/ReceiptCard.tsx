'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Circle, TOTAL_INTENSITY_LEVELS } from '@/lib/theme';
import { EmotionType } from '@/types';

interface ReceiptCardProps {
  circle: Circle;
  emotion: EmotionType;
  stressLevel: number;
  damageScore: number;
  subgenre?: string | null;
}

const RECEIPT_WIDTH = 300;
const RECEIPT_HEIGHT = 432;
const QR_SIZE = 66;

function formatDateTime(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ReceiptCard({ circle, emotion, stressLevel, damageScore, subgenre }: ReceiptCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { date, time } = formatDateTime();

  const itemLabel = emotion.toUpperCase();
  // Plain 1-11 intensity, not a thematic tier name — one unambiguous scale.
  const tierLabel = `${stressLevel + 1}/${TOTAL_INTENSITY_LEVELS}`;
  const genreLine = subgenre ? subgenre.toUpperCase() : null;

  // Never a fabricated single video — a YouTube search for the actual
  // curated subgenre always resolves to something real.
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    const query = subgenre || `${emotion} metal`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    QRCode.toDataURL(searchUrl, { margin: 0, width: QR_SIZE * 4, color: { dark: '#2a2a28', light: '#00000000' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [subgenre, emotion]);

  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = RECEIPT_WIDTH * scale;
      canvas.height = RECEIPT_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `sonic-catharsis-receipt-${damageScore}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = url;
  };

  // Jagged bottom edge — a classic torn-receipt zigzag, generated as a
  // single polyline so it stays crisp when rasterized.
  const zigzagPoints = (() => {
    const teeth = 14;
    const step = RECEIPT_WIDTH / teeth;
    const points: string[] = [];
    for (let i = 0; i <= teeth; i++) {
      const x = i * step;
      const y = i % 2 === 0 ? 0 : 10;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  })();

  return (
    <div className="flex flex-col items-center gap-3.5">
      <svg
        ref={svgRef}
        width={RECEIPT_WIDTH}
        height={RECEIPT_HEIGHT}
        viewBox={`0 0 ${RECEIPT_WIDTH} ${RECEIPT_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
      >
        <rect x="0" y="0" width={RECEIPT_WIDTH} height={RECEIPT_HEIGHT - 10} fill="#e8e4d8" />
        <polygon
          points={`0,${RECEIPT_HEIGHT - 10} ${zigzagPoints
            .split(' ')
            .map((p) => {
              const [x, y] = p.split(',').map(Number);
              return `${x},${RECEIPT_HEIGHT - 10 + y}`;
            })
            .join(' ')} ${RECEIPT_WIDTH},${RECEIPT_HEIGHT - 10}`}
          fill="#e8e4d8"
        />

        <g fontFamily="'Courier New', monospace" fill="#2a2a28">
          <text x={RECEIPT_WIDTH / 2} y="30" textAnchor="middle" fontSize="15" fontWeight="bold" letterSpacing="1">
            SONIC CATHARSIS
          </text>

          <line x1="18" y1="44" x2={RECEIPT_WIDTH - 18} y2="44" stroke="#2a2a28" strokeWidth="1" strokeDasharray="2 2" />

          <text x="18" y="60" fontSize="9">DATE: {date}</text>
          <text x={RECEIPT_WIDTH - 18} y="60" textAnchor="end" fontSize="9">TIME: {time}</text>

          <line x1="18" y1="72" x2={RECEIPT_WIDTH - 18} y2="72" stroke="#2a2a28" strokeWidth="1" strokeDasharray="2 2" />

          <text x="18" y="94" fontSize="10">1x {itemLabel}</text>
          <text x={RECEIPT_WIDTH - 18} y="94" textAnchor="end" fontSize="10">{tierLabel}</text>

          {genreLine && (
            <>
              <text x="18" y="112" fontSize="10">1x {genreLine}</text>
              <text x={RECEIPT_WIDTH - 18} y="112" textAnchor="end" fontSize="10">N/A</text>
            </>
          )}

          <text x="18" y="130" fontSize="10">1x CIRCLE {circle.roman} — {circle.name.toUpperCase()}</text>

          <line x1="18" y1="146" x2={RECEIPT_WIDTH - 18} y2="146" stroke="#2a2a28" strokeWidth="1" strokeDasharray="2 2" />

          <text x="18" y="168" fontSize="12" fontWeight="bold">EMOTIONAL DAMAGE</text>
          <text x={RECEIPT_WIDTH - 18} y="168" textAnchor="end" fontSize="12" fontWeight="bold">
            {damageScore}/1000
          </text>

          <line x1="18" y1="184" x2={RECEIPT_WIDTH - 18} y2="184" stroke="#2a2a28" strokeWidth="1" strokeDasharray="2 2" />

          <text x={RECEIPT_WIDTH / 2} y="210" textAnchor="middle" fontSize="9">
            THANK YOU FOR SHOPPING AT
          </text>
          <text x={RECEIPT_WIDTH / 2} y="222" textAnchor="middle" fontSize="9" fontWeight="bold">
            SONIC CATHARSIS
          </text>
          <text x={RECEIPT_WIDTH / 2} y="240" textAnchor="middle" fontSize="8" fill="#6b6b66">
            NO REFUNDS. NO REMORSE.
          </text>
          <text x={RECEIPT_WIDTH / 2} y="252" textAnchor="middle" fontSize="8" fill="#6b6b66">
            SCIENTIFICALLY PROVEN TO FUNCTION.
          </text>

          {/* QR — scan for a YouTube search of the actual curated subgenre */}
          {qrDataUrl && (
            <image href={qrDataUrl} x={(RECEIPT_WIDTH - QR_SIZE) / 2} y="270" width={QR_SIZE} height={QR_SIZE} />
          )}
          <text x={RECEIPT_WIDTH / 2} y="352" textAnchor="middle" fontSize="8" letterSpacing="1">
            SCAN FOR YOUR PRESCRIBED SOUND
          </text>
        </g>
      </svg>

      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
        style={{ letterSpacing: '0.05em', color: '#a6a297' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
      >
        <Download className="h-3.5 w-3.5" />
        Download Receipt
      </button>
    </div>
  );
}
