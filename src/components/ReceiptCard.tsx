'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Stage, MAX_STRESS_INTENSITY, TOTAL_INTENSITY_LEVELS } from '@/lib/theme';

interface ReceiptCardProps {
  stage: Stage;
  triggerLabel: string;
  stressLevel: number;
  subgenre?: string | null;
}

const RECEIPT_WIDTH = 300;
const RECEIPT_HEIGHT = 382;
const STUDY_QR_SIZE = 66;
// Permanent citation — always the same URL, not tied to the session's
// emotion/subgenre, since it's the real source for the "vitutus" scale
// used throughout the app (see STAGES in lib/theme.ts). The receipt's
// only QR code.
const VITUTUS_STUDY_URL = 'https://emotion.utu.fi/wp-content/uploads/2022/04/LN_JH_Vitutus_22.pdf';

function formatDateTime(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ReceiptCard({ stage, triggerLabel, stressLevel, subgenre }: ReceiptCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { date, time } = formatDateTime();

  const itemLabel = triggerLabel.toUpperCase();
  // Plain numeric intensity, not a thematic tier name — one unambiguous
  // scale, always out of 10 except the deliberately scale-breaking ELEVEN
  // tier, which reads "11/10" on purpose (see IntensitySlider).
  const tierLabel = `${stressLevel === MAX_STRESS_INTENSITY ? TOTAL_INTENSITY_LEVELS : stressLevel + 1}/${MAX_STRESS_INTENSITY}`;
  const genreLine = subgenre ? subgenre.toUpperCase() : null;

  // Fixed citation QR — same URL every receipt, generated once.
  const [studyQrDataUrl, setStudyQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(VITUTUS_STUDY_URL, { margin: 0, width: STUDY_QR_SIZE * 4, color: { dark: '#2a2a28', light: '#00000000' } })
      .then(setStudyQrDataUrl)
      .catch(() => setStudyQrDataUrl(null));
  }, []);

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
        a.download = `sonic-catharsis-receipt-stage-${stage.roman.toLowerCase()}.png`;
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
    <div className="flex flex-col items-center gap-3.5 w-full">
      {/* Wrapper caps the receipt at its natural size on wide screens but
          lets it shrink on any viewport narrower than RECEIPT_WIDTH + the
          page gutters — the SVG itself scales via width/height set to
          100%/auto against its viewBox, so nothing here can force
          horizontal overflow. */}
      <svg
        ref={svgRef}
        width="100%"
        height="auto"
        viewBox={`0 0 ${RECEIPT_WIDTH} ${RECEIPT_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[300px] min-w-0"
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
            RECEIPT
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

          <text x="18" y="130" fontSize="10">1x STAGE {stage.roman} — {stage.name.toUpperCase()}</text>

          <line x1="18" y1="146" x2={RECEIPT_WIDTH - 18} y2="146" stroke="#2a2a28" strokeWidth="1" strokeDasharray="2 2" />

          <text x={RECEIPT_WIDTH / 2} y="172" textAnchor="middle" fontSize="9">
            THANK YOU FOR PROCESSING YOUR VITUTUS AT
          </text>
          <text x={RECEIPT_WIDTH / 2} y="184" textAnchor="middle" fontSize="9" fontWeight="bold">
            SONIC CATHARSIS
          </text>
          <text x={RECEIPT_WIDTH / 2} y="202" textAnchor="middle" fontSize="8" fill="#6b6b66">
            NO REFUNDS. NO REMORSE.
          </text>
          <text x={RECEIPT_WIDTH / 2} y="214" textAnchor="middle" fontSize="8" fill="#6b6b66">
            SCIENTIFICALLY PROVEN TO FUNCTION.
          </text>

          {/* Permanent citation — the real (tongue-in-cheek) academic source
              for the "vitutus" scale used throughout the app. Same QR/URL
              on every receipt, regardless of session. */}
          <text x={RECEIPT_WIDTH / 2} y="240" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6b6b66" letterSpacing="1">
            THE VITUTUS STUDY
          </text>
          {studyQrDataUrl && (
            <image
              href={studyQrDataUrl}
              x={(RECEIPT_WIDTH - STUDY_QR_SIZE) / 2}
              y="250"
              width={STUDY_QR_SIZE}
              height={STUDY_QR_SIZE}
            />
          )}
          <text x={RECEIPT_WIDTH / 2} y={250 + STUDY_QR_SIZE + 16} textAnchor="middle" fontSize="8" letterSpacing="1">
            SCAN TO READ THE SOURCE
          </text>
          <text x={RECEIPT_WIDTH / 2} y={250 + STUDY_QR_SIZE + 30} textAnchor="middle" fontSize="7.5" fill="#6b6b66" letterSpacing="0.5">
            UNIVERSITY OF TURKU · 2022
          </text>
        </g>
      </svg>

      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
        style={{ letterSpacing: '0.05em', color: '#5c584f' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
      >
        <Download className="h-3.5 w-3.5" />
        Download Receipt
      </button>
    </div>
  );
}
