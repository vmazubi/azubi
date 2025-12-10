
export type Language = 'en' | 'de';

export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    tasks: "Tasks & Notes",
    reportBook: "Berichtsheft",
    knowledge: "Knowledge",
    documents: "Documents",
    aiMentor: "AI Mentor",
    about: "About",
    settings: "Settings",
    logout: "Sign Out",
    
    // Dashboard
    welcome: "Hello",
    level: "Level",
    needHelp: "Need help?",
    askAi: "Ask AI Mentor",
    deadline: "Deadline approaching",
    daysLeft: "days left",
    done: "DONE",
    greatJob: "Great job! Everything is up to date.",
    pendingTasks: "Pending Tasks",
    toDo: "To Do",
    completed: "Completed",
    storage: "Storage",
    savedDocs: "Saved Documents",
    recentDocs: "Recent Documents",
    noDocs: "No files uploaded yet.",
    tips: "Azubi Pro Tips",
    
    // Todos
    addTaskPlaceholder: "What did you do today?",
    add: "Add",
    suggestTasks: "Suggest Tasks",
    thinking: "Thinking...",
    noTasks: "No tasks found",
    filterAll: "All",
    
    // Files
    uploadTitle: "Click or Drag to Upload",
    uploadSubtitle: "Files under 500KB are saved to browser storage.",
    
    // Settings
    appearance: "Appearance",
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    themeColor: "Theme Color",
    saveChanges: "Save Changes",
    saved: "Saved!",
    clearData: "Clear Local Data & Logout",
    
    // General
    cancel: "Cancel",
    confirm: "Confirm",
    error: "Error",
    success: "Success"
  },
  de: {
    // Navigation
    dashboard: "Übersicht",
    tasks: "Aufgaben",
    reportBook: "Berichtsheft",
    knowledge: "Warenkunde",
    documents: "Dokumente",
    aiMentor: "KI-Mentor",
    about: "Über uns",
    settings: "Einstellungen",
    logout: "Abmelden",
    
    // Dashboard
    welcome: "Hallo",
    level: "Level",
    needHelp: "Hilfe benötigt?",
    askAi: "Frag den KI-Mentor",
    deadline: "Frist läuft ab",
    daysLeft: "Tage übrig",
    done: "ERLEDIGT",
    greatJob: "Super! Alles auf dem neuesten Stand.",
    pendingTasks: "Offene Aufgaben",
    toDo: "Zu tun",
    completed: "Erledigt",
    storage: "Speicher",
    savedDocs: "Gespeicherte Dateien",
    recentDocs: "Neueste Dokumente",
    noDocs: "Noch keine Dateien hochgeladen.",
    tips: "Azubi Profi-Tipps",
    
    // Todos
    addTaskPlaceholder: "Was hast du heute gemacht?",
    add: "Hinzufügen",
    suggestTasks: "Vorschläge",
    thinking: "Nachdenken...",
    noTasks: "Keine Aufgaben gefunden",
    filterAll: "Alle",

    // Files
    uploadTitle: "Klicken oder Datei hierher ziehen",
    uploadSubtitle: "Dateien unter 500KB werden lokal gespeichert.",

    // Settings
    appearance: "Erscheinungsbild",
    language: "Sprache",
    darkMode: "Dunkelmodus",
    lightMode: "Heller Modus",
    themeColor: "Akzentfarbe",
    saveChanges: "Speichern",
    saved: "Gespeichert!",
    clearData: "Daten löschen & Abmelden",
    
    // General
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    error: "Fehler",
    success: "Erfolg"
  }
};

export const getTranslation = (lang: Language, key: keyof typeof translations['en']) => {
  return translations[lang][key] || translations['en'][key] || key;
};
