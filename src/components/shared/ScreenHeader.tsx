import React from 'react';

/**
 * Unified sticky screen header.
 * Replaces the H() utility call on simple screens (Flashcards, Listening, SentenceTiles…).
 * NOT used by McGame — it has a custom progress bar / hearts header.
 *
 * Props:
 *   title    {string}  — main heading text
 *   goBack   {fn}      — called on back-button press
 *   pill     {string}  — optional right-side pill text (e.g. "+5 XP" or "A2")
 */
export default function ScreenHeader({ title, goBack, pill }) {
  return (
    <div className="screen-header">
      {goBack && (
        <button
          className="screen-header__back"
          onClick={goBack}
          aria-label="Go back"
        >
          ‹
        </button>
      )}
      <h1 className="screen-header__title">{title}</h1>
      {pill && <span className="screen-header__pill">{pill}</span>}
    </div>
  );
}
