import React from 'react';
import ExerciseCard from './ExerciseCard';

/**
 * All-exercises intent panel — flat list of every exercise available at the
 * user's current level. Extracted from PracticeTab as part of the 1d
 * decomposition. Presentational; the filtered list comes in as a prop.
 */
export default function AllPanel({
  availableExercises,
}: {
  availableExercises: React.ComponentProps<typeof ExerciseCard>[];
}) {
  return (
    <div>
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{ background: 'rgba(14,116,144,.12)' }}>
          🗂️
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">All Exercises</div>
          <div className="section-hdr-sub">{availableExercises.length} available at your level</div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        {availableExercises.map((ex) => (
          <ExerciseCard key={ex.id} {...ex} />
        ))}
      </div>
    </div>
  );
}
