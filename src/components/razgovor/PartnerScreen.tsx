import React from 'react';
import { PARTNERS, launchMode, type PartnerId } from './partners';

// NOTE: minimal placeholder — Task 4 replaces this with the host-hero interior
// (port of partner-interior.html / kovac-interior.html). Kept functional so
// RazgovorTab compiles and can open a partner.
export default function PartnerScreen({
  partnerId,
  setScr,
  sCurEx,
  onBack,
}: {
  partnerId: PartnerId;
  setScr: (s: string) => void;
  sCurEx?: (e: string) => void;
  onBack: () => void;
}) {
  const p = PARTNERS.find((x) => x.id === partnerId)!;
  return (
    <div data-testid="partner-screen">
      <button onClick={onBack}>← Razgovor</button>
      <h2>{p.name}</h2>
      {p.modes.map((m) => (
        <button key={m.id} onClick={() => launchMode(m, { setScr, sCurEx })}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
