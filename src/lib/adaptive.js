/**
 * Per-topic accuracy tracking.
 * Stored in localStorage key 'topic_accuracy': { [topicId]: { attempts, correct, lastAttempt } }
 */

export function recordTopicResult(topicId, correct) {
  const key = 'topic_accuracy';
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const curr = data[topicId] || { attempts: 0, correct: 0, lastAttempt: 0 };
  data[topicId] = {
    attempts: curr.attempts + 1,
    correct: curr.correct + (correct ? 1 : 0),
    lastAttempt: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

export function getTopicAccuracy(topicId) {
  const data = JSON.parse(localStorage.getItem('topic_accuracy') || '{}');
  const t = data[topicId];
  if (!t || t.attempts === 0) return null;
  return { accuracy: Math.round((t.correct / t.attempts) * 100), attempts: t.attempts };
}

export function getWeakTopics(threshold = 60) {
  const data = JSON.parse(localStorage.getItem('topic_accuracy') || '{}');
  return Object.entries(data)
    .filter(([, v]) => /** @type {any} */ (v).attempts >= 3 && (/** @type {any} */ (v).correct / /** @type {any} */ (v).attempts * 100) < threshold)
    .map(([id, v]) => ({ id, accuracy: Math.round(/** @type {any} */ (v).correct / /** @type {any} */ (v).attempts * 100), attempts: /** @type {any} */ (v).attempts }))
    .sort((a, b) => a.accuracy - b.accuracy);
}
