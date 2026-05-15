// e2e/fixtures/mockAiPost.js
// SP10: registers canned responses for /api/* endpoints.

export async function mockAiPost(page, routes) {
  for (const [path, body] of Object.entries(routes)) {
    await page.route(`**${path}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    });
  }
}

export const CANNED = {
  correct: {
    corrected_text: 'Imam majku i tatu svaki dan svaki dan svaki dan.',
    score: 80,
    level_demonstrated: 'B1 - Intermediate',
    changes: [
      { original: 'mama', corrected: 'majku', note: 'Accusative ending.' },
      { original: 'tata', corrected: 'tatu', note: 'Accusative ending.' },
    ],
    strengths: ['Good sentence structure'],
    improvements: ['Practice accusative endings'],
    encouragement: 'Bravo!',
  },
  pronunciationAssess: {
    overall: 82,
    accuracy: 85,
    fluency: 80,
    completeness: 90,
    prosody: 75,
    word_scores: [
      {
        word: 'pas',
        score: 88,
        phonemes: [
          { phoneme: 'p', score: 95 },
          { phoneme: 'a', score: 90 },
          { phoneme: 's', score: 80 },
        ],
      },
    ],
  },
};
