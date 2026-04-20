// @ts-nocheck
import React from 'react';

const DIALOGUE_PORTRAIT = {
  cafe: 'young-man',
  directions: 'mature-man',
  doctor: 'mature-man',
  shopping: 'young-woman',
  meeting: 'young-man',
  transport: 'mature-woman',
  pharmacy: 'mature-woman',
  restaurant: 'young-man',
  family_gathering: 'grandmother',
};

export default function DialogueAvatar({ scenarioId }) {
  const key = DIALOGUE_PORTRAIT[scenarioId];
  const [err, setErr] = React.useState(false);
  if (!key || err) return null;
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        border: '2px solid #e0f2fe',
        background: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
        marginTop: 2,
      }}
    >
      <img
        src={`/images/portraits/${key}.webp`}
        alt=""
        loading="lazy"
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
