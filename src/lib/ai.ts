import { AIResponse } from '../types';

// Model configurations
export const MODEL_CONFIGS = {
  'gemini-1.5-pro': {
    provider: 'google',
    endpoint: import.meta.env.VITE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    maxTokens: 8192,
    temperature: 0.7,
  },
  'gemini-2.0-pro': {
    provider: 'google',
    endpoint: import.meta.env.VITE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    maxTokens: 8192,
    temperature: 0.7,
  },
  'qwen-max': {
    provider: 'alibaba',
    endpoint: import.meta.env.VITE_QWEN_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: import.meta.env.VITE_QWEN_API_KEY,
    maxTokens: 6000,
    temperature: 0.7,
  },
  'qwen-coder-plus': {
    provider: 'alibaba',
    endpoint: import.meta.env.VITE_QWEN_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: import.meta.env.VITE_QWEN_API_KEY,
    maxTokens: 6000,
    temperature: 0.5,
  },
  'qwen-3.6-plus': {
    provider: 'alibaba',
    endpoint: import.meta.env.VITE_QWEN_ENDPOINT || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: import.meta.env.VITE_QWEN_API_KEY,
    maxTokens: 8000,
    temperature: 0.7,
  },
  'ollama:llama3': {
    provider: 'ollama',
    endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.7,
  },
  'ollama:codellama': {
    provider: 'ollama',
    endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.5,
  },
};

export type ModelName = keyof typeof MODEL_CONFIGS;

/**
 * Call Google Gemini API
 */
export async function callGemini(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gemini-1.5-pro',
  ageVerified: boolean = false
): Promise<AIResponse> {
  const config = MODEL_CONFIGS[model as ModelName];
  if (!config?.apiKey) {
    return { error: 'Gemini API key not configured' };
  }

  try {
    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `${config.endpoint}/${model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
          },
          safetySettings: ageVerified ? [] : [
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HARMFUL_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: `Gemini API error: ${response.status}`,
        message: errorData.error?.message || 'Unknown error'
      };
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        content: data.candidates[0].content.parts[0].text,
        model,
        usage: {
          input_tokens: data.usageMetadata?.promptTokenCount || 0,
          output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0,
        },
      };
    }

    return { error: 'No response from Gemini' };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { error: 'Failed to call Gemini API' };
  }
}

/**
 * Call Alibaba Qwen API (DashScope)
 */
export async function callQwen(
  messages: Array<{ role: string; content: string }>,
  model: string = 'qwen-max',
  _ageVerified: boolean = false
): Promise<AIResponse> {
  const config = MODEL_CONFIGS[model as ModelName];
  if (!config?.apiKey) {
    return { error: 'Qwen API key not configured' };
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-DashScope-Model': model,
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        },
        parameters: {
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          result_format: 'message',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: `Qwen API error: ${response.status}`,
        message: errorData.message || 'Unknown error'
      };
    }

    const data = await response.json();
    
    if (data.output?.choices?.[0]?.message?.content) {
      return {
        content: data.output.choices[0].message.content,
        model,
        usage: {
          input_tokens: data.usage?.input_tokens || 0,
          output_tokens: data.usage?.output_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    }

    return { error: 'No response from Qwen' };
  } catch (error) {
    console.error('Qwen API error:', error);
    return { error: 'Failed to call Qwen API' };
  }
}

/**
 * Call Ollama API (self-hosted or public instance)
 */
export async function callOllama(
  messages: Array<{ role: string; content: string }>,
  model: string = 'llama3',
  _ageVerified: boolean = false
): Promise<AIResponse> {
  const config = MODEL_CONFIGS[`ollama:${model}` as ModelName];
  const endpoint = config?.endpoint || import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';

  try {
    // Ollama uses a simpler format - combine messages into a single prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.replace('ollama:', ''),
        prompt: prompt,
        stream: false,
        options: {
          temperature: config?.temperature || 0.7,
          num_predict: config?.maxTokens || 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return { 
        error: `Ollama API error: ${response.status}`,
        message: errorText
      };
    }

    const data = await response.json();
    
    if (data.response) {
      return {
        content: data.response,
        model: `ollama:${model}`,
        usage: {
          input_tokens: data.prompt_eval_count || 0,
          output_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    }

    return { error: 'No response from Ollama' };
  } catch (error) {
    console.error('Ollama API error:', error);
    return { error: 'Failed to call Ollama API. Make sure Ollama is running.' };
  }
}

/**
 * Unified AI call function that routes to the appropriate provider
 */
export async function callAI(
  messages: Array<{ role: string; content: string }>,
  model: string = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-1.5-pro',
  ageVerified: boolean = false
): Promise<AIResponse> {
  const config = MODEL_CONFIGS[model as ModelName];
  
  if (!config) {
    return { error: `Unknown model: ${model}` };
  }

  switch (config.provider) {
    case 'google':
      return callGemini(messages, model, ageVerified);
    case 'alibaba':
      return callQwen(messages, model, ageVerified);
    case 'ollama':
      return callOllama(messages, model, ageVerified);
    default:
      return { error: `Unsupported provider: ${config.provider}` };
  }
}

/**
 * Get available models based on configuration
 */
export function getAvailableModels(): Array<{ name: string; provider: string; description: string }> {
  const models: Array<{ name: string; provider: string; description: string }> = [];
  
  Object.entries(MODEL_CONFIGS).forEach(([name, config]) => {
    if (config.apiKey || config.provider === 'ollama') {
      models.push({
        name,
        provider: config.provider,
        description: getModelDescription(name, config.provider),
      });
    }
  });

  return models;
}

function getModelDescription(name: string, provider: string): string {
  const descriptions: Record<string, string> = {
    'gemini-1.5-pro': "Google's most capable multimodal model",
    'gemini-2.0-pro': "Latest Google Gemini with enhanced reasoning",
    'qwen-max': "Alibaba's most powerful general-purpose model",
    'qwen-coder-plus': "Specialized for code generation and understanding",
    'qwen-3.6-plus': "Advanced Qwen with extended context window",
    'ollama:llama3': "Meta's Llama 3 via local Ollama instance",
    'ollama:codellama': "Code-specialized Llama via Ollama",
  };
  
  return descriptions[name] || `${provider} model`;
}
