import React, { useState, useEffect, useRef, useMemo } from 'react';
import { speak } from '../../data.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useApp } from '../../context/AppContext.jsx';

// ── Conversation scenarios ───────────────────────────────────────────────────
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
    aiName:"Prijatelj Matej",aiRole:"Croatian friend you're catching up with at a kafić",
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

// ── Writing prompts ──────────────────────────────────────────────────────────
const WRITE_PROMPTS = [
  { id:"w_intro",     level:"A1", icon:"👋", title:"Introduce Yourself",     hr:"Predstavi se",         prompt:"Write 4–5 sentences in Croatian introducing yourself. Include your name, where you're from, and one hobby." },
  { id:"w_family",    level:"A1", icon:"👨‍👩‍👧", title:"My Family",               hr:"Moja obitelj",          prompt:"Describe your family in 4–5 sentences. Who is in your family? Where do they live?" },
  { id:"w_morning",   level:"A2", icon:"🌅", title:"My Morning Routine",      hr:"Moje jutro",            prompt:"Describe what you do every morning, from waking up to leaving the house. Use at least 6 sentences." },
  { id:"w_city",      level:"A2", icon:"🏙️", title:"My City",                 hr:"Moj grad",              prompt:"Write about the city or town where you live. What do you like about it? What do you dislike?" },
  { id:"w_weekend",   level:"B1", icon:"📅", title:"Last Weekend",            hr:"Prošli vikend",         prompt:"Write about what you did last weekend. Use past tense. What did you enjoy? What would you change?" },
  { id:"w_food",      level:"B1", icon:"🍽️", title:"My Favourite Meal",       hr:"Moj omiljeni obrok",    prompt:"Describe your favourite meal in detail. Why do you love it? How is it prepared? Include when you usually eat it." },
  { id:"w_holiday",   level:"B1", icon:"✈️", title:"A Holiday Memory",        hr:"Uspomena s odmora",     prompt:"Write about a memorable holiday or trip. Where did you go? What happened? What did you learn?" },
  { id:"w_opinion",   level:"B2", icon:"💭", title:"An Opinion Piece",        hr:"Moje mišljenje",        prompt:"Write your opinion on this topic: Should Croatian be taught in schools abroad? Give at least 3 arguments." },
  { id:"w_letter",    level:"B2", icon:"✉️", title:"Formal Email",            hr:"Formalni e-mail",       prompt:"Write a formal email to a Croatian landlord asking about renting a flat. Include questions about price, utilities, and move-in date." },
  { id:"w_story",     level:"B2", icon:"📖", title:"A Short Story",           hr:"Kratka priča",          prompt:"Write a short story (8–10 sentences) set in Croatia. Include at least two characters and a brief conflict or surprise." },
  { id:"w_debate",    level:"C1", icon:"⚖️", title:"Essay: Both Sides",       hr:"Esej: dvije strane",    prompt:"Write a balanced essay (10+ sentences) on: 'Is tourism good or bad for Croatia?' Present arguments for and against." },
  { id:"w_review",    level:"C1", icon:"⭐", title:"Restaurant Review",       hr:"Recenzija restorana",   prompt:"Write a detailed Croatian restaurant review (real or imagined) — ambiance, service, food quality, value, recommendation." },
  { id:"w_complaint", level:"C1", icon:"📋", title:"Letter of Complaint",     hr:"Pismo pritužbe",        prompt:"Write a formal letter of complaint to a Croatian hotel manager about a disappointing stay. Be firm but polite." },
  { id:"w_cultural",  level:"C2", icon:"🏛️", title:"Cultural Reflection",     hr:"Kulturni osvrt",        prompt:"Write a thoughtful reflection (12+ sentences) on what Croatian culture means to you personally, and what you have learned from it." },
  { id:"w_news",      level:"C2", icon:"📰", title:"News Article",            hr:"Novinarski članak",     prompt:"Write a short news article in Croatian (10+ sentences) about a fictional event in a Croatian city. Use journalistic style." },
];

const LEVELS        = ["A1","A2","B1","B2","C1","C2"];
const CATS          = ["All","Errands","Out & About","Social","Practical","Culture","Professional"];
const CAT_ICONS     = { All:"🌐", Errands:"🛍️", "Out & About":"🌊", Social:"👨‍👩‍👧", Practical:"🏥", Culture:"🏛️", Professional:"💼" };
const LEVEL_COLORS  = { A1:"#16a34a", A2:"#65a30d", B1:"#ca8a04", B2:"#b45309", C1:"#0e7490", C2:"#7c3aed" };

// Sentence starters by CEFR level
const STARTERS = {
  A1: ["Dobar dan!","Hvala.","Molim.","Koliko košta?","Ne razumijem.","Kako se kaže...?","Jedan, molim."],
  A2: ["Možete li mi pomoći?","Htio/Htjela bih...","Imate li...?","Gdje je...?","Ne znam.","Može li...?"],
  B1: ["Zanima me...","Što preporučate?","Možete li ponoviti?","Nisam siguran/a.","Recite mi više o...","Je li moguće...?"],
  B2: ["Što mislite o...?","S jedne strane...","Prema mom iskustvu...","Zanimljivo je to...","Moram reći da..."],
  C1: ["Čini mi se da...","Valja naglasiti...","S obzirom na to...","Bez obzira na...","U tom kontekstu..."],
  C2: ["Paradoksalno je...","Ono što me fascinira...","U biti se radi o...","S lingvističke strane...","Nije li zanimljivo..."],
};

