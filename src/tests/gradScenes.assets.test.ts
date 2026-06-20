import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Every place that should have a bespoke hero scene. kavana already shipped.
const PLACE_IDS = ['kavana', 'trznica', 'soba', 'kuhinja', 'ulica', 'trg'] as const;
const FORBIDDEN = /<(script|image|foreignObject|filter)\b/i;

describe('Grad hero scene assets', () => {
  for (const id of PLACE_IDS) {
    const file = resolve(process.cwd(), `public/images/grad-${id}.svg`);

    it(`grad-${id}.svg exists`, () => {
      expect(existsSync(file)).toBe(true);
    });

    it(`grad-${id}.svg uses the locked viewBox and no raster/script/filter`, () => {
      const svg = readFileSync(file, 'utf8');
      expect(svg).toContain('viewBox="0 0 392 158"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
      expect(FORBIDDEN.test(svg)).toBe(false);
      // no embedded raster data
      expect(/data:image\//i.test(svg)).toBe(false);
    });
  }
});
