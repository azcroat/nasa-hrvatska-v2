const fs = require('fs');
let src = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add lazy, Suspense to React import
src = src.replace(
  'import React, { useState, useEffect, useCallback, useRef } from "react";',
  'import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";'
);

// 2. Replace all component imports with lazy versions
const oldImports = `import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
import LearnTab from "./components/learn/LearnTab.jsx";
import CroatiaTab from "./components/croatia/CroatiaTab.jsx";
import ImmersionHub from "./components/croatia/ImmersionHub.jsx";
import AIConversation from "./components/croatia/AIConversation.jsx";
import ProfileTab from "./components/profile/ProfileTab.jsx";
import HomeTab from "./components/home/HomeTab.jsx";
import PracticeTab from "./components/practice/PracticeTab.jsx";
import LessonScreen from "./components/learn/LessonScreen.jsx";
import GrammarScreen from "./components/learn/GrammarScreen.jsx";
import AlphabetScreen from "./components/learn/AlphabetScreen.jsx";
import ReadingList from "./components/learn/ReadingList.jsx";
import ReadingScreen from "./components/learn/ReadingScreen.jsx";
import BadgesScreen from "./components/profile/BadgesScreen.jsx";
import ProfileScreen from "./components/profile/ProfileScreen.jsx";
import VocabJournal from "./components/profile/VocabJournal.jsx";
import FavoritesScreen from "./components/profile/FavoritesScreen.jsx";
import LearnPath from "./components/profile/LearnPath.jsx";
import ProverbsScreen from "./components/croatia/ProverbsScreen.jsx";
import Flashcards from "./components/practice/Flashcards.jsx";
import ListeningScreen from "./components/practice/ListeningScreen.jsx";
import McGame from "./components/practice/McGame.jsx";
import IdiomsScreen from "./components/croatia/IdiomsScreen.jsx";
// Croatia screens
import { TextingScreen, FriendsScreen, FoodOrderScreen, TransportScreen, EmergencyScreen, PopCultureScreen, PracticalScreen, SchoolScreen, GroceryScreen, HistoryScreen as CroatiaHistoryScreen, BasketballScreen, GymScreen } from "./components/croatia/CroatiaCulture.jsx";
import HNLScreen from "./components/croatia/HNLScreen.jsx";
import CroatiaAthletes from "./components/croatia/CroatiaAthletes.jsx";
import { RegionScreen, RoleplayScreen, RecipesScreen, CityOfDayScreen } from "./components/croatia/RegionScreens.jsx";
import { EventsCalendar, Top100Screen } from "./components/croatia/EventsTop100.jsx";
import KingsScreen from "./components/croatia/KingsScreen.jsx";
import CrMap from "./components/croatia/CrMap.jsx";
// Grammar reference screens
import { AspectScreen, FalseFriendsScreen, DeclensionScreen, BrzaliceScreen, DialectsScreen, DiminutivesScreen, WordFormScreen, ColorQuirkScreen, SvojMojScreen } from "./components/learn/GrammarRef.jsx";
// Vocabulary theme screens
import { CountriesScreen, ProfessionsScreen, WeatherScreen, ClothesScreen, BodyDescScreen, PhonologyScreen } from "./components/learn/VocabScreens.jsx";
// Learn screens
import ModalScreen from "./components/learn/ModalScreen.jsx";
import PadeziScreen from "./components/learn/PadeziScreen.jsx";
import PadezifullScreen from "./components/learn/PadezifullScreen.jsx";
import TensesScreen from "./components/learn/TensesScreen.jsx";
// Exercises
import { ReflexiveScreen, FillStoryScreen, ConvMatchScreen, ScenesScreen, PronounsScreen, GenderDrillScreen, SentenceBuilderScreen, VerbDrillScreen } from "./components/practice/exercises/Exercises1.jsx";
import { TenseFlipScreen, RiddlesScreen, LogicQuizScreen, OrdinalsScreen, RelativePronounsScreen, EmotionGenderScreen, OppositesScreen, CityLocativeScreen, AccusativeDrillScreen } from "./components/practice/exercises/Exercises2.jsx";
import { ColorAgreementScreen, PossessivesScreen, QuestionWordsScreen, NegationScreen, SibilarizationScreen, RestaurantScreen, ProfessionGenderScreen, ComparativesScreen, FutureTenseScreen } from "./components/practice/exercises/Exercises3.jsx";
// Practice game screens
import McResult from "./components/practice/McResult.jsx";
import StoryScreens from "./components/practice/StoryScreens.jsx";
import NumTime from "./components/practice/NumTime.jsx";
import Unjumble from "./components/practice/Unjumble.jsx";
import PrepDrill from "./components/practice/PrepDrill.jsx";
import TypingScreen from "./components/practice/TypingScreen.jsx";
import ConjugationDrill from "./components/practice/ConjugationDrill.jsx";
import ZnamGame from "./components/practice/ZnamGame.jsx";
import BojeGame from "./components/practice/BojeGame.jsx";
import MatchGame from "./components/practice/MatchGame.jsx";
import WordSprint from "./components/practice/WordSprint.jsx";
import SpeakingScreen from "./components/practice/SpeakingScreen.jsx";
// Profile screens
import Leaderboard from "./components/profile/Leaderboard.jsx";`;