// Exercise keys → labels for focus-area links in evaluation
const EXERCISE_MAP = {
  akudrill:"🍽️ Accusative Case", tenseflip:"⏳ Tense Flip",   verbdrill:"💪 Verb Drill",
  negation:"❌ Negation",         possess:"👤 Possessives",     ordinals:"🏢 Ordinals",
  relpron:"🔗 Koji/Koja/Koje",   emogender:"😀 Emotion Gender",comparatives:"📈 Comparatives",
  future:"🚀 Future Tense",       sibil:"🔄 k→c/g→z",          prepdrill:"📍 Prepositions",
  numtime:"🔢 Numbers & Time",    profgender:"👨‍⚖️ Job Genders",reflexive:"🧲 SE Verbs",
  sentbuild:"🏗️ Sentence Builder",genderdrill:"♂️♀️ Gender Drill",
};

// ── System prompt builders ───────────────────────────────────────────────────
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
    {"original": "<exact learner phrase with error>", "correction": "<corrected form>", "rule": "<brief grammar rule>" }
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

function buildCorrectPrompt() {
  return `You are a Croatian language grammar checker. Given a Croatian sentence or short text from a language learner, check for grammar, case, tense, or agreement errors.

Return ONLY a valid JSON object (no markdown):
{"corrected": "the corrected Croatian text, or null if no errors", "note": "brief English explanation of the main error (e.g. 'wrong case: use accusative after vidim'), or null if no errors"}

Rules:
- Only flag real grammatical errors (wrong case endings, verb conjugation, gender agreement).
- Ignore stylistic preferences or minor word order variations that are still correct.
- If the text is fully correct, return null for both fields.`;
}

function buildWriteEvalPrompt(prompt, level) {
  return `You are an expert Croatian language teacher. Evaluate the following Croatian writing sample from a ${level} learner responding to this prompt: "${prompt}"

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "level_demonstrated": "<A1|A2|B1|B2|C1|C2>",
  "corrected_text": "<the full text with corrections applied>",
  "changes": [
    {"original": "<exact phrase with error>", "corrected": "<corrected version>", "note": "<brief English grammar rule>"}
  ],
  "strengths": ["<specific positive observation>"],
  "improvements": ["<specific actionable suggestion>"],
  "encouragement": "<warm, motivating message in Croatian — 1-2 sentences>"
}

Scoring: 90-100=excellent, 75-89=good with minor errors, 60-74=communicative with noticeable errors, 40-59=basic, below 40=significant barriers.
Rules: max 6 changes, 2-3 improvements, score honestly. If text is very short, note this.`;
}

function buildTranslatePrompt() {
  return `You are a Croatian-English dictionary assistant. Translate the given Croatian word or short phrase to English.

Return ONLY a valid JSON object (no markdown):
{"translation": "the English meaning", "note": "optional brief grammar info: gender (m/f/n), irregular form, or usage note — or null"}

Keep the translation concise and accurate. For verbs, give the infinitive meaning.`;
}

