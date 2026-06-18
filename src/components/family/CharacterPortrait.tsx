import React from 'react';
import { PORTRAITS, type CharacterName } from './portraits';

/**
 * Renders a host-family member's locked flat-illustration portrait.
 *
 * Art is stored in `portraits.ts` as base64 SVG data URIs (generated from the
 * canonical build scripts) and rendered via a plain <img>. No HTML injection
 * surface — no dangerouslySetInnerHTML.
 */
export default function CharacterPortrait({
  name,
  size = 64,
  title,
  className,
}: {
  name: CharacterName;
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <img
      src={PORTRAITS[name]}
      alt={title ?? name}
      data-testid={`portrait-${name}`}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        borderRadius: '50%',
        flex: 'none',
      }}
    />
  );
}
