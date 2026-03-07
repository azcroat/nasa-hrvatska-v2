import React, { useState, useEffect, useRef } from 'react';
import { speak } from '../../data.jsx';

// ── Scenarios ───────────────────────────────────────────────────────────────
const SCENARIOS = [
  // ── ERRANDS ────────────────────────────────────────────────────────────────
  { id:"cafe",       cat:"Errands", icon:"☕", title:"At a Café",           hr:"U kafiću",              desc:"Order coffee, chat with the barista",            levels:["A1","A2","B1"], color:"#92400e", bg:"#fffbeb",
    aiName:"Marija",        aiRole:"barista at a popular Zagreb café",
    context:"You are Marija, a friendly and chatty barista at a popular Zagreb café. A customer is trying to order and chat in Croatian. Start by greeting them and asking what they'd like." },
  { id:"market",     cat:"Errands", icon:"🛒", title:"At the Market",       hr:"Na tržnici",            desc:"Buy fresh produce, ask prices, haggle",          levels:["A1","A2","B1"], color:"#166534", bg:"#f0fdf4",
    aiName:"Ivan",          aiRole:"market vendor at the Split open-air market (pazar)",
    context:"You are Ivan, a proud Dalmatian market vendor at the Split pazar selling the freshest fruits, vegetables, and cheese. Warmly greet the customer and show off today's best products." },
  { id:"bakery",     cat:"Errands", icon:"🥐", title:"At the Bakery",       hr:"U pekari",              desc:"Buy bread, pastries, burek — a Croatian staple", levels:["A1","A2"],      color:"#b45309", bg:"#fffbeb",
    aiName:"Katica",        aiRole:"cheerful bakery worker at a neighborhood pekara",
    context:"You are Katica, running the counter at a busy neighborhood pekara (bakery). You sell kruh, burek, kroasani, and various pastries. Greet the customer warmly and ask what they need." },
  { id:"grocery",    cat:"Errands", icon:"🧺", title:"Grocery Shopping",    hr:"U supermarketu",        desc:"Find items, ask for help, check out",            levels:["A1","A2","B1"], color:"#15803d", bg:"#f0fdf4",
    aiName:"Mirna",         aiRole:"helpful supermarket assistant at Konzum",
    context:"You are Mirna, a helpful assistant at a Konzum supermarket. A customer needs help finding items and navigating the store. Be friendly and guide them in simple Croatian." },
  { id:"pharmacy",   cat:"Errands", icon:"💊", title:"At the Pharmacy",     hr:"U ljekarni",            desc:"Explain symptoms, buy medicine, ask dosage",     levels:["A2","B1"],      color:"#0891b2", bg:"#ecfeff",
    aiName:"Ljekarnica Vesna", aiRole:"pharmacist at a Croatian ljekarna",
    context:"You are Vesna, a knowledgeable and caring pharmacist. A foreign customer comes in with mild symptoms. Help them find the right medicine, explain dosage, and ask follow-up questions." },
  { id:"postoffice", cat:"Errands", icon:"📬", title:"At the Post Office",  hr:"Na pošti",              desc:"Send a package, buy stamps, fill in forms",      levels:["A2","B1"],      color:"#6d28d9", bg:"#faf5ff",
    aiName:"Sluzbenik Pero", aiRole:"post office clerk at the HPT (Hrvatska pošta)",
    context:"You are Pero, a slightly impatient but ultimately helpful post office clerk at the Hrvatska pošta. A customer wants to send a package. Walk them through the process." },
  { id:"bus",        cat:"Errands", icon:"🚌", title:"Bus Station",         hr:"Na autobusnom kolodvoru", desc:"Buy a ticket, check the timetable, find a bus", levels:["A1","A2","B1"], color:"#0369a1", bg:"#f0f9ff",
    aiName:"Blagajnica Iva", aiRole:"ticket clerk at the Zagreb bus station (Autobusni kolodvor)",
    context:"You are Iva, working the ticket window at Zagreb's main bus station. A traveler wants to get to Split. Help them buy a ticket, check departure times, and find the right platform." },
  { id:"clothes",    cat:"Errands", icon:"👗", title:"Clothes Shopping",    hr:"Kupovina odjeće",       desc:"Ask for sizes, try things on, negotiate prices", levels:["A2","B1"],      color:"#be185d", bg:"#fdf2f8",
    aiName:"Prodavačica Nina", aiRole:"shop assistant at a Croatian clothing boutique",
    context:"You are Nina, a stylish and helpful shop assistant at a clothing boutique in a Zagreb shopping mall. A customer is looking for something specific. Help them find the right size and style." },
  { id:"petrol",     cat:"Errands", icon:"⛽", title:"At the Petrol Station", hr:"Na benzinskoj",       desc:"Fill up, pay, ask for directions while there",   levels:["A1","A2"],      color:"#1d4ed8", bg:"#eff6ff",
    aiName:"Radnik Krešo",  aiRole:"petrol station attendant",
    context:"You are Krešo, working at an INA petrol station. A customer pulls up needing petrol, perhaps a car wash, and maybe directions. Be direct and efficient but friendly." },
  { id:"simcard",    cat:"Errands", icon:"📱", title:"Getting a SIM Card",  hr:"Kupnja SIM kartice",   desc:"Choose a plan, set up your Croatian number",    levels:["B1","B2"],      color:"#7c3aed", bg:"#faf5ff",
    aiName:"Prodavač Dino", aiRole:"sales rep at a Croatian Telekom (HT) or A1 shop",
    context:"You are Dino, an energetic sales rep at a Croatian mobile phone shop. A foreigner wants to buy a prepaid SIM and maybe a local plan. Explain the options and help them get connected." },

  // ── OUT & ABOUT ────────────────────────────────────────────────────────────
  { id:"directions", cat:"Out & About", icon:"🗺️", title:"Asking Directions", hr:"Traženje puta",      desc:"Navigate the city — streets, buses, landmarks", levels:["A2","B1"],      color:"#0284c7", bg:"#f0f9ff",
    aiName:"Stjepan",       aiRole:"helpful local man on the street",
    context:"You are Stjepan, a helpful local who knows the streets well and is happy to give clear directions to someone who is lost in the city. You enjoy helping foreigners." },
  { id:"restaurant", cat:"Out & About", icon:"🍽️", title:"Restaurant Dinner",  hr:"Večera u restoranu", desc:"Order, ask about local dishes, compliment food",levels:["A2","B1","B2"], color:"#d97706", bg:"#fffbeb",
    aiName:"Konobar Luka",  aiRole:"attentive waiter at a respected Croatian restaurant",
    context:"You are Luka, an experienced and proud waiter at a respected Croatian restaurant. You know every dish on the menu, its origin, and what wine pairs best. Start by welcoming the guests." },
  { id:"konoba",     cat:"Out & About", icon:"🐟", title:"At a Konoba",         hr:"U konobi",            desc:"Traditional Dalmatian tavern — fish, wine, stories", levels:["B1","B2"],  color:"#0e7490", bg:"#ecfeff",
    aiName:"Vlasnik Ante",  aiRole:"owner of a traditional Dalmatian konoba",
    context:"You are Ante, the proud third-generation owner of a small konoba on the Dalmatian coast. You serve traditional food — prstaci, crni rižot, peka — and have many stories about the sea and life on the coast." },
  { id:"beach",      cat:"Out & About", icon:"🏖️", title:"At the Beach",        hr:"Na plaži",            desc:"Chat with fellow beachgoers, rent equipment",   levels:["A2","B1"],      color:"#0891b2", bg:"#ecfeff",
    aiName:"Susjed Željko", aiRole:"friendly beachgoer relaxing on a Croatian beach",
    context:"You are Željko, a relaxed Dalmatian who comes to this beach every summer. You're happy to chat with new arrivals, share local swimming tips, and recommend the best konoba nearby." },
  { id:"tourist",    cat:"Out & About", icon:"🏛️", title:"Tourist Info Office", hr:"Turistički ured",    desc:"Ask about sights, tours, local events",          levels:["A1","A2","B1"], color:"#166534", bg:"#f0fdf4",
    aiName:"Vodič Maja",    aiRole:"tourist information officer",
    context:"You are Maja, a knowledgeable and enthusiastic tourist information officer. A visitor wants to know the best things to see and do. Give genuine local recommendations." },
  { id:"taxi",       cat:"Out & About", icon:"🚕", title:"In a Taxi",           hr:"U taksiju",           desc:"Tell the driver where to go, make small talk",   levels:["A2","B1","B2"], color:"#ca8a04", bg:"#fefce8",
    aiName:"Taksist Mirko", aiRole:"chatty taxi driver who loves football and politics",
    context:"You are Mirko, a Zagreb taxi driver who has strong opinions about Dinamo Zagreb, local politics, and the traffic. You love chatting with passengers and asking where they're from." },
  { id:"hotel",      cat:"Out & About", icon:"🏨", title:"Hotel Check-in",       hr:"Prijava u hotel",    desc:"Check in, ask about facilities, resolve issues",  levels:["A2","B1"],      color:"#0369a1", bg:"#eff6ff",
    aiName:"Recepcionar Filip", aiRole:"receptionist at a 3-star Croatian hotel",
    context:"You are Filip at the hotel reception. A guest is checking in. Walk them through the process, explain the facilities, breakfast times, and parking. Be professional but warm." },
  { id:"icecream",   cat:"Out & About", icon:"🍦", title:"Ice Cream Shop",       hr:"U sladoledarni",     desc:"Order sladoled, chat about flavours and summer",  levels:["A1","A2"],      color:"#ec4899", bg:"#fdf2f8",
    aiName:"Sladoledarka Tea", aiRole:"ice cream seller at a Croatian sladoledarna",
    context:"You are Tea, cheerfully serving sladoled on a hot summer afternoon in Dubrovnik. You have dozens of flavours and love hearing which ones foreigners pick. Engage them in simple, friendly Croatian." },
  { id:"museum",     cat:"Out & About", icon:"🏺", title:"At the Museum",        hr:"U muzeju",            desc:"Ask about exhibits, Croatian history and art",   levels:["B1","B2"],      color:"#78716c", bg:"#fafaf9",
    aiName:"Muzejska voditeljica Klara", aiRole:"museum guide at a Croatian history museum",
    context:"You are Klara, a passionate museum guide at the Museum of Croatian History. You love sharing stories about the exhibits and asking visitors what interests them most about Croatia." },
  { id:"hairdresser",cat:"Out & About", icon:"✂️", title:"At the Hairdresser",  hr:"Kod frizera",        desc:"Describe the haircut you want, make small talk",  levels:["A2","B1"],      color:"#9333ea", bg:"#faf5ff",
    aiName:"Frizerica Sandra", aiRole:"hairdresser at a neighborhood salon",
    context:"You are Sandra, running your own small hair salon. A new client sits in your chair. Ask them what they'd like, offer your professional opinion, and keep the conversation going." },

  // ── SOCIAL LIFE ────────────────────────────────────────────────────────────
  { id:"neighbor",   cat:"Social", icon:"🏠", title:"Meet Your Neighbor",   hr:"Upoznavanje susjeda",  desc:"Small talk, local tips, neighbourhood life",     levels:["A2","B1","B2"], color:"#0369a1", bg:"#f0f9ff",
    aiName:"Susjeda Ana",   aiRole:"warm Croatian neighbor in Labin, Istria",
    context:"You are Ana, a warm and curious neighbor in a small apartment building in Labin, Istria. A new family from abroad has just moved in and you're eager to welcome them." },
  { id:"party",      cat:"Social", icon:"🎉", title:"Dinner Party",         hr:"Večera u društvu",     desc:"Meet new people, discuss life, Croatia, plans",  levels:["B1","B2","C1"],  color:"#0e7490", bg:"#f0f9ff",
    aiName:"Tomislav",      aiRole:"well-traveled Croatian professional at a dinner party",
    context:"You are Tomislav, a curious and well-spoken Croatian at a dinner party. You are genuinely interested in the foreign family who has recently moved to Croatia and ask thoughtful questions." },
  { id:"birthday",   cat:"Social", icon:"🎂", title:"Birthday Party",       hr:"Proslava rođendana",   desc:"Toast, give wishes, mingle with the family",     levels:["A2","B1"],      color:"#f97316", bg:"#fff7ed",
    aiName:"Domaćin Josip", aiRole:"cheerful Croatian hosting a family birthday party",
    context:"You are Josip, hosting your child's birthday party. Lots of relatives are around and you're welcoming a foreign friend who has come. Toast, make them feel welcome, and introduce them to the family." },
  { id:"familydinner",cat:"Social",icon:"👨‍👩‍👧‍👦",title:"Guest at Croatian Home",hr:"U gostima",         desc:"Be a dinner guest — eat, compliment, converse",  levels:["B1","B2"],      color:"#16a34a", bg:"#f0fdf4",
    aiName:"Domaćica Mara", aiRole:"Croatian grandmother hosting Sunday lunch",
    context:"You are Mara, a classic Croatian grandmother who has cooked a feast for Sunday lunch. Your guest is a foreigner. You insist they eat more, ask about their life, and share family stories." },
  { id:"wedding",    cat:"Social", icon:"💒", title:"Croatian Wedding",      hr:"Hrvatska svadba",      desc:"Congratulate the couple, dance, chat with guests", levels:["B1","B2","C1"], color:"#be185d", bg:"#fdf2f8",
    aiName:"Gost Branko",   aiRole:"jovial Croatian wedding guest and distant relative",
    context:"You are Branko, a distant relative at a Croatian wedding. You're full of energy, love to dance the kolo, and enjoy a good rakija toast. Chat with foreign guests warmly about Croatia and weddings." },
  { id:"football",   cat:"Social", icon:"⚽", title:"Football with Fans",   hr:"Gledanje utakmice",   desc:"Discuss Hajduk, Dinamo, the national team",      levels:["B1","B2","C1"],  color:"#dc2626", bg:"#fef2f2",
    aiName:"Navijač Goran", aiRole:"passionate Hajduk Split supporter watching a match",
    context:"You are Goran, an incredibly passionate Hajduk Split supporter. You're watching the big match and next to you sits a foreigner who seems interested. Explain the game, the rivalry, and your love of football." },
  { id:"gym",        cat:"Social", icon:"🏋️", title:"At the Gym",           hr:"U teretani",           desc:"Ask about machines, get tips, motivate each other", levels:["A2","B1"],    color:"#4f46e5", bg:"#eef2ff",
    aiName:"Trener Luka",   aiRole:"personal trainer at a Croatian gym",
    context:"You are Luka, a friendly and motivated personal trainer at a gym in Rijeka. A new member has just joined and needs orientation. Show them around, ask about their goals, and give workout advice." },
  { id:"kafic",      cat:"Social", icon:"🍺", title:"At a Croatian Bar",     hr:"U kafiću s prijateljem", desc:"Unwind, order drinks, talk about life",        levels:["B1","B2"],      color:"#92400e", bg:"#fffbeb",
    aiName:"Prijatelj Matej","aiRole":"Croatian friend you're catching up with at a kafić",
    context:"You are Matej, a good Croatian friend catching up with someone at a neighbourhood kafić over beers. Ask what they've been up to, share your own news, and plan something for the weekend." },
  { id:"weekend",    cat:"Social", icon:"📅", title:"Planning the Weekend",  hr:"Planiranje vikenda",   desc:"Suggest activities, discuss the weather, make plans", levels:["A2","B1"],    color:"#0891b2", bg:"#ecfeff",
    aiName:"Prijateljica Nika", aiRole:"active Croatian friend planning a weekend trip",
    context:"You are Nika, an outdoorsy Croatian who loves hiking, beaches, and festivals. You're discussing weekend plans with a friend. Suggest local activities and ask what they're in the mood for." },
  { id:"music",      cat:"Social", icon:"🎵", title:"Discussing Croatian Music", hr:"O glazbi",         desc:"Klapa, turbofolk, Oliver Dragojević, festivals",  levels:["B2","C1"],      color:"#7c3aed", bg:"#faf5ff",
    aiName:"Glazbenik Roko", aiRole:"musician and passionate fan of Croatian music",
    context:"You are Roko, a musician from Dalmatia with deep knowledge of klapa singing, Dalmatian music, and the broader Croatian music scene. Discuss music enthusiastically and perhaps sing a phrase or two." },

  // ── PRACTICAL LIFE ─────────────────────────────────────────────────────────
  { id:"school",     cat:"Practical", icon:"🏫", title:"School Meeting",     hr:"Susret s učiteljicom", desc:"Talk with your child's classroom teacher",       levels:["B1","B2"],      color:"#7c3aed", bg:"#faf5ff",
    aiName:"Učiteljica Petra", aiRole:"primary school teacher",
    context:"You are Učiteljica Petra, a warm and patient Croatian primary school teacher meeting a parent for a routine check-in about their child's progress and integration into the class." },
  { id:"doctor",     cat:"Practical", icon:"🏥", title:"At the Doctor",      hr:"Kod liječnika",        desc:"Describe symptoms, get advice, understand the Rx", levels:["B1","B2"],    color:"#dc2626", bg:"#fef2f2",
    aiName:"Dr. Kovač",     aiRole:"Croatian general practitioner (liječnik opće prakse)",
    context:"You are Dr. Kovač, a patient and helpful Croatian GP at a local dom zdravlja (health center). The patient is a foreigner still learning Croatian. Be professional but accessible." },
  { id:"dentist",    cat:"Practical", icon:"🦷", title:"At the Dentist",     hr:"Kod stomatologa",      desc:"Describe tooth pain, understand the procedure",  levels:["B1","B2"],      color:"#0891b2", bg:"#ecfeff",
    aiName:"Dr. Marić",     aiRole:"Croatian dentist",
    context:"You are Dr. Marić, a calm and reassuring dentist. A patient comes in with tooth pain. Ask about their symptoms, explain the treatment needed in simple terms, and keep them calm." },
  { id:"bank",       cat:"Practical", icon:"🏦", title:"At the Bank",        hr:"U banci",              desc:"Open an account, exchange money, ask about cards", levels:["B1","B2"],     color:"#1d4ed8", bg:"#eff6ff",
    aiName:"Bankar Dominik", aiRole:"bank employee at a Croatian commercial bank (Erste, Zaba, PBZ)",
    context:"You are Dominik, a professional bank employee. A foreigner wants to open a bank account in Croatia. Walk them through the requirements, ask for documents, and explain the process clearly." },
  { id:"apartment",  cat:"Practical", icon:"🏢", title:"Apartment Viewing",  hr:"Razgledavanje stana",  desc:"Ask about rent, utilities, neighborhood, terms", levels:["B1","B2"],      color:"#0369a1", bg:"#eff6ff",
    aiName:"Agent Zvonimir", aiRole:"real estate agent showing an apartment",
    context:"You are Zvonimir, a real estate agent (agencija za nekretnine) showing a rental apartment. Highlight the positives, answer honest questions about the neighbourhood, utilities, and lease terms." },
  { id:"vet",        cat:"Practical", icon:"🐕", title:"At the Vet",         hr:"Kod veterinara",       desc:"Describe your pet's symptoms, understand advice", levels:["B1","B2"],     color:"#15803d", bg:"#f0fdf4",
    aiName:"Veterinar Mislav", aiRole:"friendly veterinarian",
    context:"You are Mislav, a kind veterinarian. A pet owner brings in their dog or cat with some concerns. Ask about symptoms, examine (in conversation), explain what might be wrong and what to do." },
  { id:"mup",        cat:"Practical", icon:"🏛️", title:"Government Office",  hr:"U gradskom uredu",     desc:"Register residence, sort paperwork in Croatian",  levels:["B2","C1"],     color:"#64748b", bg:"#f8fafc",
    aiName:"Sluzbenik Zdravko", aiRole:"government clerk at the local MUP (police admin / registration office)",
    context:"You are Zdravko, a by-the-book but not unkind government clerk. A foreigner needs to register their residence (prijava boravišta) or apply for a document. Walk them through the bureaucratic process." },
  { id:"complaint",  cat:"Practical", icon:"😤", title:"Hotel Complaint",    hr:"Prigovor u hotelu",    desc:"Complain politely but firmly, resolve the issue", levels:["B1","B2","C1"], color:"#dc2626", bg:"#fef2f2",
    aiName:"Upravitelj Sandro", aiRole:"hotel manager handling a guest complaint",
    context:"You are Sandro, the hotel manager. A guest is unhappy — perhaps the room was noisy, there was no hot water, or the booking was mixed up. Listen, apologize appropriately, and try to resolve it." },

  // ── CROATIAN CULTURE ───────────────────────────────────────────────────────
  { id:"history",    cat:"Culture", icon:"🏰", title:"Croatian History",    hr:"Hrvatska povijest",    desc:"Discuss the Homeland War, medieval kings, heritage", levels:["B2","C1","C2"],color:"#92400e", bg:"#fffbeb",
    aiName:"Povjesničar Kruno", aiRole:"Croatian historian and proud patriot",
    context:"You are Kruno, a historian at the University of Zagreb who is passionate about Croatian history — from the medieval kingdom to the Homeland War. Discuss with depth and pride." },
  { id:"wine",       cat:"Culture", icon:"🍷", title:"Istrian Wine Tasting", hr:"Kušanje istarskih vina", desc:"Learn about Croatian wines, terroir, grape varieties", levels:["B2","C1"], color:"#9f1239", bg:"#fff1f2",
    aiName:"Vinar Moreno",  aiRole:"winemaker at a family vinery in Istria",
    context:"You are Moreno, a third-generation winemaker in Istria producing Malvazija and Teran wines. Guide a visitor through a tasting, explain the terroir, and share the story of your vinery." },
  { id:"cuisine",    cat:"Culture", icon:"🍖", title:"Croatian Cuisine",    hr:"Hrvatska kuhinja",     desc:"Discuss regional dishes, recipes, food culture",  levels:["B1","B2"],      color:"#ea580c", bg:"#fff7ed",
    aiName:"Kuharica Dubravka", aiRole:"passionate home cook and food writer",
    context:"You are Dubravka, a food writer and passionate Croatian cook who can speak for hours about peka, prstaci, fritule, and regional differences between Dalmatian, Slavonian, and Istrian food." },
  { id:"roadtrip",   cat:"Culture", icon:"🚗", title:"Road Trip Planning",  hr:"Planiranje putovanja",  desc:"Plan a coastal drive — islands, ferries, stops", levels:["B1","B2"],      color:"#0891b2", bg:"#ecfeff",
    aiName:"Lokalni Stipe",  aiRole:"experienced local giving road trip advice",
    context:"You are Stipe, a Dalmatian who knows every backroad, hidden beach, and best-value konoba from Rijeka to Dubrovnik. Help a visitor plan their road trip with genuine insider tips." },
  { id:"domovinskirat",cat:"Culture",icon:"🕯️",title:"Homeland War Conversation",hr:"O Domovinskom ratu", desc:"Respectful discussion of Croatia's independence war", levels:["C1","C2"],  color:"#1e3a5f", bg:"#f0f4f8",
    aiName:"Branitelj Miroslav", aiRole:"Croatian war veteran willing to share his experience",
    context:"You are Miroslav, a Croatian veteran of the 1991-1995 Homeland War (Domovinski rat). You are willing to speak about your experience with dignity and pride, though some memories are heavy. Engage in respectful conversation." },
  { id:"klapa",      cat:"Culture", icon:"🎶", title:"Dalmatian Klapa",     hr:"Klapa i tradicija",    desc:"Dalmatian a cappella music, tradition, songs",    levels:["B2","C1"],      color:"#0e7490", bg:"#ecfeff",
    aiName:"Član klape Jozo", aiRole:"member of a traditional Dalmatian klapa singing group",
    context:"You are Jozo, a proud member of a klapa — a traditional Dalmatian a cappella choir. Share the history of klapa singing, its UNESCO heritage status, favourite songs, and invite the learner to try a phrase." },
  { id:"folklore",   cat:"Culture", icon:"🪗", title:"Folk Festival",        hr:"Folklorna priredba",   desc:"Traditional costumes, dances, regional culture",  levels:["B1","B2"],      color:"#b45309", bg:"#fffbeb",
    aiName:"Voditeljica Ankica", aiRole:"folk dance coordinator at a regional Croatian folklore festival",
    context:"You are Ankica, coordinating a traditional folklore event. Explain the regional costumes (nošnje), the dances (kolo), and the significance of this tradition to Croatian identity." },

  // ── PROFESSIONAL ───────────────────────────────────────────────────────────
  { id:"jobinterview",cat:"Professional",icon:"💼",title:"Job Interview",    hr:"Razgovor za posao",   desc:"Introduce yourself, discuss experience and goals", levels:["B2","C1","C2"], color:"#1d4ed8", bg:"#eff6ff",
    aiName:"Direktor Stipan", aiRole:"HR manager at a Croatian company conducting a job interview",
    context:"You are Stipan, an HR manager at a medium-sized Croatian company. You are conducting a job interview for a position. Ask about the candidate's background, skills, and why they want to work in Croatia." },
  { id:"bizmeeting",  cat:"Professional",icon:"🤝",title:"Business Meeting", hr:"Poslovni sastanak",   desc:"Discuss a project, negotiate, reach agreement",   levels:["C1","C2"],      color:"#0369a1", bg:"#eff6ff",
    aiName:"Poslovni partner Vlado", aiRole:"Croatian business partner in a formal meeting",
    context:"You are Vlado, a Croatian business executive in a formal meeting. Discuss a proposed collaboration or contract professionally. Use formal register (Vi form throughout)." },
  { id:"realestate",  cat:"Professional",icon:"🏗️",title:"Real Estate Deal",  hr:"Kupnja nekretnine",  desc:"Negotiate property purchase — legal, financial",  levels:["C1","C2"],      color:"#78716c", bg:"#fafaf9",
    aiName:"Odvjetnik Toni",aiRole:"Croatian real estate lawyer explaining a property purchase",
    context:"You are Toni, a Croatian real estate attorney walking a foreign buyer through the process of purchasing property in Croatia. Explain the legal steps, taxes (porez na promet nekretnina), and requirements." },
  { id:"newsinterview",cat:"Professional",icon:"📰",title:"News Interview",  hr:"Intervju za medije",  desc:"Answer journalist questions fluently and clearly",  levels:["C1","C2"],      color:"#dc2626", bg:"#fef2f2",
    aiName:"Novinarka Katarina", aiRole:"Croatian journalist conducting a news interview",
    context:"You are Katarina, a sharp journalist for HRT (Croatian Radio-Television) conducting a live interview. Ask probing, professional questions about the person's life, work, and views on Croatia." },
  { id:"philosophy",  cat:"Professional",icon:"🧠",title:"Philosophical Debate",hr:"Filozofski razgovor",desc:"Discuss ideas — identity, freedom, belonging",  levels:["C1","C2"],      color:"#4f46e5", bg:"#eef2ff",
    aiName:"Profesor Neven",aiRole:"philosophy professor at the University of Split",
    context:"You are Neven, a philosophy professor who loves exploring ideas about identity, national belonging, freedom, and the meaning of home. Engage in a rich, intellectually stimulating conversation in native-level Croatian." },
];

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const CATS = ["All","Errands","Out & About","Social","Practical","Culture","Professional"];
const CAT_ICONS = { All:"🌐", Errands:"🛍️", "Out & About":"🌊", Social:"👨‍👩‍👧", Practical:"🏥", Culture:"🏛️", Professional:"💼" };

