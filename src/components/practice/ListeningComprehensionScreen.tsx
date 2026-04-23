import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { speak, speakSlow, stopAudio } from '../../lib/audio.ts';
import { GRADED_STORIES } from '../../data/gradedStories.js';

// ── Storage key ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'nh_listen_comp_v2';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveProgress(prog: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
  } catch {}
}

// ── Built-in Comprehension Exercises by CEFR Level ────────────────────────────
// Format: { hr: "Croatian sentence (spoken)", en: "correct English answer", opts: ["opt1","opt2","opt3","opt4"] }
// The 'en' field is the correct answer; opts must include en as one of the choices.

const EXERCISES = {
  A1: {
    label: 'A1 — Starter',
    color: '#16a34a',
    headerBg: 'linear-gradient(135deg,#059669,#065f46)',
    bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
    border: '#bbf7d0',
    desc: 'Single words and simple greetings — build your ear from day one',
    sets: [
      {
        title: 'Greetings & Introductions',
        icon: '👋',
        questions: [
          {
            hr: 'Dobar dan.',
            en: 'Good day.',
            opts: ['Good morning.', 'Good day.', 'Good night.', 'Goodbye.'],
          },
          {
            hr: 'Kako se zoveš?',
            en: 'What is your name?',
            opts: ['How are you?', 'Where are you from?', 'What is your name?', 'How old are you?'],
          },
          {
            hr: 'Drago mi je.',
            en: 'Nice to meet you.',
            opts: ['I am happy.', 'Nice to meet you.', 'Thank you.', 'Excuse me.'],
          },
          {
            hr: 'Hvala lijepa.',
            en: 'Thank you very much.',
            opts: ['You are welcome.', 'Please.', 'Thank you very much.', 'I am sorry.'],
          },
          {
            hr: 'Gdje je toalet?',
            en: 'Where is the toilet?',
            opts: [
              'Where is the exit?',
              'Where is the toilet?',
              'Where is the hotel?',
              'Where is the market?',
            ],
          },
          {
            hr: 'Koliko košta?',
            en: 'How much does it cost?',
            opts: [
              'What time is it?',
              'How far is it?',
              'How much does it cost?',
              'How many are there?',
            ],
          },
          {
            hr: 'Govorite li engleski?',
            en: 'Do you speak English?',
            opts: [
              'Do you understand?',
              'Do you speak Croatian?',
              'Do you speak English?',
              'Can you help me?',
            ],
          },
          {
            hr: 'Jedan kava, molim.',
            en: 'One coffee, please.',
            opts: [
              'Two beers, please.',
              'One coffee, please.',
              'One water, please.',
              'One tea, please.',
            ],
          },
        ],
      },
      {
        title: 'Numbers & Colors',
        icon: '🔢',
        questions: [
          {
            hr: 'Imam pet jabuka.',
            en: 'I have five apples.',
            opts: [
              'I have three apples.',
              'I have five apples.',
              'I have seven apples.',
              'I have ten apples.',
            ],
          },
          {
            hr: 'Automobil je crven.',
            en: 'The car is red.',
            opts: ['The car is blue.', 'The car is red.', 'The car is green.', 'The car is white.'],
          },
          {
            hr: 'Koliko imaš godina?',
            en: 'How old are you?',
            opts: [
              'How many brothers do you have?',
              'What day is it?',
              'How old are you?',
              'How many people are there?',
            ],
          },
          {
            hr: 'Kuća je velika i bijela.',
            en: 'The house is big and white.',
            opts: [
              'The house is small and blue.',
              'The house is big and white.',
              'The house is old and yellow.',
              'The house is new and red.',
            ],
          },
          {
            hr: 'Dva i dva su četiri.',
            en: 'Two and two is four.',
            opts: [
              'Two and two is three.',
              'Two and two is five.',
              'Two and two is four.',
              'Three and two is four.',
            ],
          },
          {
            hr: 'More je plavo i lijepo.',
            en: 'The sea is blue and beautiful.',
            opts: [
              'The sky is blue and beautiful.',
              'The sea is green and cold.',
              'The sea is blue and beautiful.',
              'The lake is blue and clear.',
            ],
          },
          {
            hr: 'Imam tri brata i jednu sestru.',
            en: 'I have three brothers and one sister.',
            opts: [
              'I have one brother and three sisters.',
              'I have three brothers and two sisters.',
              'I have three brothers and one sister.',
              'I have two brothers and one sister.',
            ],
          },
        ],
      },
      {
        title: 'Food & Places',
        icon: '🍕',
        questions: [
          {
            hr: 'Idemo u restoran večeras.',
            en: 'We are going to a restaurant tonight.',
            opts: [
              'We are going to a café this morning.',
              'They are going to a restaurant tomorrow.',
              'We are going to a restaurant tonight.',
              'We are going to the market tonight.',
            ],
          },
          {
            hr: 'Pizza je moje omiljeno jelo.',
            en: 'Pizza is my favourite food.',
            opts: [
              'Pasta is my favourite food.',
              'Pizza is my favourite food.',
              'Fish is my favourite dish.',
              'Soup is my favourite meal.',
            ],
          },
          {
            hr: 'Tržnica je blizu stanice.',
            en: 'The market is near the station.',
            opts: [
              'The hotel is near the station.',
              'The market is far from the station.',
              'The market is near the station.',
              'The supermarket is next to the park.',
            ],
          },
          {
            hr: 'Jedan sok, molim.',
            en: 'One juice, please.',
            opts: [
              'One beer, please.',
              'Two juices, please.',
              'One juice, please.',
              'One water, please.',
            ],
          },
          {
            hr: 'Plaža je tu, lijevo.',
            en: 'The beach is here, on the left.',
            opts: [
              'The beach is far, on the right.',
              'The park is here, on the left.',
              'The beach is here, on the left.',
              'The beach is straight ahead.',
            ],
          },
          {
            hr: 'Škola je velika i nova.',
            en: 'The school is big and new.',
            opts: [
              'The school is small and old.',
              'The hospital is big and new.',
              'The school is big and old.',
              'The school is big and new.',
            ],
          },
        ],
      },
    ],
  },
  A2: {
    label: 'A2 — Elementary',
    color: '#0e7490',
    headerBg: 'linear-gradient(135deg,#0e7490,#164e63)',
    bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
    border: '#bae6fd',
    desc: 'Short sentences about daily life — family, food, weather and routines',
    sets: [
      {
        title: 'Daily Routines',
        icon: '🌅',
        questions: [
          {
            hr: 'Svaki dan pijem kavu ujutro.',
            en: 'I drink coffee every morning.',
            opts: [
              'I drink tea every evening.',
              'I drink coffee every morning.',
              'I eat breakfast every morning.',
              'I drink juice every afternoon.',
            ],
          },
          {
            hr: 'On ide na posao autobusom.',
            en: 'He goes to work by bus.',
            opts: [
              'She goes to school by car.',
              'He goes to work by bus.',
              'He goes home by train.',
              'She goes shopping by taxi.',
            ],
          },
          {
            hr: 'Ona kuha večeru svaki dan.',
            en: 'She cooks dinner every day.',
            opts: [
              'She cleans the house every day.',
              'She cooks lunch every day.',
              'She cooks dinner every day.',
              'He cooks breakfast every day.',
            ],
          },
          {
            hr: 'Djeca idu u školu pješice.',
            en: 'The children go to school on foot.',
            opts: [
              'The children go to school by bicycle.',
              'The children go to the park on foot.',
              'The children go to school on foot.',
              'The adults go to work on foot.',
            ],
          },
          {
            hr: 'Volim čitati knjige navečer.',
            en: 'I love reading books in the evening.',
            opts: [
              'I love watching films in the evening.',
              'I love reading books in the morning.',
              'I love reading books in the evening.',
              'I love listening to music in the evening.',
            ],
          },
          {
            hr: 'Tata pere suđe poslije večere.',
            en: 'Dad washes the dishes after dinner.',
            opts: [
              'Mum washes the dishes after dinner.',
              'Dad washes the car after dinner.',
              'Dad washes the dishes after lunch.',
              'Dad washes the dishes after dinner.',
            ],
          },
        ],
      },
      {
        title: 'Family & Food',
        icon: '👨‍👩‍👧',
        questions: [
          {
            hr: 'Moja baka živi u Splitu.',
            en: 'My grandmother lives in Split.',
            opts: [
              'My grandfather lives in Zagreb.',
              'My grandmother lives in Dubrovnik.',
              'My grandmother lives in Split.',
              'My mother lives in Rijeka.',
            ],
          },
          {
            hr: 'Imamo dvoje djece — sina i kćer.',
            en: 'We have two children — a son and a daughter.',
            opts: [
              'We have three children.',
              'They have one son.',
              'We have two children — a son and a daughter.',
              'We have two sons.',
            ],
          },
          {
            hr: 'Za doručak jedem kruh s marmeladom.',
            en: 'For breakfast I eat bread with jam.',
            opts: [
              'For lunch I eat bread with cheese.',
              'For breakfast I eat bread with jam.',
              'For breakfast I eat eggs with bread.',
              'For dinner I eat soup with bread.',
            ],
          },
          {
            hr: 'Prstaci su tipično dalmatinsko jelo.',
            en: 'Date mussels are a typical Dalmatian dish.',
            opts: [
              'Sarma is a typical Dalmatian dish.',
              'Peka is a typical Slavonian dish.',
              'Date mussels are a typical Dalmatian dish.',
              'Burek is a typical Croatian dessert.',
            ],
          },
          {
            hr: 'Kolač je sladak i ukusan.',
            en: 'The cake is sweet and delicious.',
            opts: [
              'The soup is hot and delicious.',
              'The bread is fresh and tasty.',
              'The cake is sweet and delicious.',
              'The coffee is strong and bitter.',
            ],
          },
          {
            hr: 'Moj otac radi u bolnici kao liječnik.',
            en: 'My father works in a hospital as a doctor.',
            opts: [
              'My father works in a school as a teacher.',
              'My mother works in a hospital as a nurse.',
              'My father works in a hospital as a doctor.',
              'My brother works in a hospital as a doctor.',
            ],
          },
          {
            hr: 'Večeramo zajedno svaki petak.',
            en: 'We have dinner together every Friday.',
            opts: [
              'We have lunch together every Friday.',
              'We have dinner together every Sunday.',
              'They have dinner together every Saturday.',
              'We have dinner together every Friday.',
            ],
          },
        ],
      },
      {
        title: 'Shopping & Transport',
        icon: '🛍️',
        questions: [
          {
            hr: 'Autobus polazi svakih dvadeset minuta.',
            en: 'The bus departs every twenty minutes.',
            opts: [
              'The tram departs every twenty minutes.',
              'The bus departs every thirty minutes.',
              'The bus arrives every twenty minutes.',
              'The bus departs every twenty minutes.',
            ],
          },
          {
            hr: 'Ova jakna je preskupa za mene.',
            en: 'This jacket is too expensive for me.',
            opts: [
              'This dress is too big for me.',
              'This jacket is too small for me.',
              'This jacket is too expensive for me.',
              'This coat is a good deal for me.',
            ],
          },
          {
            hr: 'Gdje mogu kupiti razglednice?',
            en: 'Where can I buy postcards?',
            opts: [
              'Where can I buy newspapers?',
              'Where can I buy medicines?',
              'Where can I buy postcards?',
              'Where can I find a post office?',
            ],
          },
          {
            hr: 'Molim vas, ima li slobodnih mjesta u vlaku?',
            en: 'Excuse me, are there any free seats on the train?',
            opts: [
              'Excuse me, when does the train arrive?',
              'Please, are there any free rooms in the hotel?',
              'Excuse me, are there any free seats on the train?',
              'Excuse me, is this the right train for Split?',
            ],
          },
          {
            hr: 'Plaćam karticom, ne gotovinom.',
            en: 'I am paying by card, not with cash.',
            opts: [
              'I am paying in cash, not by card.',
              'I am paying by card, not with cash.',
              'She is paying in instalments, not upfront.',
              'He prefers cash over contactless payment.',
            ],
          },
          {
            hr: 'Trebam kartu za Zagreb i natrag.',
            en: 'I need a ticket to Zagreb and back.',
            opts: [
              'I need a one-way ticket to Zagreb.',
              'I need two tickets to Zagreb.',
              'I need a ticket to Zagreb and back.',
              'I need a bus pass for the whole week.',
            ],
          },
        ],
      },
    ],
  },
  B1: {
    label: 'B1 — Intermediate',
    color: '#d97706',
    headerBg: 'linear-gradient(135deg,#d97706,#92400e)',
    bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    border: '#fde68a',
    desc: 'Conversations and descriptions — travel, plans and expressing opinions',
    sets: [
      {
        title: 'Travel & Directions',
        icon: '✈️',
        questions: [
          {
            hr: 'Vlak za Rijeku polazi u deset i petnaest.',
            en: 'The train to Rijeka departs at ten fifteen.',
            opts: [
              'The train to Rijeka arrives at ten fifteen.',
              'The bus to Rijeka departs at ten fifteen.',
              'The train to Zagreb departs at ten fifteen.',
              'The train to Rijeka departs at ten fifteen.',
            ],
          },
          {
            hr: 'Trebam rezervirati sobu za tri noći.',
            en: 'I need to book a room for three nights.',
            opts: [
              'I need to book a room for two nights.',
              'I need to cancel a room for three nights.',
              'I need to book a table for three people.',
              'I need to book a room for three nights.',
            ],
          },
          {
            hr: 'Plitvička jezera su proglašena zaštićenim parkom 1949. godine.',
            en: 'Plitvice Lakes were declared a protected park in 1949.',
            opts: [
              'Plitvice Lakes became a UNESCO site in 1949.',
              'Krka National Park was founded in 1949.',
              'Plitvice Lakes were declared a protected park in 1979.',
              'Plitvice Lakes were declared a protected park in 1949.',
            ],
          },
          {
            hr: 'Skrenite lijevo kod semafora, a zatim idite ravno.',
            en: 'Turn left at the traffic lights, then go straight on.',
            opts: [
              'Turn right at the crossroads, then turn left.',
              'Turn left at the traffic lights, then go straight on.',
              'Go straight ahead, then turn left at the lights.',
              'Turn left at the corner, then turn right at the lights.',
            ],
          },
          {
            hr: 'Imam alergiju na morske plodove.',
            en: 'I have an allergy to seafood.',
            opts: [
              'I love seafood dishes.',
              'I have an allergy to nuts.',
              'I have an allergy to seafood.',
              'I cannot eat spicy food.',
            ],
          },
        ],
      },
      {
        title: 'Opinions & Plans',
        icon: '💬',
        questions: [
          {
            hr: 'Mislim da je hrvatski jezik težak, ali jako lijep.',
            en: 'I think Croatian is difficult, but very beautiful.',
            opts: [
              'I think Croatian is easy and fun.',
              'He thinks Croatian is the hardest language.',
              'I think Croatian is difficult, but very beautiful.',
              'She thinks Croatian is difficult and boring.',
            ],
          },
          {
            hr: 'Idućeg ljeta planiramo otići na Hvar.',
            en: 'Next summer we plan to go to Hvar.',
            opts: [
              'Last summer we went to Hvar.',
              'Next winter we plan to go to Hvar.',
              'Next summer we plan to go to Hvar.',
              'Next summer they plan to go to Korčula.',
            ],
          },
          {
            hr: 'Ako bude lijepog vremena, idemo na plažu.',
            en: 'If the weather is nice, we will go to the beach.',
            opts: [
              'When the weather is nice, we go to the beach.',
              'If the weather is nice, we will go to the beach.',
              'Because the weather was nice, we went to the beach.',
              'Although the weather was nice, we stayed at home.',
            ],
          },
          {
            hr: 'Volim more, ali bojim se dubloke vode.',
            en: 'I love the sea, but I am afraid of deep water.',
            opts: [
              'I love the sea and I am a strong swimmer.',
              'I hate the sea because I am afraid of water.',
              'I love the sea, but I am afraid of deep water.',
              'She loves the sea but cannot swim.',
            ],
          },
          {
            hr: 'Baka mi je naučila kako se priprema sarma.',
            en: 'My grandmother taught me how to prepare sarma.',
            opts: [
              'My mother learned how to make sarma from a book.',
              'My grandmother bought sarma at the market.',
              'My grandmother taught me how to prepare sarma.',
              'My aunt showed me how to make burek.',
            ],
          },
        ],
      },
      {
        title: 'Work & Study',
        icon: '📚',
        questions: [
          {
            hr: 'Radim od devet do pet, od ponedjeljka do petka.',
            en: 'I work from nine to five, Monday to Friday.',
            opts: [
              'I study from nine to five every day.',
              'I work from eight to four, Monday to Saturday.',
              'I work from nine to five, Monday to Friday.',
              'I work from nine to five, Tuesday to Saturday.',
            ],
          },
          {
            hr: 'Tražim posao u struci — završio sam ekonomski fakultet.',
            en: 'I am looking for a job in my field — I graduated from the economics faculty.',
            opts: [
              'I am looking for a job in law — I graduated from the law faculty.',
              'I am looking for a job in my field — I graduated from the economics faculty.',
              'I am looking for an internship — I am still studying economics.',
              'I finished medical school and I am now looking for a hospital placement.',
            ],
          },
          {
            hr: 'Kolegij počinje u deset i pol i traje dva sata.',
            en: 'The lecture starts at half past ten and lasts two hours.',
            opts: [
              'The seminar starts at ten and lasts one hour.',
              'The lecture starts at half past nine and lasts two hours.',
              'The lecture starts at half past ten and lasts two hours.',
              'The exam starts at half past ten and lasts three hours.',
            ],
          },
          {
            hr: 'Učim za ispit cijeli tjedan i tek ću vidjeti hoće li biti dovoljno.',
            en: 'I have been studying for the exam all week and will just have to see if it will be enough.',
            opts: [
              'I studied for the exam yesterday and I am confident I will pass.',
              'I have been studying for the exam all week and will just have to see if it will be enough.',
              'She gave up studying for the exam because it was too difficult.',
              'I passed the exam without studying because it was easy.',
            ],
          },
          {
            hr: 'Prijevod mora biti gotov do petka jer izdavač čeka na rukopis.',
            en: 'The translation must be finished by Friday because the publisher is waiting for the manuscript.',
            opts: [
              'The translation must be finished by Monday because the author is waiting.',
              'The report must be ready by Friday because the client is expecting it.',
              'The translation must be finished by Friday because the publisher is waiting for the manuscript.',
              'The manuscript must be edited by Friday for the annual conference.',
            ],
          },
          {
            hr: 'Svima je jasno da digitalne vještine postaju sve važnije na tržištu rada.',
            en: 'It is clear to everyone that digital skills are becoming increasingly important in the job market.',
            opts: [
              'Most employers still prefer candidates with traditional rather than digital skills.',
              'Digital skills are only important for young people entering the job market.',
              'It is clear to everyone that digital skills are becoming increasingly important in the job market.',
              'The job market in Croatia remains focused on manual trades rather than technology.',
            ],
          },
        ],
      },
    ],
  },
  B2: {
    label: 'B2 — Upper Intermediate',
    color: '#7c3aed',
    headerBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
    border: '#ddd6fe',
    desc: 'Complex sentences, nuance, culture and abstract topics',
    sets: [
      {
        title: 'Culture & History',
        icon: '🏛️',
        questions: [
          {
            hr: 'Hrvatska je postala članica Europske unije 2013. godine, što je bio važan korak za njenu europsku budućnost.',
            en: 'Croatia joined the European Union in 2013, which was an important step for its European future.',
            opts: [
              'Croatia joined the EU in 2004 as the eighth member.',
              'Croatia joined the EU in 2013, completing accession talks started in 2005.',
              'Croatia joined the European Union in 2013, which was an important step for its European future.',
              'Croatia applied for EU membership in 2013 but did not join until 2020.',
            ],
          },
          {
            hr: 'Dubrovnik je u 14. stoljeću razvio jedan od prvih sustava karantene na svijetu.',
            en: 'Dubrovnik developed one of the first quarantine systems in the world in the 14th century.',
            opts: [
              'Venice invented the quarantine system in the 15th century.',
              'Dubrovnik developed one of the first quarantine systems in the world in the 14th century.',
              'Dubrovnik established the first hospital in Europe in the 14th century.',
              'Dubrovnik became a free republic in the 14th century.',
            ],
          },
          {
            hr: 'Kravata, koju danas svi nose, dobila je ime po hrvatskim vojnicima koji su je nosili u 17. stoljeću.',
            en: 'The necktie, which everyone wears today, got its name from Croatian soldiers who wore it in the 17th century.',
            opts: [
              'The necktie was invented in France in the 18th century.',
              'Croatian soldiers in the 17th century wore a neck cloth that inspired the French word cravate.',
              'The necktie, which everyone wears today, got its name from Croatian soldiers who wore it in the 17th century.',
              'The word cravat comes from the Slavic word for a scarf worn in the 16th century.',
            ],
          },
          {
            hr: 'Nikola Tesla, iako rodom iz Smiljana u Lici, školovao se i radio u nekoliko europskih zemalja prije nego što je emigrirao u Ameriku.',
            en: 'Nikola Tesla, although born in Smiljan in Lika, studied and worked in several European countries before emigrating to America.',
            opts: [
              'Nikola Tesla was born in Serbia and moved to Croatia as a child.',
              'Nikola Tesla emigrated directly from his birthplace to America without working in Europe.',
              'Nikola Tesla, although born in Smiljan in Lika, studied and worked in several European countries before emigrating to America.',
              'Nikola Tesla spent his entire career in Vienna before moving to New York.',
            ],
          },
          {
            hr: 'Sinjska alka, viteška igra koja se održava svake godine u Sinju, uvrštena je na UNESCO-ov popis nematerijalne kulturne baštine.',
            en: 'The Sinjska Alka, a knightly tournament held every year in Sinj, is inscribed on the UNESCO list of intangible cultural heritage.',
            opts: [
              'The Sinjska Alka is a folk dance festival held annually in Split.',
              'The Sinjska Alka was removed from the UNESCO heritage list in 2010.',
              'The Sinjska Alka, a knightly tournament held every year in Sinj, is inscribed on the UNESCO list of intangible cultural heritage.',
              'The Sinjska Alka is a rowing competition on the Cetina river near Sinj.',
            ],
          },
          {
            hr: 'Klapa je oblik a cappella višeglasnog pjevanja koji potječe iz Dalmacije i danas je simbol hrvatskog kulturnog identiteta.',
            en: 'Klapa is a form of a cappella polyphonic singing originating in Dalmatia and today a symbol of Croatian cultural identity.',
            opts: [
              'Klapa is an instrument similar to a mandolin that is unique to the island of Brač.',
              'Klapa refers to a type of traditional Croatian dance performed at weddings.',
              'Klapa is a form of a cappella polyphonic singing originating in Dalmatia and today a symbol of Croatian cultural identity.',
              'Klapa is a festival of sacred music held in Dubrovnik each summer.',
            ],
          },
          {
            hr: 'Zlatna kuna, proglašena najljepšom valutom na svijetu, bila je u optjecaju od 1994. do 2023., kada je Hrvatska prešla na euro.',
            en: 'The gold kuna, named the most beautiful currency in the world, was in circulation from 1994 to 2023, when Croatia switched to the euro.',
            opts: [
              'Croatia adopted the euro in 2013 when it joined the European Union.',
              'The kuna was replaced by the euro after a public referendum in 2022.',
              'The gold kuna, named the most beautiful currency in the world, was in circulation from 1994 to 2023, when Croatia switched to the euro.',
              'The Croatian kuna was introduced in 1991 when Croatia declared independence.',
            ],
          },
        ],
      },
      {
        title: 'Abstract & Nuanced',
        icon: '🎭',
        questions: [
          {
            hr: 'Što se tiče naše tradicije, važno je da mladi naraštaji nauče ne samo jezik nego i vrijednosti koje se prenose s koljena na koljeno.',
            en: 'As far as our tradition is concerned, it is important that young generations learn not just the language but also the values passed down through generations.',
            opts: [
              'Young people today do not appreciate traditional values as much as their grandparents did.',
              'Language is the most important part of any tradition and should be preserved.',
              'As far as our tradition is concerned, it is important that young generations learn not just the language but also the values passed down through generations.',
              'Our tradition requires that children speak only Croatian at home.',
            ],
          },
          {
            hr: 'Diaspora Hrvata u Sjevernoj Americi čuva jezik i kulturu kroz zajednička društva, crkve i tečajeve hrvatskog.',
            en: 'The Croatian diaspora in North America preserves the language and culture through community organizations, churches and Croatian language classes.',
            opts: [
              'Croatian immigrants in North America have mostly forgotten their language within two generations.',
              'The Croatian diaspora in Australia is larger than in North America.',
              'The Croatian diaspora in North America preserves the language and culture through community organizations, churches and Croatian language classes.',
              'Croatian language classes in North America are mostly attended by non-Croatians.',
            ],
          },
          {
            hr: 'Glagoljaška tradicija, odnosno pisanje na glagoljici, dio je posebnog identiteta koji razlikuje hrvatsko kršćanstvo od ostalih europskih tradicija.',
            en: 'The Glagolitic tradition, that is, writing in the Glagolitic script, is part of a special identity that distinguishes Croatian Christianity from other European traditions.',
            opts: [
              'Glagolitic script was invented by Saints Cyril and Methodius for the Bulgarians.',
              'The Glagolitic tradition disappeared from Croatia in the 15th century.',
              'Glagolitic script is used in Croatia today for official church documents.',
              'The Glagolitic tradition, that is, writing in the Glagolitic script, is part of a special identity that distinguishes Croatian Christianity from other European traditions.',
            ],
          },
          {
            hr: 'Pojam "čakavski" označava jedan od triju narječja hrvatskog jezika, koji se govori pretežno na otocima i u Istri.',
            en: 'The term "Chakavian" refers to one of the three dialects of the Croatian language, spoken mainly on the islands and in Istria.',
            opts: [
              'Chakavian is the standard dialect used in Croatian schools and media.',
              'Chakavian is spoken only in the city of Zagreb and its surroundings.',
              'The term "Chakavian" refers to one of the three dialects of the Croatian language, spoken mainly on the islands and in Istria.',
              'Chakavian refers to a form of writing developed by monks in medieval Dalmatia.',
            ],
          },
          {
            hr: 'Upravo zbog geografske raznolikosti, od panonske ravnice do Jadrana, Hrvatska posjeduje iznimnu biološku raznovrsnost.',
            en: 'Precisely because of its geographic diversity, from the Pannonian plain to the Adriatic, Croatia possesses exceptional biodiversity.',
            opts: [
              'Croatia has low biodiversity because of its small size and warm climate.',
              "Croatia's biodiversity is threatened primarily by coastal development along the Adriatic.",
              'Precisely because of its geographic diversity, from the Pannonian plain to the Adriatic, Croatia possesses exceptional biodiversity.',
              'The Pannonian plain in Croatia is the most biodiverse region due to its rich soil.',
            ],
          },
          {
            hr: 'U suvremenom hrvatskom društvu sve je veći jaz između urbanih i ruralnih sredina, što utječe na demografsku sliku cijele države.',
            en: 'In modern Croatian society the gap between urban and rural areas is growing, which affects the demographic picture of the whole country.',
            opts: [
              'Croatian rural areas are growing faster than cities due to agricultural subsidies.',
              'The gap between rich and poor in Croatia has stayed the same over the past decade.',
              'In modern Croatian society the gap between urban and rural areas is growing, which affects the demographic picture of the whole country.',
              'Croatia has successfully reversed rural depopulation through government resettlement programmes.',
            ],
          },
        ],
      },
      {
        title: 'Media & Society',
        icon: '📰',
        questions: [
          {
            hr: 'Sloboda medija i neovisnost novinara ključni su za funkcioniranje demokratskog društva.',
            en: 'Media freedom and journalist independence are essential for a functioning democratic society.',
            opts: [
              'Government ownership of media ensures accurate and unbiased reporting.',
              'Media freedom and journalist independence are essential for a functioning democratic society.',
              'The internet has made traditional journalism completely irrelevant.',
              'Only public broadcasters can guarantee freedom of the press.',
            ],
          },
          {
            hr: 'Hrvatska kinematografija doživjela je međunarodni proboj zahvaljujući filmovima koji prikazuju ratnu traumu i poslijeratnu obnovu.',
            en: 'Croatian cinematography gained international recognition thanks to films depicting war trauma and post-war reconstruction.',
            opts: [
              "Croatian cinema is known mainly for animated films and children's stories.",
              'Croatian films have had no international recognition due to the language barrier.',
              'Croatian cinematography gained international recognition thanks to films depicting war trauma and post-war reconstruction.',
              'Croatian cinema focuses primarily on romantic comedies set in Dalmatia.',
            ],
          },
          {
            hr: 'Sve veća upotreba digitalnih medija mijenja načine na koje mladi Hrvati konzumiraju vijesti i kulturu.',
            en: 'The growing use of digital media is changing the ways in which young Croatians consume news and culture.',
            opts: [
              'Young Croatians prefer printed newspapers to online news sources.',
              'Digital media has had no significant impact on Croatian cultural consumption.',
              'The growing use of digital media is changing the ways in which young Croatians consume news and culture.',
              'Croatian television viewership has increased dramatically since the rise of streaming platforms.',
            ],
          },
          {
            hr: 'Turizam čini znatan udio u hrvatskom BDP-u, no donosi i izazove poput sezonalnosti i pritiska na okoliš.',
            en: "Tourism makes up a significant share of Croatia's GDP, but also brings challenges such as seasonality and environmental pressure.",
            opts: [
              'Tourism in Croatia is evenly distributed throughout the year with no seasonal peaks.',
              'Croatia has banned further tourist development to protect its natural environment.',
              "Tourism makes up a significant share of Croatia's GDP, but also brings challenges such as seasonality and environmental pressure.",
              'Croatian tourism is dominated by domestic visitors rather than international tourists.',
            ],
          },
          {
            hr: 'Emigracija mladih obrazovanih Hrvata u zapadnu Europu postala je jedan od glavnih demografskih izazova s kojima se zemlja suočava.',
            en: 'The emigration of young educated Croatians to western Europe has become one of the main demographic challenges the country faces.',
            opts: [
              'Croatia has seen a large influx of foreign workers replacing those who have emigrated.',
              'The emigration of Croatians peaked in the 1970s during socialist Yugoslavia.',
              'The emigration of young educated Croatians to western Europe has become one of the main demographic challenges the country faces.',
              "Croatia's population is growing steadily due to high birth rates and immigration.",
            ],
          },
        ],
      },
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shuffle(arr: any[]) {
  const b = [...arr];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Extract key vocabulary words from the Croatian sentence (words ≥ 4 chars, skip common short words) */
const STOP_WORDS = new Set([
  'gdje',
  'kako',
  'kada',
  'koji',
  'koja',
  'koje',
  'što',
  'ima',
  'ima',
  'sam',
  'ste',
  'smo',
  'ću',
  'će',
  'će',
  'ali',
  'ili',
  'jer',
  'dok',
  'bez',
  'kod',
  'nad',
  'pod',
  'pred',
  'pri',
  'kroz',
  'između',
  'zbog',
  'prema',
  'jedan',
  'jedna',
  'jedno',
  'dva',
  'dvije',
  'tri',
  'ovo',
  'ova',
  'ove',
  'taj',
  'ta',
  'to',
  'ti',
  'te',
  'on',
  'ona',
  'ono',
  'oni',
  'one',
  'ona',
  'moj',
  'moja',
  'moje',
  'tvoj',
  'tvoja',
  'naš',
  'naša',
  'vaš',
  'vaša',
]);

function extractKeyWords(sentence: string) {
  const words = sentence
    .replace(/[.,!?;:"'«»—–\-\u201c\u201d]/g, ' ')
    .split(/\s+/)
    .map((w) => w.toLowerCase().trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  // deduplicate
  return [...new Set(words)].slice(0, 6);
}

/** Highlight key words in the Croatian transcript */
function HighlightedTranscript({ text, keyWords }: { text: string; keyWords: string[] }) {
  if (!keyWords || keyWords.length === 0) {
    return <span>{text}</span>;
  }
  // Build regex from keyWords (case-insensitive, whole word-ish)
  const escaped = keyWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <span>
      {parts.map((part, i) => {
        const isKey = keyWords.some((w) => w.toLowerCase() === part.toLowerCase());
        return isKey ? (
          <mark
            key={i}
            style={{
              background: 'rgba(251,191,36,.35)',
              borderRadius: 3,
              padding: '0 2px',
              fontWeight: 700,
              color: 'inherit',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

/** Generate a stable question ID based on level + set index + question index */
function _makeQId(levelId: string, setIdx: number, qIdx: number) {
  return `${levelId}__s${setIdx}__q${qIdx}`;
}

/** Find the graded story closest to the given CEFR level */
function getBonusStory(levelId: string) {
  const stories = GRADED_STORIES.filter((s) => s.level === levelId);
  if (stories.length > 0) return stories[Math.floor(Math.random() * stories.length)];
  // fallback: any story
  if (GRADED_STORIES.length > 0) return GRADED_STORIES[0];
  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AudioControls({ text, accentColor }: { text: string; accentColor: string }) {
  const [playing, setPlaying] = useState(false);
  const [slowPlaying, setSlowPlaying] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, []);

  // Auto-play on mount
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    setPlaying(true);
    speak(text).finally(() => {
      if (!cancelled && mountedRef.current) setPlaying(false);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const handleReplay = useCallback(() => {
    if (playing || slowPlaying) return;
    setPlaying(true);
    speak(text).finally(() => {
      if (mountedRef.current) setPlaying(false);
    });
  }, [text, playing, slowPlaying]);

  const handleSlow = useCallback(() => {
    if (playing || slowPlaying) return;
    setSlowPlaying(true);
    speakSlow(text).finally(() => {
      if (mountedRef.current) setSlowPlaying(false);
    });
  }, [text, playing, slowPlaying]);

  const handleStop = useCallback(() => {
    stopAudio();
    setPlaying(false);
    setSlowPlaying(false);
  }, []);

  const isActive = playing || slowPlaying;

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      <button
        onClick={isActive ? handleStop : handleReplay}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: 'none',
          background: isActive ? '#fee2e2' : accentColor,
          color: isActive ? '#b91c1c' : 'white',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          transition: 'background .2s',
        }}
      >
        {isActive ? '⏹ Stop' : '▶ Replay'}
      </button>
      <button
        onClick={handleSlow}
        disabled={isActive}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: `1.5px solid ${accentColor}`,
          background: 'transparent',
          color: accentColor,
          fontSize: 13,
          fontWeight: 700,
          cursor: isActive ? 'default' : 'pointer',
          fontFamily: "'Outfit',sans-serif",
          opacity: isActive ? 0.5 : 1,
          transition: 'opacity .2s',
        }}
      >
        🐢 Play slow
      </button>
    </div>
  );
}

function TranscriptToggle({
  text,
  keyWords,
  accentColor,
}: {
  text: string;
  keyWords: string[];
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'transparent',
          border: `1.5px solid var(--card-b)`,
          borderRadius: 10,
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--subtext)',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        {open ? '🙈 Hide transcript' : '📝 Show transcript'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 10,
            padding: '14px 16px',
            background: 'var(--bar-bg)',
            borderRadius: 12,
            border: '1.5px solid var(--card-b)',
            animation: 'fadeIn .2s ease',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 8,
            }}
          >
            Croatian transcript
          </div>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
            }}
          >
            <HighlightedTranscript text={text} keyWords={keyWords} />
          </div>
          {keyWords.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keyWords.map((w) => (
                <span
                  key={w}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(251,191,36,.2)',
                    border: '1px solid rgba(251,191,36,.5)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function WeakWordsPanel({
  missedQuestions,
  accentColor,
  onAddToFlashcards,
}: {
  missedQuestions: any[];
  accentColor: string;
  onAddToFlashcards: (words: any[]) => void;
}) {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [added, setAdded] = useState(false);
  if (missedQuestions.length === 0) return null;

  function handleAdd() {
    onAddToFlashcards(missedQuestions);
    setAdded(true);
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 18px',
        background: 'rgba(239,68,68,.05)',
        border: '1.5px solid rgba(239,68,68,.2)',
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginBottom: 12 }}>
        📌 Words to review ({missedQuestions.length} missed)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {missedQuestions.map((q, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display',serif",
                marginBottom: 3,
              }}
            >
              &ldquo;{q.hr}&rdquo;
            </div>
            <div style={{ color: 'var(--subtext)', fontSize: 12 }}>{q.en}</div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAdd}
        disabled={added}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: added ? '#dcfce7' : '#b91c1c',
          color: added ? '#166534' : 'white',
          fontSize: 14,
          fontWeight: 800,
          cursor: added ? 'default' : 'pointer',
          fontFamily: "'Outfit',sans-serif",
          transition: 'background .3s',
        }}
      >
        {added ? '✓ Added to flashcard review' : '+ Add to flashcard review'}
      </button>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function BonusStoryCard({
  levelId,
  accentColor,
  onOpen,
}: {
  levelId: string;
  accentColor: string;
  onOpen: (story: any) => void;
}) {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const story = getBonusStory(levelId);
  if (!story) return null;
  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 18px',
        background: 'linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.03))',
        border: '1.5px solid rgba(124,58,237,.25)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#7c3aed',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          marginBottom: 8,
        }}
      >
        🎁 Bonus: Extended Listening
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 30 }}>{story.icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
            {story.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
            {story.titleEn} · {story.duration} min · {story.level}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 14, lineHeight: 1.5 }}>
        {story.intro}
      </div>
      <button
        onClick={() => onOpen(story)}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: '#7c3aed',
          color: 'white',
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        Listen to story →
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GradedStoryModal({ story, onClose }: { story: any; onClose: () => void }) {
  const [paraIdx, setParaIdx] = useState(0);
  const [showEn, setShowEn] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, []);

  const para = story.paragraphs[paraIdx];
  const totalParas = story.paragraphs.length;

  function handleParaAudio() {
    speak(para.hr);
  }

  function handleQuizAnswer(optIdx: number) {
    if (quizAnswer !== null) return;
    setQuizAnswer(optIdx);
    if (optIdx === story.quiz[quizIdx].correct) setQuizScore((s) => s + 1);
  }

  function handleNextQuiz() {
    if (quizIdx + 1 >= story.quiz.length) {
      setQuizDone(true);
    } else {
      setQuizIdx((i) => i + 1);
      setQuizAnswer(null);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 18px 32px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
              }}
            >
              {story.icon} {story.level} Graded Story
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display',serif",
                marginTop: 2,
              }}
            >
              {story.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bar-bg)',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--subtext)',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {!quizMode ? (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {story.paragraphs.map((_: any, i: number) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i <= paraIdx ? '#7c3aed' : 'var(--bar-bg)',
                    transition: 'background .3s',
                  }}
                />
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
              Paragraph {paraIdx + 1} of {totalParas}
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {para.hr}
              </div>
            </div>

            {showEn && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(124,58,237,.06)',
                  borderRadius: 10,
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--subtext)',
                  lineHeight: 1.6,
                  animation: 'fadeIn .2s ease',
                }}
              >
                {para.en}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={handleParaAudio}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ▶ Listen
              </button>
              <button
                onClick={() => setShowEn((o) => !o)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--card-b)',
                  background: 'transparent',
                  color: 'var(--subtext)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showEn ? 'Hide English' : 'Show English'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {paraIdx > 0 && (
                <button
                  onClick={() => {
                    setParaIdx((i) => i - 1);
                    setShowEn(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: '1.5px solid var(--card-b)',
                    background: 'transparent',
                    color: 'var(--body)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Previous
                </button>
              )}
              {paraIdx + 1 < totalParas ? (
                <button
                  onClick={() => {
                    setParaIdx((i) => i + 1);
                    setShowEn(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Next →
                </button>
              ) : story.quiz && story.quiz.length > 0 ? (
                <button
                  onClick={() => setQuizMode(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Take quiz →
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Finish ✓
                </button>
              )}
            </div>
          </>
        ) : quizDone ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 56 }}>{quizScore === story.quiz.length ? '🌟' : '🎉'}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', marginTop: 12 }}>
              {quizScore}/{story.quiz.length} correct
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 12,
              }}
            >
              Quiz · {quizIdx + 1}/{story.quiz.length}
            </div>
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}
              >
                {story.quiz[quizIdx].q}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>
                {story.quiz[quizIdx].qEn}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {story.quiz[quizIdx].opts.map((opt: any, idx: number) => {
                const correct = story.quiz[quizIdx].correct;
                let bg = 'var(--card)',
                  border = '1.5px solid var(--card-b)',
                  color = 'var(--body)';
                if (quizAnswer !== null) {
                  if (idx === correct) {
                    bg = '#f0fdf4';
                    border = '1.5px solid #bbf7d0';
                    color = '#166534';
                  } else if (idx === quizAnswer) {
                    bg = '#fff1f2';
                    border = '1.5px solid #fecaca';
                    color = '#b91c1c';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border,
                      background: bg,
                      color,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: quizAnswer !== null ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {quizAnswer !== null && idx === correct && (
                      <span style={{ marginRight: 6 }}>✓</span>
                    )}
                    {quizAnswer !== null && idx === quizAnswer && idx !== correct && (
                      <span style={{ marginRight: 6 }}>✗</span>
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
            {quizAnswer !== null && (
              <button
                onClick={handleNextQuiz}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '13px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {quizIdx + 1 >= story.quiz.length ? 'See results' : 'Next question →'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ListeningComprehensionScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number) => void;
}) {
  useApp();

  // Navigation state
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSet, setSelectedSet] = useState<any | null>(null);
  const [selectedSetIdx, setSelectedSetIdx] = useState<number | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shuffledQuestions, setShuffledQuestions] = useState<any[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);

  // Bonus story modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bonusStory, setBonusStory] = useState<any | null>(null);

  // Persist progress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [progress, setProgress] = useState<any>(() => loadProgress());

  // Computed: level completion
  const levelIds = Object.keys(EXERCISES);
  const levelData = selectedLevel
    ? ((EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel] ?? null)
    : null;

  function getCompletedQuestions(levelId: string, setIdx: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lvl = (progress as any)[levelId] || {};
    const set = lvl[setIdx] || {};
    return Object.keys(set).filter((k) => set[k] === true).length;
  }

  function getTotalQuestionsForSet(levelId: string, setIdx: number) {
    return (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets[setIdx]!.questions
      .length;
  }

  function isSetComplete(levelId: string, setIdx: number) {
    const total = getTotalQuestionsForSet(levelId, setIdx);
    return getCompletedQuestions(levelId, setIdx) >= total;
  }

  function isLevelComplete(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.every((_, si) => isSetComplete(levelId, si));
  }

  function getLevelCompletionCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getCompletedQuestions(levelId, si), 0);
  }

  function getLevelTotalCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getTotalQuestionsForSet(levelId, si), 0);
  }

  function markQuestionDone(levelId: string, setIdx: number, qIdx: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setProgress((prev: any) => {
      const next = {
        ...prev,
        [levelId]: {
          ...(prev[levelId] || {}),
          [setIdx]: {
            ...((prev[levelId] || {})[setIdx] || {}),
            [qIdx]: true,
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startSet(setData: any, setIdx: number) {
    // Build ordered questions preserving original indices for progress tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const indexed = setData.questions.map((q: any, i: number) => ({ ...q, _origIdx: i }));
    const shuffled = shuffle(indexed).map((q) => ({ ...q, opts: shuffle(q.opts) }));
    setShuffledQuestions(shuffled);
    setSelectedSet(setData);
    setSelectedSetIdx(setIdx);
    setQuestionIdx(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setMissedQuestions([]);
  }

  function handleAnswer(opt: string) {
    if (chosen !== null) return;
    setChosen(opt);
    const q = shuffledQuestions![questionIdx]!;
    const correct = opt === q.en;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setMissedQuestions((prev) => [...prev, { hr: q.hr, en: q.en }]);
    }
    // Mark this question as done in progress
    markQuestionDone(selectedLevel!, selectedSetIdx!, q._origIdx);
  }

  function next() {
    const qs = shuffledQuestions!;
    if (questionIdx + 1 >= qs.length) {
      setFinished(true);
      // `score` already includes the last answer (handleAnswer incremented it before Next was clickable).
      const finalScore = score;
      const xp = Math.round((finalScore / qs.length) * 15) + 5;
      if (award) award(xp);
    } else {
      setQuestionIdx((i) => i + 1);
      setChosen(null);
    }
  }

  function reset() {
    stopAudio();
    setSelectedSet(null);
    setSelectedSetIdx(null);
    setShuffledQuestions(null);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setQuestionIdx(0);
    setMissedQuestions([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleAddToFlashcards(words: any[]) {
    // Dispatch event to app-level handler if available
    try {
      window.dispatchEvent(
        new CustomEvent('nh:add-weak-words', {
          detail: { words, source: 'listening-comprehension', level: selectedLevel },
        }),
      );
    } catch {}
  }

  // ── Finished screen ──────────────────────────────────────────────────────
  if (finished && shuffledQuestions) {
    const total = shuffledQuestions.length;
    const displayScore = score;
    const pct = Math.round((displayScore / total) * 100);
    const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel!]!;
    const levelNowComplete = isLevelComplete(selectedLevel!);

    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '40px 20px 24px' }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🌟' : pct >= 60 ? '🎉' : '💪'}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              marginTop: 12,
            }}
          >
            {pct >= 80 ? 'Odlično!' : pct >= 60 ? 'Dobro!' : 'Vježbaj dalje!'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 8 }}>
            {displayScore}/{total} correct · {pct}%
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 8 }}>
            +{Math.round((pct / 100) * 15) + 5} XP
          </div>

          {pct < 60 && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.25)',
                borderRadius: 12,
                fontSize: 13,
                color: '#92400e',
                fontWeight: 600,
              }}
            >
              Try listening with headphones — catching every syllable takes practice!
            </div>
          )}

          {levelNowComplete && (
            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                background: 'linear-gradient(135deg,rgba(16,163,74,.12),rgba(16,163,74,.04))',
                border: '1.5px solid rgba(16,163,74,.3)',
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>
                {selectedLevel} Level Complete!
              </div>
              <div style={{ fontSize: 13, color: '#166534', opacity: 0.8, marginTop: 4 }}>
                You have finished all exercises at this level.
              </div>
            </div>
          )}
        </div>

        <WeakWordsPanel
          missedQuestions={missedQuestions}
          accentColor={ld.color}
          onAddToFlashcards={handleAddToFlashcards}
        />

        <BonusStoryCard levelId={selectedLevel!} accentColor={ld.color} onOpen={setBonusStory} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 0' }}>
          <button className="b bp" onClick={reset} style={{ width: '100%' }}>
            Try another set
          </button>
          <button
            className="b bg"
            onClick={() => {
              reset();
              setSelectedLevel(null);
            }}
            style={{ width: '100%' }}
          >
            ← Choose a different level
          </button>
        </div>

        {bonusStory && <GradedStoryModal story={bonusStory} onClose={() => setBonusStory(null)} />}
      </div>
    );
  }

  // ── Active question ──────────────────────────────────────────────────────
  if (selectedSet && shuffledQuestions) {
    const q = shuffledQuestions[questionIdx]!;
    const total = shuffledQuestions.length;
    const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel!]!;
    const keyWords = extractKeyWords(q.hr);

    // Completion within the set
    const completedInSet = getCompletedQuestions(selectedLevel!, selectedSetIdx!);
    const totalInSet = getTotalQuestionsForSet(selectedLevel!, selectedSetIdx!);

    return (
      <div className="scr-wrap" style={{ paddingBottom: 24 }}>
        {/* Top bar: back + progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button
            onClick={reset}
            style={{
              background: 'var(--bar-bg)',
              border: 'none',
              borderRadius: 10,
              padding: '6px 12px',
              color: 'var(--subtext)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'var(--bar-bg)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: (questionIdx / total) * 100 + '%',
                height: '100%',
                background: ld.color,
                borderRadius: 3,
                transition: 'width .3s ease',
              }}
            />
          </div>
          <div
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              background: ld.headerBg,
              fontSize: 11,
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {selectedLevel}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--subtext)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {questionIdx + 1}/{total}
          </div>
        </div>

        {/* Set progress indicator */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--subtext)',
            fontWeight: 600,
            marginBottom: 14,
            paddingLeft: 2,
          }}
        >
          {selectedSet.icon} {selectedSet.title} · {completedInSet}/{totalInSet} completed
        </div>

        {/* Question card */}
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '20px 18px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: ld.color,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 10,
            }}
          >
            🎧 Listen & understand
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            &ldquo;{q.hr}&rdquo;
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 0 }}
          >
            What does this mean in English?
          </div>

          {/* TTS controls */}
          <AudioControls
            key={`${selectedLevel}-${selectedSetIdx}-${questionIdx}`}
            text={q.hr}
            accentColor={ld.color}
          />

          {/* Transcript toggle — only after answering */}
          {chosen !== null && (
            <TranscriptToggle text={q.hr} keyWords={keyWords} accentColor={ld.color} />
          )}
        </div>

        {/* Answer options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.opts.map((opt: string) => {
            const isCorrect = opt === q.en;
            const isChosen = opt === chosen;
            let bg = 'var(--card)',
              border = '1.5px solid var(--card-b)',
              color = 'var(--body)';
            if (chosen !== null) {
              if (isCorrect) {
                bg = 'var(--success-bg, #f0fdf4)';
                border = '1.5px solid var(--success-b, #bbf7d0)';
                color = 'var(--success)';
              } else if (isChosen) {
                bg = '#fff1f2';
                border = '1.5px solid #fecaca';
                color = '#b91c1c';
              }
            }
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  border,
                  background: bg,
                  color,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: chosen ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  lineHeight: 1.4,
                  transition: 'background .2s, border .2s',
                }}
              >
                {chosen !== null && isCorrect && <span style={{ marginRight: 8 }}>✓</span>}
                {chosen !== null && isChosen && !isCorrect && (
                  <span style={{ marginRight: 8 }}>✗</span>
                )}
                {opt}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <button
            onClick={next}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: ld.color,
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 900,
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {questionIdx + 1 >= total ? 'See Results' : 'Next →'}
          </button>
        )}
      </div>
    );
  }

  // ── Set selection ────────────────────────────────────────────────────────
  if (selectedLevel && levelData) {
    const completed = getLevelCompletionCount(selectedLevel);
    const totalQ = getLevelTotalCount(selectedLevel);
    const pct = totalQ > 0 ? Math.round((completed / totalQ) * 100) : 0;
    const lvlComplete = isLevelComplete(selectedLevel);

    return (
      <div className="scr-wrap" style={{ paddingBottom: 24 }}>
        <button
          onClick={() => setSelectedLevel(null)}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Levels
        </button>

        <div
          style={{
            background: levelData.headerBg,
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'rgba(255,255,255,.55)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              marginBottom: 4,
            }}
          >
            {selectedLevel} Comprehension
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            {levelData.label}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 12 }}>
            {levelData.desc}
          </div>

          {/* Level progress bar */}
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,.2)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: pct + '%',
                height: '100%',
                background: 'white',
                borderRadius: 3,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
              {completed}/{totalQ} questions completed
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.9)', fontWeight: 800 }}>
              {pct}%
            </div>
          </div>
        </div>

        {lvlComplete && (
          <div
            style={{
              margin: '0 0 16px',
              padding: '12px 16px',
              background: 'rgba(16,163,74,.08)',
              border: '1.5px solid rgba(16,163,74,.25)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 24 }}>🏆</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>Level complete!</div>
              <div style={{ fontSize: 12, color: '#166534', opacity: 0.8 }}>
                All sets finished. Review anytime.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {levelData.sets.map((set, si) => {
            const setDone = getCompletedQuestions(selectedLevel, si);
            const setTotal = getTotalQuestionsForSet(selectedLevel, si);
            const complete = setDone >= setTotal;
            return (
              <button
                key={set.title}
                onClick={() => startSet(set, si)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: levelData.bg,
                  border: `1.5px solid ${complete ? levelData.color : levelData.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>{set.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: 'var(--heading)',
                      marginBottom: 3,
                    }}
                  >
                    {set.title}
                    {complete && (
                      <span style={{ marginLeft: 8, fontSize: 13, color: levelData.color }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 6 }}>
                    {set.questions.length} questions · multiple choice
                  </div>
                  {/* Mini progress bar per set */}
                  <div
                    style={{
                      height: 4,
                      background: 'rgba(0,0,0,.08)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: (setDone / setTotal) * 100 + '%',
                        height: '100%',
                        background: levelData.color,
                        borderRadius: 2,
                        transition: 'width .3s',
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, marginTop: 3 }}
                  >
                    {setDone}/{setTotal} done
                  </div>
                </div>
                <div style={{ fontSize: 20, color: levelData.color }}>→</div>
              </button>
            );
          })}
        </div>

        {lvlComplete && (
          <BonusStoryCard
            levelId={selectedLevel}
            accentColor={levelData.color}
            onOpen={setBonusStory}
          />
        )}

        {bonusStory && <GradedStoryModal story={bonusStory} onClose={() => setBonusStory(null)} />}
      </div>
    );
  }

  // ── Level selection ──────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={goBack}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
          borderRadius: 18,
          padding: '18px 18px 16px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 4,
          }}
        >
          LISTENING
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: 'white',
            fontFamily: "'Playfair Display',serif",
            marginBottom: 6,
          }}
        >
          Comprehension Track
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>
          Hear Croatian sentences, choose the correct English meaning · A1 → B2
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {levelIds.map((lid) => {
          const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[lid]!;
          const completed = getLevelCompletionCount(lid);
          const total = getLevelTotalCount(lid);
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const complete = isLevelComplete(lid);
          return (
            <button
              key={lid}
              onClick={() => setSelectedLevel(lid)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 16,
                background: ld.bg,
                border: `1.5px solid ${complete ? ld.color : ld.border}`,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  flexShrink: 0,
                  background: ld.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'white',
                  position: 'relative',
                }}
              >
                {lid}
                {complete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fbbf24',
                      fontSize: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--heading)',
                    marginBottom: 3,
                  }}
                >
                  {ld.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--subtext)',
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {ld.desc}
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: 'rgba(0,0,0,.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: pct + '%',
                      height: '100%',
                      background: ld.color,
                      borderRadius: 2,
                      transition: 'width .4s',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: ld.color, fontWeight: 700 }}>
                  {ld.sets.length} sets · {completed}/{total} questions
                  {complete && ' · Complete 🏆'}
                </div>
              </div>
              <div style={{ fontSize: 20, color: ld.color }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
