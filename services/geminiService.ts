
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { TodoItem, FileDocument, Flashcard } from "../types";

let aiClient: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

const getApiKey = (): string | undefined => {
  // Priority: 1. User's custom key (localStorage) 2. Build-time default key
  const customKey = localStorage.getItem('azubi_custom_api_key');
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return process.env.API_KEY ? process.env.API_KEY.trim() : undefined;
};

const getClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  
  // If we have a client but the key has changed (e.g. user updated settings), reset it
  if (aiClient && currentApiKey !== apiKey) {
    aiClient = null;
  }

  if (!aiClient) {
    if (!apiKey) {
      throw new Error("No API Key available. Please set one in Settings.");
    }
    aiClient = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }
  return aiClient;
};

// Create a chat session with awarenes of the user's current data
export const createChatSession = (
  userContext?: { todos: TodoItem[], files: FileDocument[], name: string },
  language: 'en' | 'de' = 'en'
): Chat => {
  const client = getClient();
  
  let systemInstruction = language === 'de' 
    ? `Du bist ein hilfreicher Mentor und Assistent für einen V-Markt Azubi in Deutschland.
       Dein Tonfall ist ermutigend, professionell, aber zugänglich.
       Du kannst helfen bei:
       1. Dem Schreiben von Berichtshefteinträgen basierend auf Aufgaben.
       2. Dem Erklären von Einzelhandelskonzepten, Logistik oder HACCP.
       3. Dem Entwerfen professioneller E-Mails an Chefs oder Lehrer.
       4. Allgemeinen Ratschlägen zu Zeitmanagement und Azubi-Rechten/Pflichten.
       Halte die Antworten präzise und strukturiert. Antworte immer auf Deutsch.`
    : `You are a helpful mentor and assistant for a V-Markt "Azubi" (Apprentice) in Germany. 
       Your tone is encouraging, professional, yet accessible.
       You can help with:
       1. Writing "Berichtsheft" (Report Book) entries based on tasks they tell you.
       2. Explaining retail concepts, logistics, or food safety (HACCP) relevant to V-Markt.
       3. Drafting professional emails to bosses or teachers.
       4. General advice on time management and apprenticeship rights/obligations.
       Keep answers concise and structured.`;

  if (userContext) {
    const todoSummary = userContext.todos.map(t => `- ${t.text} (${t.completed ? (language === 'de' ? 'Erledigt' : 'Done') : (language === 'de' ? 'Offen' : 'Pending')}, ${t.category})`).join('\n');
    const fileSummary = userContext.files.map(f => `- ${f.name} (${f.type})`).join('\n');
    
    systemInstruction += language === 'de'
      ? `\n\nAKTUELLER KONTEXT DES NUTZERS:
         Name: ${userContext.name}
         Aktuelle Aufgaben:
         ${todoSummary || "Keine Aufgaben gelistet."}
         
         Gespeicherte Dokumente:
         ${fileSummary || "Keine Dateien gespeichert."}
         
         Nutze diesen Kontext für spezifische Fragen wie "Was soll ich als nächstes tun?" oder "Habe ich meinen Vertrag gespeichert?".`
      : `\n\nCURRENT USER CONTEXT:
         User Name: ${userContext.name}
         Current Tasks:
         ${todoSummary || "No tasks listed."}
         
         Stored Documents:
         ${fileSummary || "No files stored."}
         
         Use this context to answer specific questions like "What should I do next?" or "Do I have my contract saved?".`;
  }

  console.log(`Creating chat session with model: gemini-2.5-flash (${language})`);

  return client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const generateTodoSuggestions = async (context: string): Promise<string> => {
  const client = getClient();
  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Based on this context: "${context}", suggest 3 concrete to-do list items for a retail apprentice (V-Markt Azubi). 
    Return ONLY a JSON array of strings. Do not use Markdown formatting.`,
    config: {
      responseMimeType: 'application/json',
    }
  });
  
  // Clean up potential markdown code blocks if the model ignores the mime type instruction slightly
  let text = response.text || "[]";
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return text;
};

export interface ReportData {
  betrieblicheTaetigkeiten: string;
  unterweisung: string;
  berufsschule: string;
  gesamtstunden: string;
}

export const generateWeeklyReport = async (
  tasks: { betrieb: string[], berufsschule: string[] }, 
  startDate: string,
  tone: 'Formal' | 'Concise' | 'Detailed' = 'Formal',
  reportNumber?: string,
  weekNumber?: number
): Promise<ReportData> => {
  const client = getClient();
  
  // Calculate dates for header
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 5); // Assuming Mon-Fri or Mon-Sat work week
  
  const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const fromDate = start.toLocaleDateString('de-DE', dateOptions);
  const toDate = end.toLocaleDateString('de-DE', dateOptions);

  const prompt = `
    Role: Professional German Retail Apprentice (Einzelhandelskaufmann/frau Azubi at V-Markt/V-Baumarkt).
    Task: Write a weekly report book (Berichtsheft) entry.
    
    INPUT DATA:
    - Tasks (Betrieb): ${JSON.stringify(tasks.betrieb)}
    - School (Berufsschule): ${JSON.stringify(tasks.berufsschule)}
    - Date: ${fromDate} - ${toDate}

    REQUIRED OUTPUT FORMAT:
    Return a JSON object with exactly these fields:
    {
      "betrieblicheTaetigkeiten": "Bullet points of daily tasks using Partizip II (e.g., 'Regale eingeräumt')",
      "unterweisung": "A detailed description (4-6 sentences) of ONE specific work process/instruction from the week (Fließtext)",
      "berufsschule": "Bullet points of school topics (e.g., 'Mathe: Dreisatz')",
      "gesamtstunden": "40"
    }

    STYLE RULES:
    - Language: German (Deutsch)
    - Tone: ${tone}
    - Betriebliche Tätigkeiten: Use bullet points (•). Short, objective.
    - Unterweisung: Select one task and explain how it is done professionally. Title it.
    - Berufsschule: Bullet points. If empty, write "Keine Berufsschule".
  `;

  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  try {
    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    
    // Ensure properties are always strings to avoid "text.replace is not a function" errors in the PDF generator
    return {
      betrieblicheTaetigkeiten: parsed.betrieblicheTaetigkeiten || "",
      unterweisung: parsed.unterweisung || "",
      berufsschule: parsed.berufsschule || "",
      gesamtstunden: parsed.gesamtstunden || "40"
    };
  } catch (e) {
    console.error("JSON Parse Error", e);
    return {
      betrieblicheTaetigkeiten: "Fehler bei der Erstellung.",
      unterweisung: "",
      berufsschule: "",
      gesamtstunden: "40"
    };
  }
};

export const generateStudyMaterial = async (topic: string): Promise<Flashcard[]> => {
  const client = getClient();
  
  const prompt = `
    Generate 5 study flashcards for a German Retail Apprentice (Azubi im Einzelhandel) about the topic: "${topic}".
    Examples of topics: "Obst & Gemüse PLU Codes", "Kassentraining", "HACCP Hygiene", "Wirtschaftslehre".
    
    Return a JSON array of objects with 'question' and 'answer' properties. 
    Keep questions short and answers precise. Use German language.
  `;

  const response: GenerateContentResponse = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  try {
    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const rawData = JSON.parse(text);
    
    return rawData.map((item: any, index: number) => ({
      id: Date.now().toString() + index,
      question: item.question,
      answer: item.answer,
      category: topic
    }));
  } catch (e) {
    console.error("Failed to parse flashcards", e);
    return [];
  }
};
