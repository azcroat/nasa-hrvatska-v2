import React, { useState, useMemo } from 'react';
import { H } from '../../data.jsx';
import { speak } from '../../lib/audio.js';

// ─── Noun Library ────────────────────────────────────────────────────────────
const NOUN_LIBRARY = [
  // Masculine inanimate
  { hr:"grad",      en:"city",         gender:"m", type:"inanimate" },
  { hr:"stol",      en:"table",        gender:"m", type:"inanimate" },
  { hr:"auto",      en:"car",          gender:"m", type:"inanimate" },
  { hr:"prozor",    en:"window",       gender:"m", type:"inanimate" },
  { hr:"jezik",     en:"language",     gender:"m", type:"inanimate" },
  { hr:"dan",       en:"day",          gender:"m", type:"inanimate" },
  { hr:"put",       en:"road/way",     gender:"m", type:"inanimate" },
  // Masculine animate
  { hr:"brat",      en:"brother",      gender:"m", type:"animate" },
  { hr:"pas",       en:"dog",          gender:"m", type:"animate" },
  { hr:"prijatelj", en:"friend",       gender:"m", type:"animate" },
  { hr:"student",   en:"student",      gender:"m", type:"animate" },
  { hr:"muškarac",  en:"man",          gender:"m", type:"animate" },
  { hr:"otac",      en:"father",       gender:"m", type:"animate" },
  { hr:"sin",       en:"son",          gender:"m", type:"animate" },
  // Feminine
  { hr:"žena",      en:"woman",        gender:"f" },
  { hr:"knjiga",    en:"book",         gender:"f" },
  { hr:"voda",      en:"water",        gender:"f" },
  { hr:"kuća",      en:"house",        gender:"f" },
  { hr:"mama",      en:"mum",          gender:"f" },
  { hr:"škola",     en:"school",       gender:"f" },
  { hr:"ulica",     en:"street",       gender:"f" },
  { hr:"ruka",      en:"hand/arm",     gender:"f" },
  { hr:"noga",      en:"leg/foot",     gender:"f" },
  { hr:"glava",     en:"head",         gender:"f" },
  { hr:"zemlja",    en:"earth/country",gender:"f" },
  { hr:"rijeka",    en:"river",        gender:"f" },
  { hr:"sestra",    en:"sister",       gender:"f" },
  { hr:"kći",       en:"daughter",     gender:"f", irregular:true },
  // Neuter -o
  { hr:"selo",      en:"village",      gender:"n" },
  { hr:"jezero",    en:"lake",         gender:"n" },
  { hr:"nebo",      en:"sky",          gender:"n" },
  { hr:"pismo",     en:"letter",       gender:"n" },
  { hr:"vino",      en:"wine",         gender:"n" },
  { hr:"mlijeko",   en:"milk",         gender:"n" },
  { hr:"polje",     en:"field",        gender:"n" },
  // Neuter -e
  { hr:"more",      en:"sea",          gender:"n" },
  { hr:"sunce",     en:"sun",          gender:"n" },
  { hr:"srce",      en:"heart",        gender:"n" },
  { hr:"voće",      en:"fruit",        gender:"n" },
  { hr:"lice",      en:"face",         gender:"n" },
  { hr:"ime",       en:"name",         gender:"n" },
  // Irregular
  { hr:"dijete",    en:"child",        gender:"n", irregular:true },
];

