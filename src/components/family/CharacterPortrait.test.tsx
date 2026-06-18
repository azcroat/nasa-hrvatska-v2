import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import CharacterPortrait from './CharacterPortrait';
import { ALL_CHARACTERS } from './portraits';

describe('CharacterPortrait', () => {
  it('renders Baka as an accessible SVG-data-URI image', () => {
    render(<CharacterPortrait name="baka" title="Baka Marija" />);
    const img = screen.getByRole('img', { name: 'Baka Marija' }) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('applies the requested pixel size', () => {
    render(<CharacterPortrait name="baka" size={120} title="Baka" />);
    const img = screen.getByRole('img', { name: 'Baka' }) as HTMLElement;
    expect(img.style.width).toBe('120px');
    expect(img.style.height).toBe('120px');
  });

  it('falls back to the name as the accessible label when no title is given', () => {
    render(<CharacterPortrait name="ana" />);
    expect(screen.getByRole('img', { name: 'ana' })).toBeInTheDocument();
  });

  it('renders every character in the cast with an SVG data URI', () => {
    for (const name of ALL_CHARACTERS) {
      const { unmount } = render(<CharacterPortrait name={name} title={name} />);
      const img = screen.getByRole('img', { name }) as HTMLImageElement;
      expect(img.getAttribute('src'), `missing art for ${name}`).toMatch(
        /^data:image\/svg\+xml;base64,/,
      );
      unmount();
    }
  });
});
