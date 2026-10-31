'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ExternalLink } from 'lucide-react';
import { TEXT_SECONDARY, TEXT_TERTIARY, TREATMENT_ACCENT_TEXT } from '@/lib/theme';

const VITUTUS_STUDY_URL = 'https://emotion.utu.fi/wp-content/uploads/2022/04/LN_JH_Vitutus_22.pdf';
const QR_SIZE = 64;

// Citation for the real "Vitutus" study the stage names borrow from, shown in
// the Prescription header. The QR and a visible "Read the study" link both open
// it: a phone can't scan its own screen, so a tap has to do the same job.
export default function StudyQr() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(VITUTUS_STUDY_URL, {
      margin: 0,
      width: QR_SIZE * 4,
      color: { dark: '#2a2a28', light: '#00000000' },
    }).then(setDataUrl).catch(() => setDataUrl(null));
  }, []);

  if (!dataUrl) return null;

  return (
    <div
      className="shrink-0 flex flex-col items-center gap-1 text-center uppercase text-[8px] max-[480px]:text-[9px] leading-tight"
      style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.04em', color: TEXT_SECONDARY }}
    >
      <a href={VITUTUS_STUDY_URL} target="_blank" rel="noopener noreferrer" aria-label="Open the Vitutus study" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={QR_SIZE} height={QR_SIZE} alt="QR code linking to the Vitutus study" className="max-[480px]:w-14 max-[480px]:h-14" />
      </a>
      {/* Visible link for devices that can't scan their own screen. */}
      <a
        href={VITUTUS_STUDY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 underline underline-offset-2 max-[480px]:min-h-[44px]"
        style={{ color: TREATMENT_ACCENT_TEXT }}
      >
        Read the study
        <ExternalLink className="h-2 w-2 max-[480px]:h-2.5 max-[480px]:w-2.5" aria-hidden="true" />
      </a>
      <span style={{ color: TEXT_TERTIARY }}>Univ. of Turku · 2022</span>
    </div>
  );
}