// ─── Case Metadata ────────────────────────────────────────────────────────────
const CASE_INFO = [
  {
    name:"Nominativ", abbr:"NOM", en:"Nominative",
    question:"Tko? Što? (Who? What?)",
    use:"Subject of the sentence",
    color:"#1e40af", bg:"#dbeafe",
    example:"[WORD] je lijep/a/o.",
  },
  {
    name:"Genitiv", abbr:"GEN", en:"Genitive",
    question:"Koga? Čega? (Of whom? Of what?)",
    use:"Possession, negation, quantity — prepositions: bez, od, do, iz, kod, oko, zbog",
    color:"#166534", bg:"#dcfce7",
    example:"Nema [WORD].",
  },
  {
    name:"Dativ", abbr:"DAT", en:"Dative",
    question:"Komu? Čemu? (To/for whom?)",
    use:"Indirect object — prepositions: prema, k/ka",
    color:"#92400e", bg:"#fef3c7",
    example:"Dajem [WORD].",
  },
  {
    name:"Akuzativ", abbr:"ACC", en:"Accusative",
    question:"Koga? Što? (Whom? What?)",
    use:"Direct object, motion toward (u/na + acc) — prepositions: kroz, za",
    color:"#6b21a8", bg:"#f3e8ff",
    example:"Vidim [WORD].",
  },
  {
    name:"Vokativ", abbr:"VOC", en:"Vocative",
    question:"Direct address",
    use:"Calling out to someone: Pero!, Mama!, dragi prijatelju!",
    color:"#be185d", bg:"#fdf2f8",
    example:"Hej, [WORD]!",
  },
  {
    name:"Lokativ", abbr:"LOC", en:"Locative",
    question:"O komu? O čemu? (About/at/in?)",
    use:"Always with preposition: u, na, o, po, pri — location/topic",
    color:"#0e7490", bg:"#ecfeff",
    example:"Govorim o [WORD].",
  },
  {
    name:"Instrumental", abbr:"INS", en:"Instrumental",
    question:"S kim? S čim? (With whom/what?)",
    use:"Accompaniment (s/sa), means of transport — prepositions: između, ispred, iza",
    color:"#7c3aed", bg:"#faf5ff",
    example:"Idem s [WORD]om.",
  },
];

// ─── Irregular forms ──────────────────────────────────────────────────────────
const IRREGULAR_FORMS = {
  dijete: {
    sg: ["dijete","djeteta","djetetu","dijete","dijete!","djetetu","djetetom"],
    pl: ["djeca","djece","djeci","djecu","djeco!","djeci","djecom"],
  },
  kći: {
    sg: ["kći","kćeri","kćeri","kćer","kćeri!","kćeri","kćerju"],
    pl: ["kćeri","kćeri","kćerima","kćeri","kćeri!","kćerima","kćerima"],
  },
};

