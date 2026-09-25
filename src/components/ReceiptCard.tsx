'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DIVIDER_COLOR, Stage, MAX_STRESS_INTENSITY, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TOTAL_INTENSITY_LEVELS } from '@/lib/theme';

interface ReceiptCardProps {
  stage: Stage;
  triggerLabel: string;
  stressLevel: number;
  subgenre?: string | null;
}

const RECEIPT_WIDTH = 300;
const RECEIPT_HEIGHT = 354;
const STUDY_QR_SIZE = 66;
const VITUTUS_STUDY_URL = 'https://emotion.utu.fi/wp-content/uploads/2022/04/LN_JH_Vitutus_22.pdf';

function formatDateTime(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ReceiptCard({ stage, triggerLabel, stressLevel, subgenre }: ReceiptCardProps) {
  const { date, time } = formatDateTime();
  const itemLabel = triggerLabel.toUpperCase();
  const tierLabel = `${stressLevel === MAX_STRESS_INTENSITY ? TOTAL_INTENSITY_LEVELS : stressLevel + 1}/${MAX_STRESS_INTENSITY}`;
  const genreLine = subgenre ? subgenre.toUpperCase() : null;
  const [studyQrDataUrl, setStudyQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(VITUTUS_STUDY_URL, {
      margin: 0,
      width: STUDY_QR_SIZE * 4,
      color: { dark: '#2a2a28', light: '#00000000' },
    }).then(setStudyQrDataUrl).catch(() => setStudyQrDataUrl(null));
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3.5">
      {/* The SVG preserves the compact, print-like desktop receipt exactly. */}
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${RECEIPT_WIDTH} ${RECEIPT_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="hidden w-full max-w-[340px] min-w-0 min-[641px]:block"
      >
        <g fontFamily="'Courier New', monospace" fill={TEXT_PRIMARY}>
          <text x={RECEIPT_WIDTH / 2} y="24" textAnchor="middle" fontSize="12" fontWeight="bold" letterSpacing="1">RECEIPT</text>
          <line x1="18" y1="38" x2={RECEIPT_WIDTH - 18} y2="38" stroke="#e6e2d8" strokeWidth="1" />
          <text x="18" y="54" fontSize="9">DATE: {date}</text>
          <text x={RECEIPT_WIDTH - 18} y="54" textAnchor="end" fontSize="9">TIME: {time}</text>
          <line x1="18" y1="66" x2={RECEIPT_WIDTH - 18} y2="66" stroke="#e6e2d8" strokeWidth="1" />
          <text x="18" y="88" fontSize="10">TRIGGER: {itemLabel}</text>
          <text x="18" y="106" fontSize="10">INTENSITY: {tierLabel}</text>
          <text x="18" y="124" fontSize="10">DIAGNOSIS: {stage.name.toUpperCase()}</text>
          <text x={RECEIPT_WIDTH - 18} y="124" textAnchor="end" fontSize="10">STAGE {stage.roman}</text>
          {genreLine && <text x="18" y="142" fontSize="10">TREATMENT: {genreLine}</text>}
          <line x1="18" y1="152" x2={RECEIPT_WIDTH - 18} y2="152" stroke="#e6e2d8" strokeWidth="1" />
          <text x={RECEIPT_WIDTH / 2} y="172" textAnchor="middle" fontSize="9">THANKS FOR PROCESSING YOUR VITUTUS!</text>
          <text x={RECEIPT_WIDTH / 2} y="186" textAnchor="middle" fontSize="8">NO REFUND, NO REMORSE.</text>
          <text x={RECEIPT_WIDTH / 2} y="198" textAnchor="middle" fontSize="8">SCIENTIFICALLY PROVEN TO FUNCTION.</text>
          <line x1="18" y1="214" x2={RECEIPT_WIDTH - 18} y2="214" stroke="#e6e2d8" strokeWidth="1" />
          <text x={RECEIPT_WIDTH / 2} y="236" textAnchor="middle" fontSize="8" fontWeight="bold" letterSpacing="1">THE VITUTUS STUDY</text>
          {studyQrDataUrl && <image href={studyQrDataUrl} x={(RECEIPT_WIDTH - STUDY_QR_SIZE) / 2} y="248" width={STUDY_QR_SIZE} height={STUDY_QR_SIZE} />}
          <text x={RECEIPT_WIDTH / 2} y={248 + STUDY_QR_SIZE + 16} textAnchor="middle" fontSize="8" letterSpacing="1">SCAN TO READ THE SOURCE</text>
          <text x={RECEIPT_WIDTH / 2} y={248 + STUDY_QR_SIZE + 30} textAnchor="middle" fontSize="7.5" letterSpacing="0.5">UNIVERSITY OF TURKU · 2022</text>
        </g>
      </svg>

      {/* A receipt is read close-up on a phone, rather than scaled down from
          its desktop print dimensions. HTML here gives long clinical values
          a natural wrap point without shrinking their type. */}
      <section
        aria-label="Receipt"
        className="w-full min-w-0 px-8 pb-6 pt-8 font-mono min-[641px]:hidden"
        style={{ color: TEXT_PRIMARY }}
      >
        <h2 className="text-center text-[17px] font-bold tracking-[0.08em]">RECEIPT</h2>
        <div className="mt-3 border-t" style={{ borderColor: DIVIDER_COLOR }} />

        <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] leading-[1.45]" style={{ color: TEXT_TERTIARY }}>
          <span>DATE: {date}</span>
          <span>TIME: {time}</span>
        </div>
        <div className="mt-3 border-t" style={{ borderColor: DIVIDER_COLOR }} />

        <dl className="mt-4 space-y-2 text-[14px] leading-[1.45]" style={{ color: TEXT_PRIMARY }}>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt style={{ color: TEXT_SECONDARY }}>TRIGGER:</dt>
            <dd className="min-w-0 break-words">{itemLabel}</dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt style={{ color: TEXT_SECONDARY }}>INTENSITY:</dt>
            <dd>{tierLabel}</dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt style={{ color: TEXT_SECONDARY }}>DIAGNOSIS:</dt>
            <dd className="min-w-0 break-words">{stage.name.toUpperCase()} · STAGE {stage.roman}</dd>
          </div>
          {genreLine && (
            <div className="flex min-w-0 flex-wrap gap-x-2">
              <dt style={{ color: TEXT_SECONDARY }}>TREATMENT:</dt>
              <dd className="min-w-0 break-words">{genreLine}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 border-t" style={{ borderColor: DIVIDER_COLOR }} />
        <div className="mt-4 space-y-1 text-center text-[12px] leading-[1.45]" style={{ color: TEXT_SECONDARY }}>
          <p>THANKS FOR PROCESSING YOUR VITUTUS!</p>
          <p>NO REFUND, NO REMORSE.</p>
          <p>SCIENTIFICALLY PROVEN TO FUNCTION.</p>
        </div>
        <div className="mt-4 border-t" style={{ borderColor: DIVIDER_COLOR }} />

        <div className="mt-4 flex flex-col items-center text-center">
          <p className="text-[13px] font-bold tracking-[0.08em]">THE VITUTUS STUDY</p>
          {studyQrDataUrl && (
            <svg role="img" aria-label="QR code linking to the Vitutus study" className="mt-3 h-[156px] w-[156px]" viewBox="0 0 156 156">
              <image href={studyQrDataUrl} width="156" height="156" />
            </svg>
          )}
          <p className="mt-3 text-[12px] tracking-[0.08em]" style={{ color: TEXT_SECONDARY }}>SCAN TO READ THE SOURCE</p>
          <p className="mt-1 text-[12px] tracking-[0.04em]" style={{ color: TEXT_TERTIARY }}>UNIVERSITY OF TURKU · 2022</p>
        </div>
      </section>
    </div>
  );
}
