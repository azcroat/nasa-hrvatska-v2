/**
 * All localStorage/sessionStorage keys in one place.
 * Prevents key collisions and makes migrations easier.
 */
export const StorageKeys = {
  // User data (synced to Firebase)
  USER_FAVORITES:   'uFavs',
  USER_JOURNAL:     'uJournal',
  USER_STREAK:      'uStreak',
  USER_FREEZES:     'uFreeze',
  USER_PROGRESS:    'uP_',         // + uid suffix
  USER_SRS:         'uSRS',
  USER_FAMILY:      'uFamily',

  // Session
  SESSION:          'uS',
  DARK_MODE:        'darkMode',

  // Daily/weekly state (include date suffix)
  QUEST_PREFIX:     'nh_quest_',     // + questId + '_' + YYYY-MM-DD
  WEEK_XP_PREFIX:   'nh_week_xp_',  // + YYYY-WNN
  COMEBACK_PREFIX:  'nh_comeback_used_', // + YYYY-MM-DD

  // Ceremonies (one-time flags)
  CEREMONY_STREAK:  'nh_ceremony_streak_', // + milestone number
  CEREMONY_STAGE:   'nh_stage',             // + stageNum + '_ceremony'

  // PWA/UX
  PWA_DISMISSED:    'nh_pwa_install_dismissed',
  BACKUP_CONFIRMED: 'fbBackupConfirmed',

  // Gameplay
  XP_COOLDOWN:      'xpCooldown',
  JOURNEY_PREFIX:   'nh_journey_',
};
