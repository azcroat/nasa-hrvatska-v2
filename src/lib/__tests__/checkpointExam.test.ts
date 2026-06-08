// src/lib/__tests__/checkpointExam.test.ts
import { describe, it, expect } from 'vitest';
import { buildCheckpointExam } from '../checkpointExam.js';
import { getCertificationState } from '../cefrCertification.js';

function seededRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length]!;
}

describe('buildCheckpointExam (B1)', () => {
  it('produces renderable B1 questions + 2 retention from below + a speaking section', () => {
    const exam = buildCheckpointExam(
      'B1',
      getCertificationState(),
      [],
      seededRng([0, 0.3, 0.6, 0.1, 0.5, 0.2]),
    );
    // 3 core (B1) + 2 retention (below B1)
    expect(exam.questions.length).toBe(5);
    expect(exam.questions.every((q) => q.options.length === 4 && q.prompt.length > 0)).toBe(true);
    expect(exam.questions.filter((q) => q.level === 'B1').length).toBe(3);
    expect(exam.questions.filter((q) => q.level !== 'B1').length).toBe(2);
    expect(exam.speaking.tasks.length).toBeGreaterThanOrEqual(1);
    expect(exam.speaking.level).toBe('B1');
  });
});
