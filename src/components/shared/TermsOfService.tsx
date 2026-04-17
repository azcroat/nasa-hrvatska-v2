import React from 'react';

export default function TermsOfService({ goBack }) {
  return (
    <div className="scr-wrap" style={{ paddingBottom: 80, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {goBack && (
          <button onClick={goBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: 'var(--subtext)', padding: '4px 0',
            fontFamily: "'Outfit', sans-serif",
          }}>‹ Back</button>
        )}
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Terms of Service</h2>
      </div>
      <p style={{ color: 'var(--subtext)', fontSize: 13, marginBottom: 24 }}>Last updated: March 2026</p>

      {[
        { title: '1. Acceptance', body: 'By using Naša Hrvatska you agree to these Terms. If you do not agree, do not use the service.' },
        { title: '2. Use of Service', body: 'Naša Hrvatska is a Croatian language learning application. You may use it for personal, non-commercial learning purposes. You may not scrape, reverse-engineer, or redistribute the content.' },
        { title: '3. Accounts', body: 'You are responsible for maintaining the security of your account credentials. You must provide a valid email address. Accounts found to be used for abuse, spam, or leaderboard manipulation will be terminated.' },
        { title: '4. Content', body: 'All lesson content, exercises, and audio are the intellectual property of Naša Hrvatska. You may not copy or redistribute this content without written permission.' },
        { title: '5. Availability', body: 'We aim for high availability but make no guarantees of uptime. We may modify, suspend, or discontinue the service at any time with reasonable notice.' },
        { title: '6. Disclaimer', body: 'The service is provided "as is" without warranties of any kind. We are not responsible for any loss of learning data due to technical failures, though we take reasonable steps to prevent data loss.' },
        { title: '7. Governing Law', body: 'These Terms are governed by the laws of the Republic of Croatia.' },
        { title: '8. Contact', body: 'For legal questions: legal@nasahrvatska.app' },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--rt-c)', margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
