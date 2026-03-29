import React from 'react';
import { motion } from 'framer-motion';
import VideoBackground from '../shared/VideoBackground.jsx';

const SCENE_POOL = [
  { key:'dubrovnik', img:'/images/scenes/dubrovnik-hero.webp',  city:'Dubrovnik',        label:'Adriatic Pearl' },
  { key:'dalmatian', img:'/images/scenes/dalmatian-coast.webp', city:'Dalmatian Coast',  label:'The Adriatic Sea' },
  { key:'sibenik', img:'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=85&fit=crop&auto=format', city:'\u0160ibenik', label:'City of St. James Cathedral' },
  { key:'zagreb',    img:'/images/scenes/zagreb.webp',          city:'Zagreb',           label:'The Capital' },
  { key:'labin',     img:'/images/scenes/labin.webp',           city:'Labin, Istria',    label:'Medieval Hilltop Town' },
  { key:'mostar',    img:'/images/scenes/mostar.webp',          city:'Mostar',           label:'Stari Most Bridge' },
  { key:'food',      img:'/images/scenes/croatian-food.webp',   city:'Croatian Cuisine', label:'Taste of Croatia' },
];

export default function CroatiaPostcard({ dailyCulture, dailyCultureLoading, todayPhrases }) {
  const dayIdx = Math.floor(Date.now() / 86400000);
  const scene = SCENE_POOL[dayIdx % SCENE_POOL.length];
  const phrase = todayPhrases[0];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.12 }}>
      <VideoBackground
        imageSrc={scene.img}
        overlay="linear-gradient(160deg,rgba(0,0,0,.68) 0%,rgba(0,0,0,.3) 60%,rgba(0,0,0,.58) 100%)"
        style={{ borderRadius: 18, marginBottom: 16, minHeight: dailyCulture ? 190 : 145, boxShadow: '0 4px 24px rgba(0,0,0,.22)', transition: 'min-height .4s ease' }}
      >
        <div style={{ padding:'18px 18px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.65)', letterSpacing:'.14em', textTransform:'uppercase' }}>
              🇭🇷 Croatia Today · {scene.label}
            </div>
            <span style={{ fontSize:18 }}>🇭🇷</span>
          </div>

          {/* AI-generated phrase — replaces static when loaded */}
          <div style={{
            background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)',
            borderRadius:12, padding:'10px 13px',
            border:'1px solid rgba(255,255,255,.2)',
            marginBottom: dailyCulture?.culturalFact ? 8 : 0,
          }}>
            {dailyCultureLoading && !dailyCulture ? (
              <div style={{ display:'flex', gap:4, justifyContent:'center', padding:'4px 0' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,.6)', animation:`dot-bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize:16, fontWeight:900, color:'#fff', marginBottom:3, fontFamily:"'Playfair Display',serif", fontStyle:'italic' }}>
                  "{dailyCulture ? dailyCulture.phrase : phrase.hr}"
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', fontWeight:600 }}>
                  {dailyCulture ? dailyCulture.translation : phrase.en}
                  {dailyCulture?.pronunciation && (
                    <span style={{ opacity:.6, marginLeft:4 }}>· /{dailyCulture.pronunciation}/</span>
                  )}
                  <span style={{ opacity:.55, marginLeft:4 }}>· {dailyCulture?.category || phrase.cat}</span>
                </div>
              </>
            )}
          </div>

          {/* Cultural fact — AI only */}
          {dailyCulture?.culturalFact && (
            <div style={{
              background:'rgba(0,0,0,.28)', backdropFilter:'blur(6px)',
              borderRadius:10, padding:'8px 11px',
              border:'1px solid rgba(255,255,255,.1)',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,.55)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:3 }}>
                ✦ Today's Insight
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.82)', lineHeight:1.55, fontWeight:500 }}>
                {dailyCulture.culturalFact}
              </div>
              {dailyCulture.tip && (
                <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:5, fontStyle:'italic', fontWeight:500 }}>
                  💡 {dailyCulture.tip}
                </div>
              )}
            </div>
          )}
        </div>
      </VideoBackground>
    </motion.div>
  );
}