// ─── Declension engine ────────────────────────────────────────────────────────
function declineNoun(noun) {
  if (noun.irregular && IRREGULAR_FORMS[noun.hr]) {
    return IRREGULAR_FORMS[noun.hr];
  }

  const w = noun.hr;

  if (noun.gender === "m") {
    if (noun.type === "animate") {
      // Masculine animate pattern — based on prijatelj
      const stem = w.endsWith("ac")
        ? w.slice(0, -2) + "c"   // muškarac → muškarc- (simplified)
        : w;
      // Special handling for common irregular stems
      const stems = {
        otac:       { sg:["otac","oca","ocu","oca","oče!","ocu","ocem"],         pl:["očevi","očeva","očevima","očeve","očevi!","očevima","očevima"] },
        muškarac:   { sg:["muškarac","muškarca","muškarcu","muškarca","muškarče!","muškarcu","muškarcem"], pl:["muškarci","muškaraca","muškarcima","muškarce","muškarci!","muškarcima","muškarcima"] },
        pas:        { sg:["pas","psa","psu","psa","pse!","psu","psom"],           pl:["psi","pasa","psima","pse","psi!","psima","psima"] },
      };
      if (stems[w]) return stems[w];

      // Generic animate masculine
      const s = w;
      const suf = (s.endsWith("j") || s.endsWith("lj") || s.endsWith("nj")) ? "em" : "om";
      const vocSg = s.endsWith("j") ? s + "u" : s + "e";
      const plBase = s.endsWith("j") ? s.slice(0, -1) + "ji"
                   : s.endsWith("lj") ? s.slice(0, -2) + "lji"
                   : s + "i";
      return {
        sg: [s, s+"a", s+"u", s+"a", vocSg+"!", s+"u", s+suf],
        pl: [plBase, s+"a", s+"ima", s+"e", plBase+"!", s+"ima", s+"ima"],
      };
    } else {
      // Masculine inanimate pattern — based on stol/grad
      const specialM = {
        grad:   { sg:["grad","grada","gradu","grad","grade!","gradu","gradom"],   pl:["gradovi","gradova","gradovima","gradove","gradovi!","gradovima","gradovima"] },
        auto:   { sg:["auto","auta","autu","auto","auto!","autu","autom"],         pl:["auti","auta","autima","aute","auti!","autima","autima"] },
        prozor: { sg:["prozor","prozora","prozoru","prozor","prozore!","prozoru","prozorom"], pl:["prozori","prozora","prozorima","prozore","prozori!","prozorima","prozorima"] },
        jezik:  { sg:["jezik","jezika","jeziku","jezik","jeziku!","jeziku","jezikom"],        pl:["jezici","jezika","jezicima","jezike","jezici!","jezicima","jezicima"] },
        dan:    { sg:["dan","dana","danu","dan","dane!","danu","danom"],           pl:["dani","dana","danima","dane","dani!","danima","danima"] },
        put:    { sg:["put","puta","putu","put","pute!","putu","putom"],           pl:["putovi","putova","putovima","putove","putovi!","putovima","putovima"] },
      };
      if (specialM[w]) return specialM[w];

      // Generic inanimate masculine (stol pattern)
      const s = w;
      return {
        sg: [s, s+"a", s+"u", s, s+"e!", s+"u", s+"om"],
        pl: [s+"ovi", s+"ova", s+"ovima", s+"ove", s+"ovi!", s+"ovima", s+"ovima"],
      };
    }
  }

  if (noun.gender === "f") {
    // Feminine -a pattern (žena)
    const specialF = {
      zemlja: { sg:["zemlja","zemlje","zemlji","zemlju","zemljo!","zemlji","zemljom"], pl:["zemlje","zemalja","zemljama","zemlje","zemlje!","zemljama","zemljama"] },
      sestra: { sg:["sestra","sestre","sestri","sestru","sestro!","sestri","sestrom"], pl:["sestre","sestara","sestrama","sestre","sestre!","sestrama","sestrama"] },
      rijeka: { sg:["rijeka","rijeke","rijeci","rijeku","rijeko!","rijeci","rijekom"],  pl:["rijeke","rijeka","rijekama","rijeke","rijeke!","rijekama","rijekama"] },
      ruka:   { sg:["ruka","ruke","ruci","ruku","ruko!","ruci","rukom"],              pl:["ruke","ruku","rukama","ruke","ruke!","rukama","rukama"] },
      noga:   { sg:["noga","noge","nozi","nogu","nogo!","nozi","nogom"],              pl:["noge","nogu","nogama","noge","noge!","nogama","nogama"] },
      knjiga: { sg:["knjiga","knjige","knjizi","knjigu","knjigo!","knjizi","knjigom"], pl:["knjige","knjiga","knjigama","knjige","knjige!","knjigama","knjigama"] },
      škola:  { sg:["škola","škole","školi","školu","školo!","školi","školom"],       pl:["škole","škola","školama","škole","škole!","školama","školama"] },
      ulica:  { sg:["ulica","ulice","ulici","ulicu","ulico!","ulici","ulicom"],       pl:["ulice","ulica","ulicama","ulice","ulice!","ulicama","ulicama"] },
      glava:  { sg:["glava","glave","glavi","glavu","glavo!","glavi","glavom"],       pl:["glave","glava","glavama","glave","glave!","glavama","glavama"] },
      kuća:   { sg:["kuća","kuće","kući","kuću","kućo!","kući","kućom"],             pl:["kuće","kuća","kućama","kuće","kuće!","kućama","kućama"] },
      mama:   { sg:["mama","mame","mami","mamu","mamo!","mami","mamom"],             pl:["mame","mama","mamama","mame","mame!","mamama","mamama"] },
      voda:   { sg:["voda","vode","vodi","vodu","vodo!","vodi","vodom"],             pl:["vode","voda","vodama","vode","vode!","vodama","vodama"] },
    };
    if (specialF[w]) return specialF[w];

    // Generic feminine -a
    const stem = w.endsWith("a") ? w.slice(0, -1) : w;
    return {
      sg: [w, stem+"e", stem+"i", stem+"u", stem+"o!", stem+"i", stem+"om"],
      pl: [stem+"e", stem+("a"), stem+"ama", stem+"e", stem+"e!", stem+"ama", stem+"ama"],
    };
  }

  if (noun.gender === "n") {
    const specialN = {
      more:   { sg:["more","mora","moru","more","more!","moru","morem"],   pl:["mora","mora","morima","mora","mora!","morima","morima"] },
      sunce:  { sg:["sunce","sunca","suncu","sunce","sunce!","suncu","suncem"], pl:["sunca","sunaca","suncima","sunca","sunca!","suncima","suncima"] },
      srce:   { sg:["srce","srca","srcu","srce","srce!","srcu","srcem"],   pl:["srca","srca","srcima","srca","srca!","srcima","srcima"] },
      voće:   { sg:["voće","voća","voću","voće","voće!","voću","voćem"],   pl:["voća","voća","voćima","voća","voća!","voćima","voćima"] },
      lice:   { sg:["lice","lica","licu","lice","lice!","licu","licem"],   pl:["lica","lica","licima","lica","lica!","licima","licima"] },
      polje:  { sg:["polje","polja","polju","polje","polje!","polju","poljem"], pl:["polja","polja","poljima","polja","polja!","poljima","poljima"] },
      ime:    { sg:["ime","imena","imenu","ime","ime!","imenu","imenom"],  pl:["imena","imena","imenima","imena","imena!","imenima","imenima"] },
    };
    if (specialN[w]) return specialN[w];

    // Neuter -e pattern
    if (w.endsWith("e") && !w.endsWith("je")) {
      const stem = w.slice(0, -1);
      return {
        sg: [w, stem+"a", stem+"u", w, w+"!", stem+"u", w+"m"],
        pl: [stem+"a", stem+"a", stem+"ima", stem+"a", stem+"a!", stem+"ima", stem+"ima"],
      };
    }

    // Neuter -o pattern (selo)
    const stem = w.endsWith("o") ? w.slice(0, -1) : w;
    return {
      sg: [w, stem+"a", stem+"u", w, w+"!", stem+"u", stem+"om"],
      pl: [stem+"a", stem+"a", stem+"ima", stem+"a", stem+"a!", stem+"ima", stem+"ima"],
    };
  }

  // Fallback
  return { sg: [w,w,w,w,w+"!",w,w], pl: [w,w,w,w,w+"!",w,w] };
}

