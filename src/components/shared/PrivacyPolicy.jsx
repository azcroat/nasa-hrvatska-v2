import React from 'react';

export default function PrivacyPolicy({ goBack }) {
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
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Privacy Policy</h2>
      </div>
      <p style={{ color: 'var(--subtext)', fontSize: 13, marginBottom: 24 }}>Last updated: March 2026</p>

      {[
        { title: '1. Data We Collect', body: 'We collect your email address, display name, and learning progress (lessons completed, XP earned, grammar exercises, vocabulary). We do not collect payment information, location data, or browsing history.' },
        { title: '2. How We Use Your Data', body: 'Your data is used solely to provide the Naša Hrvatska learning service: syncing your progress across devices, displaying your ranking on the family leaderboard, and personalising your learning path. We do not sell, share, or monetise your data.' },
        { title: '3. Data Storage', body: "Your progress is stored in your browser's localStorage for offline use and synchronised to Google Firebase Firestore (EU region). Authentication is handled by Google Firebase Authentication." },
        { title: '4. Cookies & Local Storage', body: 'We use localStorage to cache your learning progress locally. We do not use third-party tracking cookies or advertising cookies. A single localStorage key records your cookie consent preference.' },
        { title: '5. Your Rights (GDPR)', body: 'You have the right to access, correct, export, or delete your personal data at any time. Use the "Export My Data" and "Delete Account" options in your Profile settings. For other requests, contact us at the email below.' },
        { title: '6. Data Retention', body: 'Your data is retained as long as your account is active. When you delete your account, all personal data including progress, name, and email are permanently deleted from our systems within 30 days.' },
        { title: '7. Third-Party Services', body: 'We use Google Firebase (authentication, database), Microsoft Azure Cognitive Services (text-to-speech pronunciation), and Cloudflare (hosting and CDN). Each service operates under its own privacy policy.' },
        { title: '8. Children', body: 'This application is intended for users aged 13 and over. We do not knowingly collect data from children under 13.' },
        { title: '9. Contact', body: 'For privacy questions or data requests: privacy@nasahrvatska.app' },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
