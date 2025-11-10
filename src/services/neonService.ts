/**
 * Neon Database Service
 * Client for interacting with the Neon tracking API via Netlify Functions
 */

export interface UserProgress {
  id: number;
  chat_id: string;
  native_language: string;
  target_language: string;
  current_step: number;
  steps_visited: number[];
  steps_not_visited: number[];
  is_completed: boolean;
  onboarding_complete: boolean;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  summary: {
    total_users: string;
    completed_users: string;
    avg_completion: string;
  };
  languagePairs: Array<{
    native_language: string;
    target_language: string;
    pair_count: string;
  }>;
}

export interface GeneratedLesson {
  id: number;
  native_language: string;
  target_language: string;
  lesson_data: any;
  lesson_display: string;
  created_at: string;
}

export interface LessonCount {
  count: number;
  nativeLanguage: string;
  targetLanguage: string;
}

export interface Language {
  language_name: string;
  language_code: string;
  phoneme_count: number;
}

export interface Phoneme {
  phoneme_ipa: string;
  audio_url: string | null;
  description: string | null;
  difficulty_level: string;
}

class NeonService {
  private baseUrl = '/.netlify/functions/neon-tracking';

  /**
   * Make an API request to the Neon tracking function
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create or update a user
   */
  async upsertUser(
    chatId: string,
    nativeLanguage: string,
    targetLanguage: string
  ): Promise<UserProgress> {
    return this.request<UserProgress>('/user', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        nativeLanguage,
        targetLanguage,
      }),
    });
  }

  /**
   * Get user progress by chatId
   */
  async getUser(chatId: string): Promise<UserProgress> {
    return this.request<UserProgress>(`/user/${chatId}`, {
      method: 'GET',
    });
  }

  /**
   * Update user's current step
   */
  async updateStep(
    chatId: string,
    step: number,
    nativeLanguage?: string,
    targetLanguage?: string
  ): Promise<UserProgress> {
    return this.request<UserProgress>('/step', {
      method: 'PUT',
      body: JSON.stringify({
        chatId,
        step,
        nativeLanguage,
        targetLanguage,
      }),
    });
  }

  /**
   * Mark user's onboarding as complete
   */
  async completeOnboarding(chatId: string): Promise<UserProgress> {
    return this.request<UserProgress>('/complete', {
      method: 'PUT',
      body: JSON.stringify({
        chatId,
      }),
    });
  }

  /**
   * Get aggregated statistics
   */
  async getStats(): Promise<Stats> {
    return this.request<Stats>('/stats', {
      method: 'GET',
    });
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; timestamp: string; message: string }> {
    return this.request('/test', {
      method: 'POST',
    });
  }

  /**
   * Get count of cached lessons for a language pair
   */
  async getLessonCount(
    nativeLanguage: string,
    targetLanguage: string
  ): Promise<LessonCount> {
    return this.request<LessonCount>(
      `/lessons/count?native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get a random cached lesson for a language pair
   */
  async getRandomLesson(
    nativeLanguage: string,
    targetLanguage: string
  ): Promise<GeneratedLesson> {
    return this.request<GeneratedLesson>(
      `/lessons/random?native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Save a newly generated lesson to the cache
   */
  async saveLesson(
    nativeLanguage: string,
    targetLanguage: string,
    lessonData: any,
    lessonDisplay: string
  ): Promise<GeneratedLesson & { currentCount: number; maxCount: number }> {
    return this.request('/lessons', {
      method: 'POST',
      body: JSON.stringify({
        nativeLanguage,
        targetLanguage,
        lessonData,
        lessonDisplay,
      }),
    });
  }

  /**
   * Clear all cached lessons for a language pair (admin function)
   */
  async clearLessons(
    nativeLanguage: string,
    targetLanguage: string
  ): Promise<{ deleted: number; message: string }> {
    return this.request('/lessons', {
      method: 'DELETE',
      body: JSON.stringify({
        nativeLanguage,
        targetLanguage,
      }),
    });
  }

  /**
   * Get all available languages for IPA Memory Challenge
   */
  async getLanguages(): Promise<Language[]> {
    return this.request<Language[]>('/languages', {
      method: 'GET',
    });
  }

  /**
   * Get phonemes for a specific language
   */
  async getPhonemes(
    languageCode: string,
    difficulty?: string
  ): Promise<Phoneme[]> {
    const params = new URLSearchParams();
    if (difficulty) {
      params.append('difficulty', difficulty);
    }
    
    const queryString = params.toString();
    const endpoint = `/phonemes/${languageCode}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Phoneme[]>(endpoint, {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const neonService = new NeonService();