// ─── Gender colours ───────────────────────────────────────────────────────────
const GENDER_COLOR = { m:"#1e40af", f:"#be185d", n:"#166534" };
const GENDER_BG    = { m:"#dbeafe", f:"#fdf2f8", n:"#dcfce7" };
const GENDER_LABEL = { m:"M", f:"F", n:"N" };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CaseTransformer({ goBack, award }) {
  const [phase, setPhase]       = useState("picker");   // "picker" | "declension" | "quiz"
  const [selectedNoun, setSelectedNoun] = useState(null);
  const [number, setNumber]     = useState("sg");       // "sg" | "pl"
  const [search, setSearch]     = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex]         = useState(0);
  const [quizScore, setQuizScore]         = useState(0);
  const [quizChosen, setQuizChosen]       = useState(null);
  const [quizDone, setQuizDone]           = useState(false);
  const [xpAwarded, setXpAwarded]         = useState(false);

  // Filtered noun list
  const filteredNouns = useMemo(() => {
    const q = search.toLowerCase().trim();
    return NOUN_LIBRARY.filter(n => {
      const matchGender = genderFilter === "all" || n.gender === genderFilter;
      const matchSearch = !q || n.hr.toLowerCase().includes(q) || n.en.toLowerCase().includes(q);
      return matchGender && matchSearch;
    });
  }, [search, genderFilter]);

  // Declined forms for selected noun
  const declined = useMemo(() => {
    if (!selectedNoun) return null;
    return declineNoun(selectedNoun);
  }, [selectedNoun]);

  // ── Noun picker ──────────────────────────────────────────────────────────────
  function pickNoun(noun) {
    setSelectedNoun(noun);
    setNumber("sg");
    setPhase("declension");
  }

  function backToPicker() {
    setPhase("picker");
    setSelectedNoun(null);
  }

  // ── Quiz builder ─────────────────────────────────────────────────────────────
  function startQuiz() {
    const forms = declineNoun(selectedNoun);
    const questions = CASE_INFO.map((c, i) => {
      const correct = forms.sg[i].replace("!", "");
      // Build 3 distractors from other case forms
      const others = forms.sg
        .filter((_, j) => j !== i)
        .map(f => f.replace("!", ""))
        .filter(f => f !== correct);
      // Deduplicate & pick 3
      const uniqueOthers = [...new Set(others)];
      while (uniqueOthers.length < 3) uniqueOthers.push(selectedNoun.hr);
      const distractors = uniqueOthers.slice(0, 3);
      const opts = shuffle([correct, ...distractors]);
      return { caseInfo: c, correct, opts, example: c.example.replace("[WORD]", "___") };
    });
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizChosen(null);
    setQuizDone(false);
    setXpAwarded(false);
    setPhase("quiz");
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function chooseAnswer(opt) {
    if (quizChosen !== null) return;
    const q = quizQuestions[quizIndex];
    setQuizChosen(opt);
    if (opt === q.correct) setQuizScore(s => s + 1);
  }

  function nextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(i => i + 1);
      setQuizChosen(null);
    } else {
      setQuizDone(true);
      if (!xpAwarded && award) {
        award(10);
        setXpAwarded(true);
      }
    }
  }

  // ── Render: Picker ────────────────────────────────────────────────────────────
  if (phase === "picker") {
    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes caseReveal {
            from { opacity: 0; transform: translateX(-12px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .ct-noun-card {
            background: var(--card);
            border: 1px solid var(--card-b);
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            transition: box-shadow .15s, transform .15s;
            text-align: left;
          }
          .ct-noun-card:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,.1);
            transform: translateY(-1px);
          }
          .ct-pill {
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid var(--card-b);
            background: var(--card);
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            color: var(--subtext);
            transition: background .15s, color .15s, border-color .15s;
          }
          .ct-pill.active {
            background: #0e7490;
            color: #fff;
            border-color: #0e7490;
          }
          .ct-badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: var(--text-xs);
            font-weight: 800;
            font-family: 'Outfit', sans-serif;
          }
        `}</style>

        {H("📐 Case Transformer", "See any Croatian noun in all 7 cases — singular and plural", goBack)}

        {/* Search bar */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nouns in Croatian or English…"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--card-b)",
              background: "var(--card)",
              color: "var(--heading)",
              fontSize: "var(--text-base)",
              fontFamily: "'Outfit', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Gender filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all","m","f","n"].map(g => (
            <button
              key={g}
              className={"ct-pill" + (genderFilter === g ? " active" : "")}
              onClick={() => setGenderFilter(g)}
            >
              {g === "all" ? "All" : g === "m" ? "Masculine" : g === "f" ? "Feminine" : "Neuter"}
            </button>
          ))}
        </div>

        {/* Noun grid */}
        {filteredNouns.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--subtext)", padding: "40px 0", fontSize: "var(--text-base)" }}>
            No nouns match your search.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}>
            {filteredNouns.map((noun) => (
              <button
                key={noun.hr}
                className="ct-noun-card"
                onClick={() => pickNoun(noun)}
              >
                <div style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 800,
                  color: "var(--heading)",
                  fontFamily: "'Outfit', sans-serif",
                  marginBottom: 3,
                }}>
                  {noun.hr}
                </div>
                <div style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--subtext)",
                  marginBottom: 6,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {noun.en}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <span
                    className="ct-badge"
                    style={{
                      background: GENDER_BG[noun.gender],
                      color: GENDER_COLOR[noun.gender],
                    }}
                  >
                    {GENDER_LABEL[noun.gender]}
                  </span>
                  {noun.irregular && (
                    <span
                      className="ct-badge"
                      style={{ background: "#fef9c3", color: "#854d0e" }}
                    >
                      irreg
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Render: Quiz ──────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    if (quizDone) {
      return (
        <div className="scr-wrap">
          <div className="c" style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "var(--heading)",
              fontFamily: "'Playfair Display', serif",
              marginBottom: 8,
            }}>
              Quiz Complete!
            </div>
            <div style={{ fontSize: "var(--text-base)", color: "var(--subtext)", marginBottom: 20 }}>
              You got {quizScore} / {quizQuestions.length} correct
            </div>
            {xpAwarded && (
              <div style={{
                display: "inline-block",
                background: "#fef9c3",
                color: "#854d0e",
                padding: "6px 16px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "var(--text-base)",
                marginBottom: 24,
              }}>
                +10 XP earned!
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="b bp" onClick={() => { setPhase("declension"); }}>
                ← Back to {selectedNoun.hr}
              </button>
              <button className="b bg" onClick={startQuiz}>
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    const q = quizQuestions[quizIndex];
    const ci = q.caseInfo;
    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes caseReveal {
            from { opacity: 0; transform: translateX(-12px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .ct-badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: var(--text-xs);
            font-weight: 800;
            font-family: 'Outfit', sans-serif;
          }
        `}</style>

        {/* Quiz header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setPhase("declension")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: "var(--subtext)",
              fontFamily: "'Outfit', sans-serif", padding: "4px 0",
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--heading)", fontFamily: "'Outfit', sans-serif" }}>
            🎯 Quiz — {selectedNoun.hr}
          </div>
          <span className="ct-badge" style={{ background: "#f3e8ff", color: "#6b21a8" }}>
            {quizIndex + 1} / {quizQuestions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: "var(--bar-bg)", borderRadius: 99, marginBottom: 24 }}>
          <div style={{
            height: 6,
            borderRadius: 99,
            background: ci.color,
            width: `${((quizIndex) / quizQuestions.length) * 100}%`,
            transition: "width .3s ease",
          }} />
        </div>

        {/* Case label */}
        <div className="c" style={{ borderLeft: `4px solid ${ci.color}`, marginBottom: 16, background: ci.bg }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
            <span className="ct-badge" style={{ background: ci.color, color: "#fff" }}>{ci.abbr}</span>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: ci.color, fontFamily: "'Outfit', sans-serif" }}>{ci.name}</span>
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif" }}>{ci.question}</div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
            {ci.use}
          </div>
          <div style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--heading)",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            marginBottom: 4,
          }}>
            "{q.example}"
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif" }}>
            Pick the correct <strong>{ci.name}</strong> form of <em>{selectedNoun.hr}</em>:
          </div>
        </div>

        {/* Answer options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {q.opts.map(opt => {
            let bg = "var(--card)";
            let border = "var(--card-b)";
            let color = "var(--heading)";
            if (quizChosen !== null) {
              if (opt === q.correct) { bg = "#dcfce7"; border = "#16a34a"; color = "#166534"; }
              else if (opt === quizChosen && opt !== q.correct) { bg = "#fee2e2"; border = "#ef4444"; color = "#991b1b"; }
            }
            return (
              <button
                key={opt}
                onClick={() => chooseAnswer(opt)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `2px solid ${border}`,
                  background: bg,
                  color,
                  fontSize: "var(--text-base)",
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: quizChosen !== null ? "default" : "pointer",
                  transition: "background .2s, border-color .2s",
                  textAlign: "left",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {quizChosen !== null && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              marginBottom: 14,
              fontSize: "var(--text-base)",
              fontWeight: 700,
              color: quizChosen === q.correct ? "#166534" : "#991b1b",
              fontFamily: "'Outfit', sans-serif",
            }}>
              {quizChosen === q.correct ? "✓ Correct!" : `✗ Correct answer: ${q.correct}`}
            </div>
            <button className="b bp" onClick={nextQuestion}>
              {quizIndex < quizQuestions.length - 1 ? "Next →" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Declension view ────────────────────────────────────────────────────
  const forms = declined[number]; // array of 7 forms

  return (
    <div className="scr-wrap">
      <style>{`
        @keyframes caseReveal {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ct-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: var(--text-xs);
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
        }
        .ct-case-card {
          opacity: 0;
          animation: caseReveal 0.4s ease forwards;
          background: var(--card);
          border: 1px solid var(--card-b);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 10px;
        }
        .ct-speak-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 2px 4px;
          border-radius: 6px;
          transition: background .15s;
          line-height: 1;
        }
        .ct-speak-btn:hover { background: rgba(0,0,0,.07); }
        .ct-toggle-pill {
          flex: 1;
          padding: 8px 0;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          transition: background .15s, color .15s;
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={backToPicker}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700, color: "var(--subtext)",
            fontFamily: "'Outfit', sans-serif", padding: "4px 0", whiteSpace: "nowrap",
          }}
        >
          ← All nouns
        </button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: "var(--text-xl)",
            fontWeight: 800,
            color: "var(--heading)",
            fontFamily: "'Playfair Display', serif",
          }}>
            {selectedNoun.hr}
          </span>
          <span
            className="ct-badge"
            style={{
              background: GENDER_BG[selectedNoun.gender],
              color: GENDER_COLOR[selectedNoun.gender],
            }}
          >
            {GENDER_LABEL[selectedNoun.gender]}
          </span>
          {selectedNoun.irregular && (
            <span className="ct-badge" style={{ background: "#fef9c3", color: "#854d0e" }}>
              irreg
            </span>
          )}
          <span className="ct-badge" style={{ background: "#f3e8ff", color: "#6b21a8" }}>B1</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif" }}>
            "{selectedNoun.en}"
          </span>
        </div>

        <button
          className="ct-speak-btn"
          onClick={() => speak(declined.sg[0].replace("!", ""))}
          title="Listen"
        >
          🔊
        </button>
      </div>

      {/* Singular / Plural toggle */}
      <div style={{
        display: "flex",
        background: "var(--bar-bg)",
        borderRadius: 999,
        padding: 3,
        marginBottom: 20,
        gap: 0,
      }}>
        {[["sg","Singular"],["pl","Plural"]].map(([val, label]) => (
          <button
            key={val}
            className="ct-toggle-pill"
            style={{
              background: number === val ? "#0e7490" : "transparent",
              color: number === val ? "#fff" : "var(--subtext)",
            }}
            onClick={() => setNumber(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 7 case cards */}
      {CASE_INFO.map((ci, i) => {
        const rawForm = forms[i] || "";
        const form = rawForm.replace("!", "");
        const exampleText = ci.example.replace("[WORD]", form);
        // Build highlighted sentence: bold the form in its color
        const parts = exampleText.split(form);

        return (
          <div
            key={ci.abbr}
            className="ct-case-card"
            style={{
              borderLeft: `4px solid ${ci.color}`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Row 1: abbr + case name + question */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}>
              <span
                className="ct-badge"
                style={{ background: ci.color, color: "#fff" }}
              >
                {ci.abbr}
              </span>
              <span style={{
                fontSize: "var(--text-base)",
                fontWeight: 800,
                color: "var(--heading)",
                fontFamily: "'Outfit', sans-serif",
              }}>
                {ci.name}
              </span>
              <span style={{
                fontSize: "var(--text-xs)",
                color: "var(--subtext)",
                fontFamily: "'Outfit', sans-serif",
                marginLeft: "auto",
              }}>
                {ci.question}
              </span>
            </div>

            {/* Row 2: declined form + speak */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              paddingBottom: 10,
              borderBottom: `1px solid ${ci.bg}`,
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: "var(--text-xl)",
                fontWeight: 800,
                color: ci.color,
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: "-.01em",
              }}>
                {form}
              </span>
              <button
                className="ct-speak-btn"
                onClick={() => speak(form)}
                title={`Listen to "${form}"`}
              >
                🔊
              </button>
            </div>

            {/* Row 3: use + example */}
            <div style={{
              fontSize: "var(--text-xs)",
              color: "var(--subtext)",
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 5,
            }}>
              {ci.use}
            </div>
            <div style={{
              fontSize: "var(--text-xs)",
              fontStyle: "italic",
              color: "var(--subtext)",
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1.5,
            }}>
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <strong style={{ color: ci.color, fontStyle: "normal" }}>{form}</strong>
                  {parts.slice(1).join(form)}
                </>
              ) : (
                exampleText
              )}
            </div>
          </div>
        );
      })}

      {/* Quiz Me button */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          className="b bp"
          style={{ fontSize: 15, padding: "12px 28px" }}
          onClick={startQuiz}
        >
          🎯 Quiz Me On This
        </button>
        <div style={{
          marginTop: 8,
          fontSize: "var(--text-xs)",
          color: "var(--subtext)",
          fontFamily: "'Outfit', sans-serif",
        }}>
          7 questions • Earn +10 XP on completion
        </div>
      </div>
    </div>
  );
}
