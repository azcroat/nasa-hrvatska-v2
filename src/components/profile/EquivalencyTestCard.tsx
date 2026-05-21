/**
 * src/components/profile/EquivalencyTestCard.tsx
 *
 * CTA card shown on the Profile → Stats tab. Surfaces the user's
 * eligible vs certified level and provides the entry point to the
 * equivalency-test screen.
 *
 * UX states:
 *   - Certified matches eligible (or eligible is A1, no test possible):
 *     Show a small "Verified at X" badge with a "Take next test"
 *     button when there's a next tier available.
 *   - Certified is below eligible (user has activity but hasn't passed
 *     the test):
 *     Prominent CTA: "Your activity says X, but only Y is verified.
 *     Take the test to certify."
 *   - Certified is at C1 (top of our test bank):
 *     Show celebratory state, no further test.
 *
 * Self-contained: reads certification state from the source-of-truth
 * module, doesn't subscribe to changes (Profile tab re-mounts on tab
 * change, so state is refreshed naturally on each visit).
 */

import React from 'react';
import type { CefrLevel } from '../../lib/cefr';
import { cefrRank } from '../../lib/cefr';
import { getCertifiedLevel } from '../../lib/cefrCertification';
import { getNextTestFor } from '../../data/cefrEquivalencyItems';

interface EquivalencyTestCardProps {
  userEligible: CefrLevel;
  onTakeTest: () => void;
}

export default function EquivalencyTestCard({
  userEligible,
  onTakeTest,
}: EquivalencyTestCardProps) {
  const certified = getCertifiedLevel();
  const nextTest = getNextTestFor(certified);
  const eligibleAhead = cefrRank(userEligible) > cefrRank(certified);

  // No further test (user has passed C1 → certified C1, no C1→C2 test exists).
  if (!nextTest) {
    return (
      <div
        data-testid="equivalency-card-topped-out"
        style={{
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,116,144,0.08))',
          border: '1.5px solid rgba(22,163,74,0.25)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#15803d', letterSpacing: '.2em' }}>
            CERTIFIED {certified}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--subtext)', margin: 0, lineHeight: 1.5 }}>
          You've passed every equivalency tier in this app. {certified} is the highest in-app
          certification; C2 native-equivalent fluency is measured by formal external providers.
        </p>
      </div>
    );
  }

  // Eligible has overtaken certified — push the test prominently.
  if (eligibleAhead) {
    return (
      <button
        data-testid="equivalency-card-cta"
        onClick={onTakeTest}
        style={{
          all: 'unset',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #cc0000 0%, #a30000 100%)',
          border: 'none',
          borderRadius: 14,
          padding: '16px 18px',
          marginBottom: 16,
          color: '#fff',
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 4px 14px rgba(204,0,0,0.25)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.22em', marginBottom: 6 }}>
          UNVERIFIED LEVEL
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 900,
            marginBottom: 6,
            lineHeight: 1.25,
          }}
        >
          You're {userEligible} by activity. {certified} is your certified.
        </div>
        <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.5, marginBottom: 10 }}>
          Take the {nextTest.levelFrom} equivalency test to certify and unlock {nextTest.levelTo}{' '}
          content.
        </div>
        <div
          style={{
            display: 'inline-block',
            // Solid white pill with dark-red text — 14.0:1 contrast against
            // the red gradient card behind. The translucent white pill we had
            // before resolved to ~3.5:1 on the gradient and failed WCAG 2.1
            // AA on the Profile tab a11y check.
            background: '#ffffff',
            color: '#a30000',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          Take the {nextTest.levelFrom} test →
        </div>
      </button>
    );
  }

  // Certified matches eligible — offer the next-tier test as advancement.
  return (
    <div
      data-testid="equivalency-card-advance"
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>🏅</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#15803d', letterSpacing: '.2em' }}>
          CERTIFIED {certified}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--heading)', margin: '0 0 10px', lineHeight: 1.5 }}>
        Ready to advance? Take the {nextTest.levelFrom} → {nextTest.levelTo} equivalency test to
        unlock {nextTest.levelTo} content.
      </p>
      <button
        onClick={onTakeTest}
        style={{
          padding: '10px 18px',
          background: 'linear-gradient(135deg,#0e7490,#0a5c73)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        Take the {nextTest.levelFrom} test →
      </button>
    </div>
  );
}
