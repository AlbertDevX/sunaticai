import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface AITrainingDB extends DBSchema {
  'training_data': {
    key: number;
    value: {
      id: number;
      prompt: string;
      response: string;
      model: string;
      category: string;
      quality_score: number;
      created_at: string;
    };
  };
  'model_configs': {
    key: string;
    value: {
      model_name: string;
      config: Record<string, unknown>;
      updated_at: string;
    };
  };
  'conversation_history': {
    key: number;
    value: {
      id: number;
      chat_id: string;
      messages: Array<{ role: string; content: string }>;
      model_used: string;
      feedback_score?: number;
      created_at: string;
    };
  };
}

let dbInstance: IDBPDatabase<AITrainingDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<AITrainingDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AITrainingDB>('AITrainingDB', 1, {
    upgrade(db: any) {
      // Training data store
      const trainingStore = db.createObjectStore('training_data', {
        keyPath: 'id',
        autoIncrement: true,
      });
      trainingStore.createIndex('category', 'category');
      trainingStore.createIndex('model', 'model');
      trainingStore.createIndex('quality_score', 'quality_score');

      // Model configs store
      db.createObjectStore('model_configs', {
        keyPath: 'model_name',
      });

      // Conversation history store
      const historyStore = db.createObjectStore('conversation_history', {
        keyPath: 'id',
        autoIncrement: true,
      });
      historyStore.createIndex('chat_id', 'chat_id');
      historyStore.createIndex('model_used', 'model_used');
    },
  });

  return dbInstance;
}

// Training Data Functions
export async function addTrainingData(
  prompt: string,
  response: string,
  model: string,
  category: string = 'general',
  quality_score: number = 5
): Promise<number> {
  const db = await initDB();
  const id = await db.add('training_data', {
    prompt,
    response,
    model,
    category,
    quality_score,
    created_at: new Date().toISOString(),
  } as any);
  return id as number;
}

export async function getTrainingDataByCategory(category: string): Promise<Array<{
  id: number;
  prompt: string;
  response: string;
  model: string;
  category: string;
  quality_score: number;
  created_at: string;
}>> {
  const db = await initDB();
  const tx = db.transaction('training_data');
  const index = tx.store.index('category');
  return index.getAll(category as any) as any;
}

export async function getHighQualityTrainingData(minScore: number = 4): Promise<Array<{
  id: number;
  prompt: string;
  response: string;
  model: string;
  category: string;
  quality_score: number;
  created_at: string;
}>> {
  const db = await initDB();
  const allData = await db.getAll('training_data');
  return allData.filter(item => item.quality_score >= minScore);
}

export async function getAllTrainingData(): Promise<Array<{
  id: number;
  prompt: string;
  response: string;
  model: string;
  category: string;
  quality_score: number;
  created_at: string;
}>> {
  const db = await initDB();
  return db.getAll('training_data');
}

// Model Config Functions
export async function saveModelConfig(
  modelName: string,
  config: Record<string, unknown>
): Promise<void> {
  const db = await initDB();
  await db.put('model_configs', {
    model_name: modelName,
    config,
    updated_at: new Date().toISOString(),
  });
}

export async function getModelConfig(modelName: string): Promise<Record<string, unknown> | null> {
  const db = await initDB();
  const config = await db.get('model_configs', modelName);
  return config?.config || null;
}

// Conversation History Functions
export async function saveConversation(
  chat_id: string,
  messages: Array<{ role: string; content: string }>,
  model_used: string,
  feedback_score?: number
): Promise<number> {
  const db = await initDB();
  const id = await db.add('conversation_history', {
    chat_id,
    messages,
    model_used,
    feedback_score,
    created_at: new Date().toISOString(),
  } as any);
  return id as number;
}

export async function getConversationsByModel(model: string): Promise<Array<{
  id: number;
  chat_id: string;
  messages: Array<{ role: string; content: string }>;
  model_used: string;
  feedback_score?: number;
  created_at: string;
}>> {
  const db = await initDB();
  const tx = db.transaction('conversation_history');
  const index = tx.store.index('model_used');
  return index.getAll(model as any) as any;
}

export async function getConversationHistory(chat_id: string): Promise<Array<{
  id: number;
  chat_id: string;
  messages: Array<{ role: string; content: string }>;
  model_used: string;
  feedback_score?: number;
  created_at: string;
}>> {
  const db = await initDB();
  const tx = db.transaction('conversation_history');
  const index = tx.store.index('chat_id');
  return index.getAll(chat_id as any) as any;
}

// AI Training Helper Functions
export interface TrainingPrompt {
  system_prompt: string;
  examples: Array<{ input: string; output: string }>;
  guidelines: string[];
}

export function generateSystemPrompt(model: string): TrainingPrompt {
  const basePrompt: TrainingPrompt = {
    system_prompt: `You are an advanced AI assistant. Provide helpful, accurate, and safe responses.`,
    examples: [],
    guidelines: [
      'Be helpful and harmless',
      'Provide accurate information',
      'Admit when you don\'t know something',
      'Follow ethical guidelines',
    ],
  };

  // Model-specific prompts
  if (model.includes('coder') || model.includes('code')) {
    basePrompt.system_prompt = `You are an expert programming assistant. Help users write, debug, and understand code. Provide clear explanations and follow best practices.`;
    basePrompt.guidelines.push('Write clean, efficient, and well-documented code');
    basePrompt.guidelines.push('Explain code logic clearly');
    basePrompt.guidelines.push('Suggest improvements and best practices');
  }

  if (model.includes('qwen')) {
    basePrompt.guidelines.push('Support multiple languages including Chinese and English');
    basePrompt.guidelines.push('Leverage Alibaba ecosystem knowledge when relevant');
  }

  if (model.includes('gemini')) {
    basePrompt.guidelines.push('Utilize multimodal reasoning when applicable');
    basePrompt.guidelines.push('Apply Google\'s AI principles');
  }

  return basePrompt;
}

export async function trainFromConversation(
  chat_id: string,
  minQualityScore: number = 4
): Promise<number> {
  const conversations = await getConversationHistory(chat_id);
  let trainedCount = 0;

  for (const conv of conversations) {
    if ((conv.feedback_score ?? 5) >= minQualityScore) {
      // Extract prompt-response pairs
      const messages = conv.messages;
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
          await addTrainingData(
            messages[i].content,
            messages[i + 1].content,
            conv.model_used,
            'conversation',
            conv.feedback_score ?? 5
          );
          trainedCount++;
        }
      }
    }
  }

  return trainedCount;
}

export async function exportTrainingData(format: 'json' | 'csv' = 'json'): Promise<string> {
  const data = await getAllTrainingData();
  
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else {
    // CSV format
    const headers = ['id', 'prompt', 'response', 'model', 'category', 'quality_score', 'created_at'];
    const rows = data.map(item => 
      headers.map(h => `"${String((item as any)[h]).replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export async function importTrainingData(jsonData: string): Promise<number> {
  const data = JSON.parse(jsonData);
  const db = await initDB();
  let importedCount = 0;

  for (const item of data) {
    try {
      await db.add('training_data', item);
      importedCount++;
    } catch (error) {
      console.error('Failed to import item:', error);
    }
  }

  return importedCount;
}

// Clear all data (for testing or reset)
export async function clearTrainingData(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(['training_data', 'conversation_history'], 'readwrite');
  await tx.objectStore('training_data').clear();
  await tx.objectStore('conversation_history').clear();
  await tx.done;
}
