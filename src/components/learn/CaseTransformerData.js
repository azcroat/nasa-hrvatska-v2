// ─── Noun Library ─────────────────────────────────────────────────────────────
export const NOUN_LIBRARY = [
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

// ─── Case Metadata ─────────────────────────────────────────────────────────────
export const CASE_INFO = [
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
export function declineNoun(noun) {
  if (noun.irregular && IRREGULAR_FORMS[noun.hr]) {
    return IRREGULAR_FORMS[noun.hr];
  }

  const w = noun.hr;

  if (noun.gender === "m") {
    if (noun.type === "animate") {
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
      // Masculine inanimate pattern
      const specialM = {
        grad:   { sg:["grad","grada","gradu","grad","grade!","gradu","gradom"],   pl:["gradovi","gradova","gradovima","gradove","gradovi!","gradovima","gradovima"] },
        auto:   { sg:["auto","auta","autu","auto","auto!","autu","autom"],         pl:["auti","auta","autima","aute","auti!","autima","autima"] },
        prozor: { sg:["prozor","prozora","prozoru","prozor","prozore!","prozoru","prozorom"], pl:["prozori","prozora","prozorima","prozore","prozori!","prozorima","prozorima"] },
        jezik:  { sg:["jezik","jezika","jeziku","jezik","jeziku!","jeziku","jezikom"],        pl:["jezici","jezika","jezicima","jezike","jezici!","jezicima","jezicima"] },
        dan:    { sg:["dan","dana","danu","dan","dane!","danu","danom"],           pl:["dani","dana","danima","dane","dani!","danima","danima"] },
        put:    { sg:["put","puta","putu","put","pute!","putu","putom"],           pl:["putovi","putova","putovima","putove","putovi!","putovima","putovima"] },
      };
      if (specialM[w]) return specialM[w];

      const s = w;
      return {
        sg: [s, s+"a", s+"u", s, s+"e!", s+"u", s+"om"],
        pl: [s+"ovi", s+"ova", s+"ovima", s+"ove", s+"ovi!", s+"ovima", s+"ovima"],
      };
    }
  }

  if (noun.gender === "f") {
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

    if (w.endsWith("e") && !w.endsWith("je")) {
      const stem = w.slice(0, -1);
      return {
        sg: [w, stem+"a", stem+"u", w, w+"!", stem+"u", w+"m"],
        pl: [stem+"a", stem+"a", stem+"ima", stem+"a", stem+"a!", stem+"ima", stem+"ima"],
      };
    }

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
export const GENDER_COLOR = { m:"#1e40af", f:"#be185d", n:"#166534" };
export const GENDER_BG    = { m:"#dbeafe", f:"#fdf2f8", n:"#dcfce7" };
export const GENDER_LABEL = { m:"M", f:"F", n:"N" };

// ─── Shared CSS injected into each phase render ───────────────────────────────
export const CT_STYLES = `
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
`;
