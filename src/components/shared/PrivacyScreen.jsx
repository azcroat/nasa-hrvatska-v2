import React from 'react';
import { H } from '../../data.jsx';

export default function PrivacyScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      {H("Privacy & Terms", "Last updated: March 2026")}

      <div className="c" style={{marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:800,color:"var(--heading)",marginBottom:8}}>Privacy Policy</h3>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>What we collect:</strong> Your email address and display name (used to identify your account).
          Your learning progress — XP, lesson completions, and spaced-repetition data — stored in Firebase Firestore.
          No browsing data, no device fingerprinting, no advertising identifiers.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Analytics:</strong> We use Plausible Analytics, a privacy-first, cookie-free service.
          Plausible does not track individuals or sell data. No cookies are set.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Text-to-speech:</strong> Words and phrases you choose to hear aloud are sent to Microsoft Azure
          Speech Services to generate audio. These requests are proxied through our server and are not stored.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Data sharing:</strong> We do not sell, rent, or share your personal data with third parties
          for commercial purposes. Firebase and Microsoft Azure process data as processors under their
          respective data processing agreements.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Data deletion:</strong> To delete your account and all associated data, email
          {" "}<a href="mailto:privacy@nasahrvatska.com" style={{color:"#0e7490"}}>privacy@nasahrvatska.com</a>.
          We will process your request within 30 days.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7}}>
          <strong>Children:</strong> This service is not directed to children under 13. We do not knowingly
          collect data from children under 13.
        </p>
      </div>

      <div className="c" style={{marginBottom:24}}>
        <h3 style={{fontSize:15,fontWeight:800,color:"var(--heading)",marginBottom:8}}>Terms of Use</h3>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Free to use:</strong> Naša Hrvatska is provided free of charge, with no ads. You may use
          the app for personal, non-commercial language learning.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Account responsibility:</strong> You are responsible for keeping your password secure.
          Do not share your account. We reserve the right to suspend accounts engaged in abuse.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Content:</strong> All Croatian language content, exercises, and cultural material in
          this app is owned by Naša Hrvatska. You may not reproduce or redistribute it without permission.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7,marginBottom:10}}>
          <strong>Disclaimer:</strong> This app is an educational tool. While we strive for accuracy,
          we make no guarantee that all language content is error-free. For professional or medical
          translation, consult a qualified translator.
        </p>

        <p style={{fontSize:13,color:"var(--rt-c)",lineHeight:1.7}}>
          <strong>Changes:</strong> We may update these terms. Continued use of the app after changes
          constitutes acceptance of the updated terms.
        </p>
      </div>

      <div style={{textAlign:"center",fontSize:12,color:"var(--subtext)",marginBottom:24}}>
        Questions? Email{" "}
        <a href="mailto:privacy@nasahrvatska.com" style={{color:"#0e7490"}}>privacy@nasahrvatska.com</a>
      </div>

      <button className="b bg" style={{width:"100%"}} onClick={goBack}>
        Back
      </button>
    </div>
  );
}