// Maps exercise keys → display labels (used in evaluation focus areas)
const EXERCISE_MAP = {
  akudrill:"🍽️ Accusative Case",  tenseflip:"⏳ Tense Flip",     verbdrill:"💪 Verb Drill",
  negation:"❌ Negation",          possess:"👤 Possessives",       ordinals:"🏢 Ordinals",
  relpron:"🔗 Koji/Koja/Koje",    emogender:"😀 Emotion Gender",  comparatives:"📈 Comparatives",
  future:"🚀 Future Tense",        sibil:"🔄 k→c/g→z",            prepdrill:"📍 Prepositions",
  numtime:"🔢 Numbers & Time",     profgender:"👨‍⚖️ Job Genders", reflexive:"🧲 SE Verbs",
  sentbuild:"🏗️ Sentence Builder", genderdrill:"♂️♀️ Gender Drill",
};

// ── System prompts ────────────────────────────────────────────────────────────
function buildConvoPrompt(scenario, level) {
  const complexity = {
    A1: "Use ONLY simple present tense. Maximum 1-2 very short sentences. Very basic, high-frequency vocabulary only.",
    A2: "Use present tense primarily. 2 short sentences. Common everyday vocabulary.",
    B1: "Use present, past (perfective), and near-future naturally. 2-3 sentences. Conversational vocabulary.",
    B2: "Speak naturally and fluently. 3-4 sentences. You may use idioms, participles, and varied tenses.",
    C1: "Speak exactly as you would to a native speaker. Rich vocabulary, idioms, subordinate clauses, all tenses.",
    C2: "Full native speaker register. Regional expressions, idiomatic speech, cultural references are welcome.",
  };
  return `You are ${scenario.aiName}, a native Croatian speaker. Role: ${scenario.aiRole}.
${scenario.context}

THE LEARNER IS AT LEVEL: ${level}
Language rules for YOU:
- ${complexity[level] || complexity["B1"]}
- ALWAYS respond entirely in Croatian. Never switch to English in your replies.
- If the learner writes in English, respond in Croatian and gently add: (Pokušaj na hrvatskom! — Try in Croatian!)
- If the learner makes a grammar error, seamlessly use the correct form in your next sentence without commenting on the error.
- Be warm, in-character, and always end with a natural follow-up question to keep the conversation flowing.
- Stay completely in character. Do not explain grammar or break the fourth wall.`;
}

