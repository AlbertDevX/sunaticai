export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  age_verified: boolean;
  birth_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  mode: 'chat' | 'ide';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  is_restricted: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AIResponse {
  content?: string;
  error?: string;
  message?: string;
  restricted?: boolean;
  ageVerified?: boolean;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

export type AppView = 'chat' | 'ide';