// ── TappableMessage — defined outside to prevent remount on every parent render ─
// Each word in an AI message is a span; tapping calls onWordClick and stops
// event propagation so the outer "tap to speak" div is not also triggered.
function TappableMessage({ text, onWordClick }) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const stripped = token.replace(/[.,!?;:…«»"'""''()\[\]]/g, "").trim();
        if (stripped.length < 2) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            data-word="1"
            onClick={e => { e.stopPropagation(); onWordClick(token); }}
            style={{ cursor: "pointer", borderBottom: "1px dotted rgba(14,116,144,.4)",
              borderRadius: 2, transition: "background .1s" }}
            title="Tap to translate"
          >
            {token}
          </span>
        );
      })}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIConversation({ goBack: _goBack, setScr, sCurEx, setJWords }) {
  const { award } = useApp();
  const isOnline = useOnlineStatus();

  // ── Mode (conversation vs. free write) ─────────────────────────────────────
  const [appMode,    setAppMode]    = useState("convo");    // "convo" | "write"

  // ── Conversation state ─────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState("setup");    // setup|chat|evaluating|result
  const [scenario,   setScenario]   = useState(null);
  const [level,      setLevel]      = useState("B1");
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [chatError,  setChatError]  = useState("");
  const [sendError,  setSendError]  = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evalError,  setEvalError]  = useState("");

  // ── Inline correction state (fires async after each user message) ──────────
  const [corrections, setCorrections] = useState({}); // { messageIndex: { corrected, note } }

  // ── Word translation tooltip ───────────────────────────────────────────────
  const [tooltip, setTooltip] = useState(null); // { word, translation, note, loading, saved }

  // ── Sentence starters ──────────────────────────────────────────────────────
  const [showStarters, setShowStarters] = useState(false);

  // ── Voice input ────────────────────────────────────────────────────────────
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // ── Words saved to journal this session ───────────────────────────────────
  const [savedWords, setSavedWords] = useState(new Set());

  // ── Translation cache — avoids duplicate API calls for the same word ───────
  const translationCacheRef = useRef({});

  // ── Free Write state ───────────────────────────────────────────────────────
  const [writePrompt,    setWritePrompt]    = useState(null);
  const [writeLevel,     setWriteLevel]     = useState("B1");
  const [writeText,      setWriteText]      = useState("");
  const [writePhase,     setWritePhase]     = useState("setup"); // setup|writing|evaluating|result
  const [writeEval,      setWriteEval]      = useState(null);
  const [writeEvalError, setWriteEvalError] = useState("");

  // ── Setup category filter ──────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState("All");

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const writeTextRef   = useRef(null);
  const isMountedRef   = useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Dismiss tooltip on outside tap
  useEffect(() => {
    if (!tooltip) return;
    function dismiss(e) {
      if (!e.target.closest("[data-tooltip]") && !e.target.closest("[data-word]")) {
        setTooltip(null);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [tooltip]);

  // ── Core API caller ─────────────────────────────────────────────────────────
  async function callAI(msgs, systemPrompt, mode = "chat") {
    let res, data;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: msgs, systemPrompt, mode }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch (netErr) {
      if (netErr.name === "AbortError") throw new Error("Request timed out — the AI took too long to respond. Please try again.");
      throw new Error("Network error — check your connection. (" + netErr.message + ")");
    }
    try {
      data = await res.json();
    } catch {
      throw new Error("Unexpected server response (status " + res.status + "). Please try again.");
    }
    if (!res.ok || data.error) {
      const msg = data.error || ("Server error " + res.status);
      if (msg.includes("AI_KEY_MISSING") || msg.includes("ANTHROPIC_API_KEY")) {
        throw new Error("setup_error:The AI service is not yet configured. The ANTHROPIC_API_KEY needs to be set in Cloudflare Pages → Settings → Environment Variables.");
      }
      throw new Error(msg);
    }
    if (!data.text || !data.text.trim()) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    return data.text;
  }

  // ── Parse JSON safely from AI responses ────────────────────────────────────
  function parseJSON(raw) {
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  // ── Start conversation ──────────────────────────────────────────────────────
  async function startConversation() {
    if (!scenario) return;
    setPhase("chat");
    setChatError("");
    setMessages([]);
    setCorrections({});
    setLoading(true);
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        buildConvoPrompt(scenario, level)
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch (e) {
      const msg = e.message || "";
      setChatError(msg.startsWith("setup_error:") ? msg.slice(12) : msg);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  // ── Send a message — triggers AI reply + async correction check ────────────
  async function sendMessage() {
    if (!input.trim() || loading) return;
    setSendError("");
    const userText = input.trim();
    const userMsgIndex = messages.length;
    const userMsg = { role: "user", content: userText };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAI(next, buildConvoPrompt(scenario, level));
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      // Fire correction check in background — skip if text is too short or
      // appears to be English (no Croatian diacritics, ends in common English words)
      const looksEnglish = userText.length < 4 || (
        !/[čćšžđČĆŠŽĐ]/.test(userText) &&
        /\b(the|is|are|was|were|have|has|can|will|my|your|i|we|you)\b/i.test(userText)
      );
      if (!looksEnglish) checkCorrection(userText, userMsgIndex);
    } catch (e) {
      // Restore input so the user can retry without retyping
      setInput(userText);
      setSendError(e.message || "Send failed — please try again.");
    }
    setLoading(false);
  }

  // ── Inline grammar correction (non-blocking background call) ───────────────
  async function checkCorrection(userText, msgIndex) {
    try {
      const raw = await callAI(
        [{ role: "user", content: userText }],
        buildCorrectPrompt(),
        "correct"
      );
      const result = parseJSON(raw);
      if (result && result.corrected && isMountedRef.current) {
        setCorrections(prev => ({ ...prev, [msgIndex]: result }));
      }
    } catch {
      // Correction checks are non-critical — silently discard errors
    }
  }

  // ── Translate a tapped word ─────────────────────────────────────────────────
  async function translateWord(word) {
    const clean = word.replace(/[.,!?;:…«»"'""''()\[\]]/g, "").trim();
    if (!clean || clean.length < 2) return;
    // Serve from cache instantly if we've translated this word before
    const cached = translationCacheRef.current[clean.toLowerCase()];
    if (cached) {
      setTooltip({ word: clean, loading: false, ...cached, saved: savedWords.has(clean) });
      return;
    }
    // Evict cache when it exceeds 150 entries to prevent unbounded memory growth
    if (Object.keys(translationCacheRef.current).length >= 150) translationCacheRef.current = {};
    setTooltip({ word: clean, loading: true, translation: null, note: null, saved: savedWords.has(clean) });
    try {
      const raw = await callAI(
        [{ role: "user", content: clean }],
        buildTranslatePrompt(),
        "translate"
      );
      const result = parseJSON(raw);
      const translation = result?.translation || "—";
      const note = result?.note || null;
      translationCacheRef.current[clean.toLowerCase()] = { translation, note };
      setTooltip(prev =>
        prev?.word === clean
          ? { ...prev, loading: false, translation, note }
          : prev
      );
    } catch {
      setTooltip(prev =>
        prev?.word === clean ? { ...prev, loading: false, translation: "Translation unavailable" } : prev
      );
    }
  }

  // ── Save a word to the vocab journal ───────────────────────────────────────
  function saveWordToJournal() {
    if (!tooltip?.translation) return;
    const entry = { w: tooltip.word, t: tooltip.translation, added: Date.now() };
    try {
      const existing = JSON.parse(localStorage.getItem("uJournal") || "[]");
      if (!existing.find(e => e.w === tooltip.word)) {
        const updated = [...existing, entry];
        localStorage.setItem("uJournal", JSON.stringify(updated));
        if (typeof setJWords === "function") setJWords(updated);
      }
    } catch { /* storage error — silently ignore */ }
    setSavedWords(prev => new Set([...prev, tooltip.word]));
    setTooltip(prev => prev ? { ...prev, saved: true } : null);
  }

  // ── Voice input ─────────────────────────────────────────────────────────────
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input is not supported in this browser. Try Chrome on Android or desktop."); return; }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "hr-HR";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    r.start();
    recognitionRef.current = r;
  }

  // ── Hint ────────────────────────────────────────────────────────────────────
  async function requestHint() {
    if (loading) return;
    setLoading(true);
    const hintPrompt = `You are a Croatian language tutor. The student needs a quick hint to continue their conversation.
Give 2-3 sentences in English explaining what to say next. Include 1-2 example Croatian phrases they could use with a translation. Be concise and encouraging.`;
    try {
      const hint = await callAI(
        [...messages.filter(m => m.role !== "hint"), { role: "user", content: "I need a hint to continue this conversation." }],
        hintPrompt
      );
      setMessages(prev => [...prev, { role: "hint", content: hint }]);
    } catch {
      setMessages(prev => [...prev, { role: "hint", content: "💡 Hint unavailable right now — try writing anything, even imperfectly! Making mistakes is how you learn." }]);
    }
    setLoading(false);
  }

  // ── Retry opener ────────────────────────────────────────────────────────────
  async function retryOpener() {
    setChatError("");
    setMessages([]);
    setLoading(true);
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        buildConvoPrompt(scenario, level)
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch (e) {
      const msg = e.message || "";
      setChatError(msg.startsWith("setup_error:") ? msg.slice(12) : msg);
    }
    setLoading(false);
  }

  // ── End & evaluate conversation ─────────────────────────────────────────────
  async function endAndEvaluate() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length < 2) { alert("Have at least 2 exchanges before evaluating!"); return; }
    setPhase("evaluating");
    const convoText = messages
      .filter(m => m.role !== "hint")
      .map(m => `${m.role === "user" ? "LEARNER" : "AI (" + scenario.aiName + ")"}: ${m.content}`)
      .join("\n\n");
    try {
      const raw = await callAI([{ role: "user", content: convoText }], buildEvalPrompt(scenario, level), "evaluate");
      const ev = parseJSON(raw);
      setEvaluation(ev);
      // Award XP based on conversation quality and length
      if (ev && typeof award === "function") {
        const xp = ev.score >= 80 ? 20 : ev.score >= 60 ? 15 : 10;
        award(xp + Math.min(userMsgs.length, 5) * 2, false);
      }
      setPhase("result");
    } catch (e) {
      setEvalError(e.message || "Evaluation failed");
      setPhase("result");
    }
  }

  // ── Submit free-write for evaluation ───────────────────────────────────────
  async function submitWriting() {
    if (!writeText.trim() || writeText.trim().split(/\s+/).length < 5) {
      alert("Please write at least a few sentences before submitting.");
      return;
    }
    setWritePhase("evaluating");
    try {
      const raw = await callAI(
        [{ role: "user", content: writeText.trim() }],
        buildWriteEvalPrompt(writePrompt.prompt, writeLevel),
        "writeeval"
      );
      const result = parseJSON(raw);
      if (!result) throw new Error("Could not parse evaluation response.");
      setWriteEval(result);
      // Award XP for completing a free-write evaluation
      if (typeof award === "function") {
        const xp = result.score >= 80 ? 18 : result.score >= 60 ? 13 : 8;
        award(xp, false);
      }
      setWritePhase("result");
    } catch (e) {
      setWriteEvalError(e.message || "Evaluation failed");
      setWritePhase("result");
    }
  }

  function resetConvo() {
    setPhase("setup"); setMessages([]); setEvaluation(null);
    setEvalError(""); setScenario(null); setChatError(""); setSendError("");
    setCorrections({}); setTooltip(null);
  }

  function resetWrite() {
    setWritePhase("setup"); setWriteText(""); setWriteEval(null);
    setWriteEvalError(""); setWritePrompt(null);
  }

  const userCount = useMemo(() => messages.filter(m => m.role === "user").length, [messages]);
  const filteredScenarios = useMemo(() =>
    SCENARIOS.filter(s => (activeCat === "All" || s.cat === activeCat) && s.levels.includes(level)),
    [activeCat, level]
  );
  const filteredPrompts = useMemo(() =>
    WRITE_PROMPTS.filter(p => p.level === writeLevel),
    [writeLevel]
  );
  const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ── Sub-components ──────────────────────────────────────────────────────────

  // Word translation tooltip overlay
  const WordTooltip = tooltip ? (
    <div
      data-tooltip="1"
      style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
        background: "white", borderRadius: 18, padding: "16px 18px",
        boxShadow: "0 10px 40px rgba(0,0,0,.18)", border: "1.5px solid #e2e8f0",
        zIndex: 9300, minWidth: 240, maxWidth: "calc(100vw - 48px)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#0e7490", fontFamily: "'Playfair Display',serif", flex: 1 }}>
          {tooltip.word}
        </span>
        <button onClick={() => speak(tooltip.word)}
          style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", opacity: .65, padding: "0 4px" }}>
          🔊
        </button>
        <button onClick={() => setTooltip(null)}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "0 2px" }}>
          ×
        </button>
      </div>
      {tooltip.loading ? (
        <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>Translating…</div>
      ) : (
        <>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
            {tooltip.translation}
          </div>
          {tooltip.note && (
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.4 }}>{tooltip.note}</div>
          )}
          <button
            onClick={saveWordToJournal}
            style={{ fontSize: 13, fontWeight: 700, padding: "8px 0", borderRadius: 12, border: "none",
              background: tooltip.saved ? "#dcfce7" : "#0e7490",
              color: tooltip.saved ? "#16a34a" : "white",
              cursor: tooltip.saved ? "default" : "pointer",
              fontFamily: "'Outfit',sans-serif", width: "100%", transition: "all .2s" }}
          >
            {tooltip.saved ? "✓ Saved to Journal" : "+ Save to Journal"}
          </button>
        </>
      )}
    </div>
  ) : null;

  // ── SHARED HEADER ───────────────────────────────────────────────────────────
  const ModeHeader = (
    <div style={{ background: "linear-gradient(145deg,#0c4a6e,#0e7490)", borderRadius: 22, padding: "22px 20px",
      marginBottom: 22, color: "white", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -30, top: -30, width: 130, height: 130,
        background: "rgba(255,255,255,.06)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ fontSize: 36, marginBottom: 8 }}>{appMode === "write" ? "✍️" : "🤖"}</div>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 5, fontFamily: "'Playfair Display',serif", letterSpacing: "-.02em" }}>
        {appMode === "write" ? "Free Write Practice" : "AI Conversation Partner"}
      </div>
      <div style={{ fontSize: 13, opacity: .85, lineHeight: 1.65 }}>
        {appMode === "write"
          ? "Write freely in Croatian, then get a full AI correction with line-by-line feedback and a score."
          : "Practice real Croatian conversations with a native-speaker AI. Get inline corrections, tap words to translate, and a full evaluation at the end."}
      </div>
      {/* Mode toggle tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {[["convo","💬 Conversation"],["write","✍️ Free Write"]].map(([mode, label]) => (
          <button key={mode} onClick={() => { setAppMode(mode); resetConvo(); resetWrite(); }}
            style={{ padding: "7px 16px", borderRadius: 20, border: "2px solid rgba(255,255,255,.5)",
              fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              background: appMode === mode ? "rgba(255,255,255,.25)" : "transparent",
              color: "white", transition: "all .15s" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FREE WRITE — SETUP
  // ════════════════════════════════════════════════════════════════════════════
  if (appMode === "write" && writePhase === "setup") return (
    <div className="scr-wrap">
      {ModeHeader}

      <div className="sh">Your Level</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => { setWriteLevel(l); setWritePrompt(null); }}
            style={{ padding: "8px 18px", borderRadius: 20, border: "2px solid",
              fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              borderColor: writeLevel === l ? "#0e7490" : "#e2e8f0",
              background: writeLevel === l ? "#0e7490" : "white",
              color: writeLevel === l ? "white" : "#64748b" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="sh">Choose a Writing Prompt</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {filteredPrompts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 14 }}>
            No prompts for this level combination.
          </div>
        ) : filteredPrompts.map(p => {
          const sel = writePrompt?.id === p.id;
          return (
            <div key={p.id} onClick={() => setWritePrompt(p)}
              style={{ padding: 16, borderRadius: 16, border: `2px solid ${sel ? "#0e7490" : "#e2e8f0"}`,
                background: sel ? "#f0f9ff" : "white", cursor: "pointer", transition: "all .15s",
                boxShadow: sel ? "0 4px 18px rgba(14,116,144,.15)" : "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{p.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                      background: LEVEL_COLORS[p.level] + "20", color: LEVEL_COLORS[p.level] }}>
                      {p.level}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{p.prompt}</div>
                </div>
                {sel && <div style={{ color: "#0e7490", fontSize: 18, flexShrink: 0 }}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>

      {!isOnline && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 12,
          padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#92400e", fontWeight: 600,
          display: "flex", gap: 10, alignItems: "center" }}>
          <span>📶</span><span>You're offline — writing evaluation requires an internet connection.</span>
        </div>
      )}
      <button className="b bp" style={{ width: "100%", fontSize: 16, padding: "15px", borderRadius: 14 }}
        onClick={() => { if (writePrompt) { setWritePhase("writing"); setTimeout(() => writeTextRef.current?.focus(), 200); } }}
        disabled={!writePrompt || !isOnline}>
        {!isOnline ? "Connect to the internet to start" : writePrompt ? `Start Writing — ${writePrompt.title}` : "Select a prompt above"}
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FREE WRITE — WRITING
  // ════════════════════════════════════════════════════════════════════════════
  if (appMode === "write" && writePhase === "writing") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "#f8fafc",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <button onClick={() => setWritePhase("setup")}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px 6px",
            color: "#64748b", lineHeight: 1, borderRadius: 8 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{writePrompt.icon} {writePrompt.title}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Level {writeLevel} · Write in Croatian</div>
        </div>
        <button onClick={submitWriting} disabled={writeText.trim().split(/\s+/).length < 5}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid",
            fontWeight: 700, fontSize: 12, cursor: writeText.trim().split(/\s+/).length >= 5 ? "pointer" : "not-allowed",
            fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap",
            borderColor: writeText.trim().split(/\s+/).length >= 5 ? "#0e7490" : "#e2e8f0",
            background: writeText.trim().split(/\s+/).length >= 5 ? "#0e7490" : "#f8fafc",
            color: writeText.trim().split(/\s+/).length >= 5 ? "white" : "#cbd5e1" }}>
          Submit →
        </button>
      </div>

      {/* Prompt card */}
      <div style={{ padding: "12px 14px 0", flexShrink: 0 }}>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12,
          padding: "12px 14px", fontSize: 13, color: "#0369a1", lineHeight: 1.6 }}>
          <strong>Prompt:</strong> {writePrompt.prompt}
        </div>
      </div>

      {/* Writing area */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
        <textarea
          ref={writeTextRef}
          value={writeText}
          onChange={e => setWriteText(e.target.value)}
          placeholder="Piši ovdje na hrvatskom…"
          style={{ flex: 1, padding: "14px", fontSize: 16, lineHeight: 1.7, borderRadius: 14,
            border: "1.5px solid #e2e8f0", background: "white", fontFamily: "'Outfit',sans-serif",
            color: "#1e293b", resize: "none", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
          <span>{writeText.trim().split(/\s+/).filter(Boolean).length} words</span>
          <span>Tap Submit when ready →</span>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FREE WRITE — EVALUATING
  // ════════════════════════════════════════════════════════════════════════════
  if (appMode === "write" && writePhase === "evaluating") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "80vh", textAlign: "center", padding: "24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite" }}>📝</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Marking your writing…</div>
      <div style={{ fontSize: 14, color: "#64748b", maxWidth: 280, lineHeight: 1.6 }}>
        Checking grammar, vocabulary range, and style
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FREE WRITE — RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (appMode === "write" && writePhase === "result") {
    if (writeEvalError || !writeEval) return (
      <div className="scr-wrap" style={{ textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 20 }}>
          {writeEvalError || "Could not load evaluation"}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="b bg" onClick={() => setWritePhase("writing")}>Back to Writing</button>
          <button className="b bp" onClick={resetWrite}>Start Over</button>
        </div>
      </div>
    );

    const ev = writeEval;
    const scoreEmoji = ev.score >= 80 ? "🏆" : ev.score >= 55 ? "👏" : "📚";

    return (
      <div className="scr-wrap">
        {/* Score hero */}
        <div style={{ background: "linear-gradient(145deg,#0c4a6e,#0e7490)", borderRadius: 22, padding: "24px 20px",
          marginBottom: 20, color: "white", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>{scoreEmoji}</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .7, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Writing Score</div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{ev.score}</div>
          <div style={{ fontSize: 13, opacity: .7 }}>
            Level demonstrated: <strong style={{ opacity: 1 }}>{ev.level_demonstrated}</strong>
          </div>
        </div>

        {/* Encouragement */}
        {ev.encouragement && (
          <div onClick={() => speak(ev.encouragement)}
            style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "16px 18px",
              marginBottom: 16, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💬</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", fontFamily: "'Playfair Display',serif",
                fontStyle: "italic", lineHeight: 1.55, marginBottom: 4 }}>"{ev.encouragement}"</div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Tap to hear 🔊</div>
            </div>
          </div>
        )}

        {/* Corrected text */}
        {ev.corrected_text && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0e7490", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
              ✅ Corrected Version
            </div>
            <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{ev.corrected_text}</div>
          </div>
        )}

        {/* Individual changes */}
        {ev.changes?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
              📝 Corrections ({ev.changes.length})
            </div>
            {ev.changes.map((c, i) => (
              <div key={i} style={{ marginBottom: i < ev.changes.length - 1 ? 14 : 0,
                paddingBottom: i < ev.changes.length - 1 ? 14 : 0,
                borderBottom: i < ev.changes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#dc2626", textDecoration: "line-through", fontWeight: 600 }}>{c.original}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>→</span>
                  <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 800 }}>{c.corrected}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>{c.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {ev.strengths?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#16a34a", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
              ✅ Strengths
            </div>
            {ev.strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#16a34a", fontWeight: 900, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.55 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Improvements */}
        {ev.improvements?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
              🎯 Areas to Improve
            </div>
            {ev.improvements.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#7c3aed", fontWeight: 900, flexShrink: 0 }}>•</span>
                <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.55 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
          <button className="b bg" onClick={() => setWritePhase("writing")}>← Edit & Resubmit</button>
          <button className="b bp" onClick={resetWrite}>New Prompt</button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION — SETUP
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "setup") return (
    <div className="scr-wrap">
      {ModeHeader}

      <div className="sh">Your Level</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => { setLevel(l); setScenario(null); }}
            style={{ padding: "8px 18px", borderRadius: 20, border: "2px solid", fontWeight: 800, fontSize: 13,
              cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .15s",
              borderColor: level === l ? "#0e7490" : "#e2e8f0",
              background: level === l ? "#0e7490" : "white",
              color: level === l ? "white" : "#64748b" }}>
            {l}
          </button>
        ))}
      </div>

      <div className="sh">Category</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => { setActiveCat(c); setScenario(null); }}
            style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 20, border: "1.5px solid",
              fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              transition: "all .15s", whiteSpace: "nowrap",
              borderColor: activeCat === c ? "#0e7490" : "#e2e8f0",
              background: activeCat === c ? "#0e7490" : "white",
              color: activeCat === c ? "white" : "#64748b" }}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, fontWeight: 600 }}>
        {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? "s" : ""} for level {level}
        {activeCat !== "All" ? ` · ${activeCat}` : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {filteredScenarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 14 }}>
            No scenarios match this filter. Try changing the level or category.
          </div>
        ) : filteredScenarios.map(s => {
          const selected = scenario?.id === s.id;
          return (
            <div key={s.id} onClick={() => setScenario(s)}
              style={{ padding: 15, borderRadius: 16, border: `2px solid ${selected ? s.color : "#e2e8f0"}`,
                background: selected ? s.bg : "white", cursor: "pointer", transition: "all .15s",
                boxShadow: selected ? `0 4px 18px ${s.color}25` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 26, flexShrink: 0, width: 40, textAlign: "center" }}>{s.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{s.title}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, background: "#f1f5f9", padding: "1px 7px", borderRadius: 10 }}>{s.cat}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {s.levels.map(l => (
                      <span key={l} style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                        background: l === level ? s.color : "#f1f5f9", color: l === level ? "white" : "#94a3b8" }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                {selected && <div style={{ fontSize: 18, color: s.color, flexShrink: 0 }}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {["Tap words to translate","Inline corrections","Voice input","Sentence starters","Full evaluation"].map(t => (
          <span key={t} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 20,
            padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#0369a1" }}>{t}</span>
        ))}
      </div>

      {!isOnline && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 12,
          padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#92400e", fontWeight: 600,
          display: "flex", gap: 10, alignItems: "center" }}>
          <span>📶</span><span>You're offline — AI conversation requires an internet connection.</span>
        </div>
      )}
      <button className="b bp" style={{ width: "100%", fontSize: 16, padding: "15px", borderRadius: 14 }}
        onClick={startConversation} disabled={!scenario || !isOnline}>
        {!isOnline ? "Connect to the internet to start" : scenario ? `Start — ${scenario.title} (${level})` : "Select a scenario above"}
      </button>
      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
        Powered by Claude AI · No conversation data stored
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION — EVALUATING
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "evaluating") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "80vh", textAlign: "center", padding: "24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite" }}>🧠</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Analysing your conversation…</div>
      <div style={{ fontSize: 14, color: "#64748b", maxWidth: 280, lineHeight: 1.6 }}>
        Reviewing grammar, vocabulary range, and fluency across your {userCount} exchanges
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION — RESULT
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "result") {
    if (evalError || !evaluation) return (
      <div className="scr-wrap" style={{ textAlign: "center", paddingTop: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 20 }}>{evalError || "Could not load evaluation"}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="b bg" onClick={() => setPhase("chat")}>Back to Chat</button>
          <button className="b bp" onClick={resetConvo}>Start Over</button>
        </div>
      </div>
    );

    const ev = evaluation;
    const scoreEmoji = ev.score >= 80 ? "🏆" : ev.score >= 55 ? "👏" : "📚";
    const scoreLabel = ev.score >= 80 ? "Excellent!" : ev.score >= 55 ? "Good Progress" : "Keep Practicing";

    return (
      <div className="scr-wrap">
        <div style={{ background: "linear-gradient(145deg,#0c4a6e,#0e7490)", borderRadius: 22, padding: "24px 20px",
          marginBottom: 20, color: "white", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>{scoreEmoji}</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .7, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Conversation Score</div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{ev.score}</div>
          <div style={{ fontSize: 16, fontWeight: 700, opacity: .9, marginBottom: 6 }}>{scoreLabel}</div>
          <div style={{ fontSize: 13, opacity: .7 }}>
            Level demonstrated: <strong style={{ opacity: 1 }}>{ev.level_demonstrated}</strong>
            {ev.level_demonstrated !== level && <span style={{ opacity: .6 }}> (target: {level})</span>}
          </div>
        </div>

        {ev.encouragement && (
          <div onClick={() => speak(ev.encouragement)}
            style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "16px 18px",
              marginBottom: 16, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💬</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", fontFamily: "'Playfair Display',serif",
                fontStyle: "italic", lineHeight: 1.55, marginBottom: 4 }}>"{ev.encouragement}"</div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Tap to hear 🔊</div>
            </div>
          </div>
        )}

        {ev.strengths?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#16a34a", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
              ✅ What You Did Well
            </div>
            {ev.strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#16a34a", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.55 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {ev.mistakes?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
              📝 Corrections
            </div>
            {ev.mistakes.map((m, i) => (
              <div key={i} style={{ marginBottom: i < ev.mistakes.length - 1 ? 14 : 0,
                paddingBottom: i < ev.mistakes.length - 1 ? 14 : 0,
                borderBottom: i < ev.mistakes.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#dc2626", textDecoration: "line-through", fontWeight: 600 }}>{m.original}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>→</span>
                  <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 800 }}>{m.correction}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>{m.rule}</div>
              </div>
            ))}
          </div>
        )}

        {ev.focus_areas?.length > 0 && (
          <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>
              🎯 Focus for the Next Few Days
            </div>
            {ev.focus_areas.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < ev.focus_areas.length - 1 ? 16 : 0,
                paddingBottom: i < ev.focus_areas.length - 1 ? 16 : 0,
                borderBottom: i < ev.focus_areas.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f5f3ff", border: "1.5px solid #e0d9f5",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900,
                  color: "#7c3aed", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>{f.topic}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 8 }}>{f.explanation}</div>
                  {f.exercise && EXERCISE_MAP[f.exercise] && (
                    <button onClick={() => { setScr(f.exercise); sCurEx && sCurEx(f.exercise); }}
                      style={{ fontSize: 12, fontWeight: 700, padding: "6px 13px", borderRadius: 10,
                        border: "1.5px solid #0e7490", background: "#f0f9ff", color: "#0e7490",
                        cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .15s" }}>
                      Practice now: {EXERCISE_MAP[f.exercise]} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {ev.vocabulary_feedback && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14, padding: 15, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#a16207", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>📚 Vocabulary</div>
            <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{ev.vocabulary_feedback}</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
          <button className="b bg" onClick={() => setPhase("chat")}>← Back to Chat</button>
          <button className="b bp" onClick={resetConvo}>New Conversation</button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION — CHAT
  // ════════════════════════════════════════════════════════════════════════════
  if (!scenario) { setPhase("setup"); return null; }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "#f8fafc",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <button
          onClick={() => {
            if (messages.length > 0 && !window.confirm("Leave this conversation? Your progress will be lost.")) return;
            resetConvo();
          }}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px 6px",
            color: "#64748b", lineHeight: 1, borderRadius: 8 }}>←</button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg,${scenario.color},${scenario.color}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {scenario.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{scenario.aiName}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{scenario.title} · Level {level}</div>
        </div>
        <button onClick={endAndEvaluate} disabled={loading || userCount < 2 || !!chatError}
          style={{ padding: "7px 13px", borderRadius: 10, border: "1.5px solid", fontWeight: 700, fontSize: 12,
            cursor: (userCount >= 2 && !chatError && !loading) ? "pointer" : "not-allowed",
            fontFamily: "'Outfit',sans-serif", transition: "all .15s", whiteSpace: "nowrap",
            borderColor: (userCount >= 2 && !chatError) ? "#0e7490" : "#e2e8f0",
            background: (userCount >= 2 && !chatError) ? "#f0f9ff" : "#f8fafc",
            color: (userCount >= 2 && !chatError) ? "#0e7490" : "#cbd5e1",
            opacity: loading ? 0.5 : 1 }}>
          End & Evaluate
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Context pill */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", background: "#f1f5f9", padding: "4px 12px", borderRadius: 20 }}>
            {scenario.hr} · {level}
          </span>
        </div>
        {/* Tap-to-translate hint (shown once) */}
        {messages.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 11, color: "#bae6fd", background: "rgba(14,116,144,.08)",
              padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              Tap any Croatian word to translate
            </span>
          </div>
        )}

        {/* Error state */}
        {chatError && messages.length === 0 && !loading && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 16, padding: 20, margin: "8px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#991b1b", marginBottom: 8 }}>Could not connect to AI</div>
            <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.65, marginBottom: 16, textAlign: "left",
              background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #fecaca" }}>
              {chatError}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={retryOpener}
                style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "#0e7490",
                  color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Try Again
              </button>
              <button onClick={resetConvo}
                style={{ padding: "10px 20px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white",
                  color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Back to Scenarios
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => {
          // Hint bubble
          if (m.role === "hint") return (
            <div key={i} style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14,
              padding: "12px 14px", fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
              💡 <strong>Hint:</strong> {m.content}
            </div>
          );

          const isUser = m.role === "user";
          const correction = corrections[i];

          return (
            <React.Fragment key={i}>
              {/* Message bubble */}
              <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                {/* AI avatar */}
                {!isUser && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {scenario.icon}
                  </div>
                )}
                <div
                  onClick={() => { if (!isUser) speak(m.content); }}
                  style={{ maxWidth: "78%", padding: "11px 14px", lineHeight: 1.55, fontSize: 15, fontWeight: 500,
                    background: isUser ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "white",
                    color: isUser ? "white" : "#1e293b",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    border: isUser ? "none" : "1px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
                    cursor: !isUser ? "pointer" : "default" }}
                >
                  {/* AI messages: words are tappable for translation */}
                  {!isUser ? <TappableMessage text={m.content} onWordClick={translateWord} /> : m.content}
                  {!isUser && <span style={{ fontSize: 11, opacity: .4, marginLeft: 5 }}>🔊</span>}
                </div>
              </div>

              {/* Inline correction card — shown under user messages when a grammar error is found */}
              {isUser && correction && (
                <div style={{ alignSelf: "flex-end", maxWidth: "78%", marginTop: -6,
                  background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0 0 14px 14px",
                  padding: "8px 14px", fontSize: 12 }}>
                  <span style={{ color: "#166534", fontWeight: 800 }}>✏️ Better: </span>
                  <span style={{ color: "#166534", fontWeight: 900 }}>{correction.corrected}</span>
                  {correction.note && (
                    <div style={{ color: "#166534", opacity: .75, marginTop: 2 }}>{correction.note}</div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Inline send error */}
        {sendError && !loading && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12,
            padding: "12px 14px", fontSize: 12, color: "#991b1b", lineHeight: 1.6, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <div>
              <strong>Send failed:</strong> {sendError}
              <button onClick={() => setSendError("")}
                style={{ display: "block", marginTop: 6, padding: "4px 12px", borderRadius: 8, border: "none",
                  background: "#dc2626", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif" }}>
                Dismiss (your message is restored in the input)
              </button>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              {scenario.icon}
            </div>
            <div style={{ padding: "12px 16px", background: "white", borderRadius: "18px 18px 18px 4px",
              border: "1px solid #e2e8f0", display: "flex", gap: 4, alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#cbd5e1",
                  animation: `pulse 1.2s ease-in-out ${j * 0.22}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ background: "white", borderTop: "1px solid #e2e8f0", padding: "10px 14px 14px", flexShrink: 0,
        paddingBottom: "max(14px,env(safe-area-inset-bottom))" }}>
        {chatError && messages.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>
            Resolve the error above to start chatting
          </div>
        ) : (
          <>
            {/* Sentence starters */}
            {showStarters && (
              <div style={{ overflowX: "auto", display: "flex", gap: 7, paddingBottom: 8, paddingTop: 2,
                scrollbarWidth: "none" }}>
                {(STARTERS[level] || STARTERS.B1).map((s, i) => (
                  <button key={i}
                    onClick={() => { setInput(s); setShowStarters(false); inputRef.current?.focus(); }}
                    style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20,
                      border: "1.5px solid #0e7490", background: "#f0f9ff", color: "#0e7490",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                      whiteSpace: "nowrap" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); if (sendError) setSendError(""); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={isOnline ? "Piši na hrvatskom…" : "Offline — reconnect to continue…"}
                disabled={loading || !isOnline || (chatError && messages.length === 0)}
                style={{ flex: 1, padding: "11px 14px", fontSize: 15, borderRadius: 12,
                  border: `1.5px solid ${sendError ? "#fca5a5" : "#e2e8f0"}`,
                  background: "#f8fafc", outline: "none", fontFamily: "'Outfit',sans-serif",
                  transition: "border-color .2s", color: "#1e293b" }}
              />
              {/* Voice input button */}
              {hasSpeechAPI && (
                <button
                  onClick={toggleVoice}
                  disabled={loading || !isOnline}
                  title={listening ? "Stop listening" : "Speak in Croatian (hr-HR)"}
                  style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontSize: 18, cursor: "pointer",
                    border: `2px solid ${listening ? "#dc2626" : "#e2e8f0"}`,
                    background: listening ? "#fef2f2" : "#f8fafc",
                    color: listening ? "#dc2626" : "#94a3b8",
                    animation: listening ? "pulse 1s ease-in-out infinite" : "none",
                    transition: "all .15s" }}>
                  🎤
                </button>
              )}
              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !isOnline}
                style={{ width: 44, height: 44, borderRadius: 12, border: "none", flexShrink: 0, fontSize: 18,
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all .15s",
                  background: input.trim() && !loading ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "#e2e8f0",
                  color: input.trim() && !loading ? "white" : "#94a3b8" }}>
                ➤
              </button>
            </div>

            {/* Bottom toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={requestHint} disabled={loading || messages.length === 0}
                  style={{ background: "none", border: "none", fontSize: 12, color: "#64748b", cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif", fontWeight: 600, padding: "2px 0", opacity: loading ? 0.4 : 1 }}>
                  💡 Hint
                </button>
                <span style={{ color: "#e2e8f0", fontSize: 14 }}>|</span>
                <button
                  onClick={() => setShowStarters(p => !p)}
                  style={{ background: showStarters ? "#0e7490" : "none",
                    border: `1.5px solid ${showStarters ? "#0e7490" : "#e2e8f0"}`,
                    borderRadius: 10, fontSize: 12, padding: "2px 10px",
                    color: showStarters ? "white" : "#64748b",
                    cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                    transition: "all .15s" }}>
                  💬 Phrases
                </button>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {userCount} {userCount === 1 ? "exchange" : "exchanges"}
                {userCount < 2 && " · needs 2 to evaluate"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Word translation tooltip overlay */}
      {WordTooltip}
    </div>
  );
}