function buildEvalPrompt(scenario, level) {
  return `You are an expert Croatian language teacher and applied linguist. Analyze the conversation below between a ${level} learner and an AI partner in the scenario: "${scenario.title}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just JSON):
{
  "score": <integer 0-100>,
  "level_demonstrated": "<A1|A2|B1|B2|C1|C2>",
  "strengths": ["<specific positive observation>", "<another strength>"],
  "mistakes": [
    {"original": "<exact learner phrase with error>", "correction": "<corrected form>", "rule": "<brief grammar rule, e.g. 'Accusative of masculine nouns drops -ić'>" }
  ],
  "focus_areas": [
    {"topic": "<grammar or vocab topic>", "explanation": "<1 sentence on why this is the priority>", "exercise": "<one key from: akudrill,tenseflip,verbdrill,negation,possess,ordinals,relpron,emogender,comparatives,future,sibil,prepdrill,numtime,profgender,reflexive,sentbuild,genderdrill>"}
  ],
  "vocabulary_feedback": "<1-2 sentences on vocabulary range and variety>",
  "encouragement": "<warm, specific encouraging message in Croatian — 1-2 sentences>"
}

Scoring guide: 90-100=near-native fluency, 75-89=confident learner, 60-74=communicative with errors, 40-59=basic communication, below 40=significant barriers.
Rules: max 4 mistakes, 2-3 focus areas, score honestly. If fewer than 3 user messages, note brevity in vocabulary_feedback.`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIConversation({ goBack, setScr, sCurEx }) {
  const [phase, setPhase] = useState("setup"); // setup | chat | evaluating | result
  const [scenario, setScenario] = useState(null);
  const [level, setLevel] = useState("B1");
  const [messages, setMessages] = useState([]); // [{role:"user"|"assistant"|"hint", content:string}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evalError, setEvalError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function callAI(msgs, systemPrompt, mode = "chat") {
    const res = await fetch("/.netlify/functions/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, systemPrompt, mode })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "AI unavailable");
    return data.text;
  }

  async function startConversation() {
    if (!scenario) return;
    setPhase("chat");
    setLoading(true);
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        buildConvoPrompt(scenario, level)
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch(e) {
      setMessages([{ role: "assistant", content: "Hm, nema veze... (Connection error — please try again.)" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAI(next, buildConvoPrompt(scenario, level));
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: "assistant", content: "(Mreža — pokušaj ponovo / Network error — try again)" }]);
    }
    setLoading(false);
  }

  async function requestHint() {
    if (loading) return;
    setLoading(true);
    const hintSysPrompt = `You are a Croatian language tutor. The student needs a quick hint to continue their conversation.
Give 2-3 sentences in English explaining what to say next. Include 1-2 example Croatian phrases they could use with a translation. Be concise and encouraging.`;
    try {
      const hint = await callAI(
        [...messages.filter(m => m.role !== "hint"), { role: "user", content: "I need a hint to continue this conversation." }],
        hintSysPrompt
      );
      setMessages(prev => [...prev, { role: "hint", content: hint }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: "hint", content: "Hint unavailable — try writing anything, even imperfectly!" }]);
    }
    setLoading(false);
  }

  async function endAndEvaluate() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length < 2) { alert("Have at least 2 exchanges before evaluating!"); return; }
    setPhase("evaluating");
    const convoText = messages
      .filter(m => m.role !== "hint")
      .map(m => `${m.role === "user" ? "LEARNER" : "AI ("+scenario.aiName+")"}: ${m.content}`)
      .join("\n\n");
    try {
      const raw = await callAI(
        [{ role: "user", content: convoText }],
        buildEvalPrompt(scenario, level),
        "evaluate"
      );
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse evaluation");
      setEvaluation(JSON.parse(match[0]));
      setPhase("result");
    } catch(e) {
      setEvalError("Evaluation failed: " + e.message);
      setPhase("result");
    }
  }

  function resetAll() { setPhase("setup"); setMessages([]); setEvaluation(null); setEvalError(""); setScenario(null); }

  const userCount = messages.filter(m => m.role === "user").length;

  // ── SETUP ──────────────────────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState("All");
  const filteredScenarios = SCENARIOS.filter(s => {
    const catOk = activeCat === "All" || s.cat === activeCat;
    const levelOk = s.levels.includes(level);
    return catOk && levelOk;
  });

  if (phase === "setup") return (
    <div className="scr-wrap">
      {/* Hero */}
      <div style={{background:"linear-gradient(145deg,#0c4a6e,#0e7490)",borderRadius:22,padding:"22px 20px",marginBottom:22,color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,background:"rgba(255,255,255,.06)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{fontSize:38,marginBottom:8}}>🤖</div>
        <div style={{fontSize:20,fontWeight:900,marginBottom:5,fontFamily:"'Playfair Display',serif",letterSpacing:"-.02em"}}>AI Conversation Partner</div>
        <div style={{fontSize:13,opacity:.85,lineHeight:1.65}}>
          Practice real Croatian conversations with a native-speaker AI. Get instant grammar corrections, vocabulary tips, and a personalised feedback report at the end.
        </div>
        <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
          {["50 scenarios","All levels","Instant hints","Full evaluation"].map(t=>(
            <span key={t} style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Level picker */}
      <div className="sh">Your Level</div>
      <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => { setLevel(l); setScenario(null); }}
            style={{padding:"8px 18px",borderRadius:20,border:"2px solid",fontWeight:800,fontSize:13,cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",transition:"all .15s",
              borderColor:level===l?"#0e7490":"#e2e8f0",
              background:level===l?"#0e7490":"white",
              color:level===l?"white":"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="sh">Category</div>
      <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {CATS.map(c => (
          <button key={c} onClick={() => { setActiveCat(c); setScenario(null); }}
            style={{flexShrink:0,padding:"7px 13px",borderRadius:20,border:"1.5px solid",fontWeight:700,fontSize:12,cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",transition:"all .15s",whiteSpace:"nowrap",
              borderColor:activeCat===c?"#0e7490":"#e2e8f0",
              background:activeCat===c?"#0e7490":"white",
              color:activeCat===c?"white":"#64748b"}}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {/* Scenario count */}
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,fontWeight:600}}>
        {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? "s" : ""} for level {level}
        {activeCat !== "All" ? ` · ${activeCat}` : ""}
      </div>

      {/* Scenario picker */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {filteredScenarios.length === 0 ? (
          <div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8",fontSize:14}}>
            No scenarios match this filter combination. Try changing the level or category.
          </div>
        ) : filteredScenarios.map(s => {
          const selected = scenario?.id === s.id;
          return (
            <div key={s.id} onClick={() => setScenario(s)}
              style={{padding:"15px",borderRadius:16,border:`2px solid ${selected ? s.color : "#e2e8f0"}`,
                background:selected ? s.bg : "white",cursor:"pointer",transition:"all .15s",
                boxShadow:selected ? `0 4px 18px ${s.color}25` : "none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:26,flexShrink:0,width:40,textAlign:"center"}}>{s.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{s.title}</span>
                    <span style={{fontSize:10,color:"#94a3b8",fontWeight:600,background:"#f1f5f9",padding:"1px 7px",borderRadius:10}}>{s.cat}</span>
                  </div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{s.desc}</div>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {s.levels.map(l => (
                      <span key={l} style={{fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:10,
                        background:l===level ? s.color : "#f1f5f9",
                        color:l===level ? "white" : "#94a3b8"}}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                {selected && <div style={{fontSize:18,color:s.color,flexShrink:0}}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>

      <button className="b bp" style={{width:"100%",fontSize:16,padding:"15px",borderRadius:14}}
        onClick={startConversation} disabled={!scenario}>
        {scenario ? `Start — ${scenario.title} (${level})` : "Select a scenario above"}
      </button>
      <div style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginTop:10}}>
        Powered by Google Gemini · Free tier · No data stored
      </div>
    </div>
  );

  // ── EVALUATING ─────────────────────────────────────────────────────────────
  if (phase === "evaluating") return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      minHeight:"80vh",textAlign:"center",padding:"24px"}}>
      <div style={{fontSize:56,marginBottom:16,animation:"pulse 1.4s ease-in-out infinite"}}>🧠</div>
      <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:8}}>Analysing your conversation…</div>
      <div style={{fontSize:14,color:"#64748b",maxWidth:280,lineHeight:1.6}}>
        Reviewing grammar, vocabulary range, and fluency across your {userCount} exchanges
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    if (evalError || !evaluation) return (
      <div className="scr-wrap" style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:20}}>{evalError || "Could not load evaluation"}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="b bg" onClick={() => setPhase("chat")}>Back to Chat</button>
          <button className="b bp" onClick={resetAll}>Start Over</button>
        </div>
      </div>
    );

    const ev = evaluation;
    const scoreColor = ev.score >= 80 ? "#16a34a" : ev.score >= 55 ? "#d97706" : "#dc2626";
    const scoreEmoji = ev.score >= 80 ? "🏆" : ev.score >= 55 ? "👏" : "📚";
    const scoreLabel = ev.score >= 80 ? "Excellent!" : ev.score >= 55 ? "Good Progress" : "Keep Practicing";

    return (
      <div className="scr-wrap">
        {/* Score hero */}
        <div style={{background:"linear-gradient(145deg,#0c4a6e,#0e7490)",borderRadius:22,padding:"24px 20px",
          marginBottom:20,color:"white",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:6}}>{scoreEmoji}</div>
          <div style={{fontSize:11,fontWeight:700,opacity:.7,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Conversation Score</div>
          <div style={{fontSize:72,fontWeight:900,lineHeight:1,marginBottom:4}}>{ev.score}</div>
          <div style={{fontSize:16,fontWeight:700,opacity:.9,marginBottom:6}}>{scoreLabel}</div>
          <div style={{fontSize:13,opacity:.7}}>
            Level demonstrated: <strong style={{opacity:1}}>{ev.level_demonstrated}</strong>
            {ev.level_demonstrated !== level && <span style={{opacity:.6}}> (target: {level})</span>}
          </div>
        </div>

        {/* Encouragement — tap to hear */}
        {ev.encouragement && (
          <div onClick={() => speak(ev.encouragement)}
            style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:16,padding:"16px 18px",
              marginBottom:16,cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>💬</span>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#166534",fontFamily:"'Playfair Display',serif",
                fontStyle:"italic",lineHeight:1.55,marginBottom:4}}>
                "{ev.encouragement}"
              </div>
              <div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>Tap to hear 🔊</div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {ev.strengths?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#16a34a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>
              ✅ What You Did Well
            </div>
            {ev.strengths.map((s,i) => (
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"#16a34a",fontWeight:900,flexShrink:0,marginTop:1}}>•</span>
                <span style={{fontSize:14,color:"#1e293b",lineHeight:1.55}}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Corrections */}
        {ev.mistakes?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#dc2626",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>
              📝 Corrections
            </div>
            {ev.mistakes.map((m,i) => (
              <div key={i} style={{marginBottom:i<ev.mistakes.length-1?14:0,paddingBottom:i<ev.mistakes.length-1?14:0,
                borderBottom:i<ev.mistakes.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:13,color:"#dc2626",textDecoration:"line-through",fontWeight:600}}>{m.original}</span>
                  <span style={{fontSize:13,color:"#94a3b8"}}>→</span>
                  <span style={{fontSize:13,color:"#16a34a",fontWeight:800}}>{m.correction}</span>
                </div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.45}}>{m.rule}</div>
              </div>
            ))}
          </div>
        )}

        {/* Focus areas */}
        {ev.focus_areas?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#7c3aed",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14}}>
              🎯 Focus for the Next Few Days
            </div>
            {ev.focus_areas.map((f,i) => (
              <div key={i} style={{display:"flex",gap:12,marginBottom:i<ev.focus_areas.length-1?16:0,
                paddingBottom:i<ev.focus_areas.length-1?16:0,
                borderBottom:i<ev.focus_areas.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1.5px solid #e0d9f5",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,
                  color:"#7c3aed",flexShrink:0}}>
                  {i+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:3}}>{f.topic}</div>
                  <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:8}}>{f.explanation}</div>
                  {f.exercise && EXERCISE_MAP[f.exercise] && (
                    <button onClick={() => { setScr(f.exercise); sCurEx && sCurEx(f.exercise); }}
                      style={{fontSize:12,fontWeight:700,padding:"6px 13px",borderRadius:10,
                        border:"1.5px solid #0e7490",background:"#f0f9ff",color:"#0e7490",
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      Practice now: {EXERCISE_MAP[f.exercise]} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vocabulary feedback */}
        {ev.vocabulary_feedback && (
          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,padding:"15px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"#a16207",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>📚 Vocabulary</div>
            <div style={{fontSize:13,color:"#78350f",lineHeight:1.6}}>{ev.vocabulary_feedback}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
          <button className="b bg" onClick={() => setPhase("chat")}>← Back to Chat</button>
          <button className="b bp" onClick={resetAll}>New Conversation</button>
        </div>
      </div>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────────────────────
  // Full-screen overlay so the chat input stays pinned above everything
  return (
    <div style={{position:"fixed",inset:0,zIndex:9100,background:"#f8fafc",
      display:"flex",flexDirection:"column",fontFamily:"'Outfit',sans-serif"}}>

      {/* Header */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",
        display:"flex",alignItems:"center",gap:10,flexShrink:0,
        boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        <button onClick={goBack}
          style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px 6px",
            color:"#64748b",lineHeight:1,borderRadius:8,transition:"background .15s"}}
          onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"}
          onMouseOut={e=>e.currentTarget.style.background="none"}>
          ←
        </button>
        <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,
          background:`linear-gradient(135deg,${scenario.color},${scenario.color}bb)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
          {scenario.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#0f172a",lineHeight:1.2}}>{scenario.aiName}</div>
          <div style={{fontSize:11,color:"#64748b"}}>{scenario.title} · Level {level}</div>
        </div>
        <button onClick={endAndEvaluate} disabled={loading || userCount < 2}
          style={{padding:"7px 13px",borderRadius:10,border:"1.5px solid",fontWeight:700,fontSize:12,
            cursor:userCount < 2 ? "not-allowed" : "pointer",fontFamily:"'Outfit',sans-serif",
            transition:"all .15s",whiteSpace:"nowrap",
            borderColor:userCount >= 2 ? "#0e7490" : "#e2e8f0",
            background:userCount >= 2 ? "#f0f9ff" : "#f8fafc",
            color:userCount >= 2 ? "#0e7490" : "#cbd5e1",
            opacity: loading ? 0.5 : 1}}>
          End & Evaluate
        </button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12}}>
        {/* Context pill */}
        <div style={{textAlign:"center",marginBottom:4}}>
          <span style={{fontSize:11,fontWeight:600,color:"#94a3b8",background:"#f1f5f9",
            padding:"4px 12px",borderRadius:20}}>
            {scenario.hr} · {level}
          </span>
        </div>

        {messages.map((m, i) => {
          if (m.role === "hint") return (
            <div key={i} style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,
              padding:"12px 14px",fontSize:13,color:"#78350f",lineHeight:1.6}}>
              💡 <strong>Hint:</strong> {m.content}
            </div>
          );
          const isUser = m.role === "user";
          return (
            <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!isUser && (
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
                  background:`linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                  {scenario.icon}
                </div>
              )}
              <div onClick={() => { if (!isUser) speak(m.content); }}
                style={{maxWidth:"78%",padding:"11px 14px",lineHeight:1.55,fontSize:15,fontWeight:500,
                  background:isUser ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "white",
                  color:isUser ? "white" : "#1e293b",
                  borderRadius:isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  border:isUser ? "none" : "1px solid #e2e8f0",
                  boxShadow:"0 1px 4px rgba(0,0,0,.07)",
                  cursor:!isUser ? "pointer" : "default"}}>
                {m.content}
                {!isUser && <span style={{fontSize:11,opacity:.4,marginLeft:5}}>🔊</span>}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{width:30,height:30,borderRadius:"50%",
              background:`linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {scenario.icon}
            </div>
            <div style={{padding:"12px 16px",background:"white",borderRadius:"18px 18px 18px 4px",
              border:"1px solid #e2e8f0",display:"flex",gap:4,alignItems:"center",
              boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
              {[0,1,2].map(j => (
                <div key={j} style={{width:7,height:7,borderRadius:"50%",background:"#cbd5e1",
                  animation:`pulse 1.2s ease-in-out ${j*0.22}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input bar */}
      <div style={{background:"white",borderTop:"1px solid #e2e8f0",padding:"10px 14px 14px",flexShrink:0,
        paddingBottom:`max(14px,env(safe-area-inset-bottom))`}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input ref={inputRef}
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Piši na hrvatskom…"
            disabled={loading}
            style={{flex:1,padding:"11px 14px",fontSize:15,borderRadius:12,
              border:"1.5px solid #e2e8f0",background:"#f8fafc",outline:"none",
              fontFamily:"'Outfit',sans-serif",transition:"border-color .2s",
              color:"#1e293b"}} />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            style={{width:44,height:44,borderRadius:12,border:"none",flexShrink:0,fontSize:18,
              cursor:input.trim() && !loading ? "pointer" : "not-allowed",transition:"all .15s",
              background:input.trim() && !loading ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "#e2e8f0",
              color:input.trim() && !loading ? "white" : "#94a3b8"}}>
            ➤
          </button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={requestHint} disabled={loading || messages.length === 0}
            style={{background:"none",border:"none",fontSize:12,color:"#64748b",cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",fontWeight:600,padding:"2px 0",opacity:loading?0.4:1}}>
            💡 Need a hint?
          </button>
          <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>
            {userCount} {userCount === 1 ? "exchange" : "exchanges"}
            {userCount < 2 && " · needs 2 to evaluate"}
          </span>
        </div>
      </div>
    </div>
  );
}