const newImports = `// Always-needed: auth + core UI (eager)
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
// Tabs + screens — lazy-loaded on first use
const HomeTab = lazy(() => import("./components/home/HomeTab.jsx"));
const LearnTab = lazy(() => import("./components/learn/LearnTab.jsx"));
const CroatiaTab = lazy(() => import("./components/croatia/CroatiaTab.jsx"));
const ImmersionHub = lazy(() => import("./components/croatia/ImmersionHub.jsx"));
const AIConversation = lazy(() => import("./components/croatia/AIConversation.jsx"));
const ProfileTab = lazy(() => import("./components/profile/ProfileTab.jsx"));
const PracticeTab = lazy(() => import("./components/practice/PracticeTab.jsx"));
const LessonScreen = lazy(() => import("./components/learn/LessonScreen.jsx"));
const GrammarScreen = lazy(() => import("./components/learn/GrammarScreen.jsx"));
const AlphabetScreen = lazy(() => import("./components/learn/AlphabetScreen.jsx"));
const ReadingList = lazy(() => import("./components/learn/ReadingList.jsx"));
const ReadingScreen = lazy(() => import("./components/learn/ReadingScreen.jsx"));
const BadgesScreen = lazy(() => import("./components/profile/BadgesScreen.jsx"));
const ProfileScreen = lazy(() => import("./components/profile/ProfileScreen.jsx"));
const VocabJournal = lazy(() => import("./components/profile/VocabJournal.jsx"));
const FavoritesScreen = lazy(() => import("./components/profile/FavoritesScreen.jsx"));
const LearnPath = lazy(() => import("./components/profile/LearnPath.jsx"));
const ProverbsScreen = lazy(() => import("./components/croatia/ProverbsScreen.jsx"));
const Flashcards = lazy(() => import("./components/practice/Flashcards.jsx"));
const ListeningScreen = lazy(() => import("./components/practice/ListeningScreen.jsx"));
const McGame = lazy(() => import("./components/practice/McGame.jsx"));
const IdiomsScreen = lazy(() => import("./components/croatia/IdiomsScreen.jsx"));
const TextingScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TextingScreen})));
const FriendsScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FriendsScreen})));
const FoodOrderScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FoodOrderScreen})));
const TransportScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TransportScreen})));
const EmergencyScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.EmergencyScreen})));
const PopCultureScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PopCultureScreen})));
const PracticalScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PracticalScreen})));
const SchoolScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.SchoolScreen})));
const GroceryScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GroceryScreen})));
const CroatiaHistoryScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.HistoryScreen})));
const BasketballScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.BasketballScreen})));
const GymScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GymScreen})));
const HNLScreen = lazy(() => import("./components/croatia/HNLScreen.jsx"));
const CroatiaAthletes = lazy(() => import("./components/croatia/CroatiaAthletes.jsx"));
const RegionScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RegionScreen})));
const RoleplayScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RoleplayScreen})));
const RecipesScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RecipesScreen})));
const CityOfDayScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.CityOfDayScreen})));
const EventsCalendar = lazy(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.EventsCalendar})));
const Top100Screen = lazy(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.Top100Screen})));
const KingsScreen = lazy(() => import("./components/croatia/KingsScreen.jsx"));
const CrMap = lazy(() => import("./components/croatia/CrMap.jsx"));
const AspectScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.AspectScreen})));
const FalseFriendsScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.FalseFriendsScreen})));
const DeclensionScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DeclensionScreen})));
const BrzaliceScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.BrzaliceScreen})));
const DialectsScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DialectsScreen})));
const DiminutivesScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DiminutivesScreen})));
const WordFormScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.WordFormScreen})));
const ColorQuirkScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.ColorQuirkScreen})));
const SvojMojScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.SvojMojScreen})));
const CountriesScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.CountriesScreen})));
const ProfessionsScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ProfessionsScreen})));
const WeatherScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.WeatherScreen})));
const ClothesScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ClothesScreen})));
const BodyDescScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.BodyDescScreen})));
const PhonologyScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.PhonologyScreen})));
const ModalScreen = lazy(() => import("./components/learn/ModalScreen.jsx"));
const PadeziScreen = lazy(() => import("./components/learn/PadeziScreen.jsx"));
const PadezifullScreen = lazy(() => import("./components/learn/PadezifullScreen.jsx"));
const TensesScreen = lazy(() => import("./components/learn/TensesScreen.jsx"));
const ReflexiveScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ReflexiveScreen})));
const FillStoryScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.FillStoryScreen})));
const ConvMatchScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ConvMatchScreen})));
const ScenesScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ScenesScreen})));
const PronounsScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.PronounsScreen})));
const GenderDrillScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.GenderDrillScreen})));
const SentenceBuilderScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.SentenceBuilderScreen})));
const VerbDrillScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.VerbDrillScreen})));
const TenseFlipScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.TenseFlipScreen})));
const RiddlesScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RiddlesScreen})));
const LogicQuizScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.LogicQuizScreen})));
const OrdinalsScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OrdinalsScreen})));
const RelativePronounsScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RelativePronounsScreen})));
const EmotionGenderScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.EmotionGenderScreen})));
const OppositesScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OppositesScreen})));
const CityLocativeScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.CityLocativeScreen})));
const AccusativeDrillScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.AccusativeDrillScreen})));
const ColorAgreementScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ColorAgreementScreen})));
const PossessivesScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.PossessivesScreen})));
const QuestionWordsScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.QuestionWordsScreen})));
const NegationScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.NegationScreen})));
const SibilarizationScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.SibilarizationScreen})));
const RestaurantScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.RestaurantScreen})));
const ProfessionGenderScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ProfessionGenderScreen})));
const ComparativesScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ComparativesScreen})));
const FutureTenseScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.FutureTenseScreen})));
const McResult = lazy(() => import("./components/practice/McResult.jsx"));
const StoryScreens = lazy(() => import("./components/practice/StoryScreens.jsx"));
const NumTime = lazy(() => import("./components/practice/NumTime.jsx"));
const Unjumble = lazy(() => import("./components/practice/Unjumble.jsx"));
const PrepDrill = lazy(() => import("./components/practice/PrepDrill.jsx"));
const TypingScreen = lazy(() => import("./components/practice/TypingScreen.jsx"));
const ConjugationDrill = lazy(() => import("./components/practice/ConjugationDrill.jsx"));
const ZnamGame = lazy(() => import("./components/practice/ZnamGame.jsx"));
const BojeGame = lazy(() => import("./components/practice/BojeGame.jsx"));
const MatchGame = lazy(() => import("./components/practice/MatchGame.jsx"));
const WordSprint = lazy(() => import("./components/practice/WordSprint.jsx"));
const SpeakingScreen = lazy(() => import("./components/practice/SpeakingScreen.jsx"));
const Leaderboard = lazy(() => import("./components/profile/Leaderboard.jsx"));`;

if (!src.includes(oldImports)) {
  console.error('ERROR: Could not find old imports block');
  process.exit(1);
}
src = src.replace(oldImports, newImports);

// 3. Wrap main app return content in Suspense (after the outer div + style + W)
const suspenseFallback = `<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,animation:"boat 2s ease-in-out infinite"}}>⛵</div><p style={{color:"#78716c",marginTop:8,fontSize:14,fontWeight:600}}>Loading...</p></div></div>`;

src = src.replace(
  '  return (\n    <div style={darkMode?Object.assign({},BG_DARK):BG_LIGHT}>\n      <style>\n        {CSS}\n      </style>\n      <W />',
  `  return (\n    <div style={darkMode?Object.assign({},BG_DARK):BG_LIGHT}>\n      <style>\n        {CSS}\n      </style>\n      <W />\n      <Suspense fallback={${suspenseFallback}}>`
);

// Close Suspense before final </div>
src = src.replace(
  '      {(as==="app"&&scr!=="welcome"&&scr!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} />}\n    </div>',
  '      {(as==="app"&&scr!=="welcome"&&scr!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} />}\n      </Suspense>\n    </div>'
);

fs.writeFileSync('src/App.jsx', src);
console.log('Done. Total lines:', src.split('\n').length);
