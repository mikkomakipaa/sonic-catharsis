'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Stage, MAX_STRESS_INTENSITY, TEXT_PRIMARY, TOTAL_INTENSITY_LEVELS } from '@/lib/theme';

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
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${RECEIPT_WIDTH} ${RECEIPT_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[340px] min-w-0"
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
          <text x={RECEIPT_WIDTH / 2} y="172" textAnchor="middle" fontSize="9">THANK YOU FOR PROCESSING YOUR VITUTUS!</text>
          <text x={RECEIPT_WIDTH / 2} y="186" textAnchor="middle" fontSize="8">NO REFUND, NO REMORSE.</text>
          <text x={RECEIPT_WIDTH / 2} y="198" textAnchor="middle" fontSize="8">SCIENTIFICALLY PROVEN TO FUNCTION.</text>
          <line x1="18" y1="214" x2={RECEIPT_WIDTH - 18} y2="214" stroke="#e6e2d8" strokeWidth="1" />
          <text x={RECEIPT_WIDTH / 2} y="236" textAnchor="middle" fontSize="8" fontWeight="bold" letterSpacing="1">VITUTUS STUDY</text>
          {studyQrDataUrl && <image href={studyQrDataUrl} x={(RECEIPT_WIDTH - STUDY_QR_SIZE) / 2} y="248" width={STUDY_QR_SIZE} height={STUDY_QR_SIZE} />}
          <text x={RECEIPT_WIDTH / 2} y={248 + STUDY_QR_SIZE + 16} textAnchor="middle" fontSize="8" letterSpacing="1">SCAN TO READ THE SOURCE</text>
          <text x={RECEIPT_WIDTH / 2} y={248 + STUDY_QR_SIZE + 30} textAnchor="middle" fontSize="7.5" letterSpacing="0.5">UNIVERSITY OF TURKU · 2022</text>
        </g>
      </svg>
    </div>
  );
}
