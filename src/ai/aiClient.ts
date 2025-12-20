/**
 * AI Client - Provider-Agnostic Interface
 * 
 * This module provides a unified interface for AI providers.
 * Currently supports OpenAI-compatible APIs, but designed to be extensible.
 */

import { AIProvider, AIRequestOptions, AIError } from './types';

/**
 * Default AI request options
 */
const DEFAULT_OPTIONS: Required<AIRequestOptions> = {
  maxTokens: 2000,
  temperature: 0.7,
  systemPrompt: '',
};

/**
 * OpenAI-compatible AI Provider
 */
class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      const providerName = import.meta.env.VITE_AI_PROVIDER || 'openai';
      // For OpenRouter, use HTTP-Referer header and optional X-Title header
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      };
      
      if (providerName === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Study Buddy Hub';
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: providerName === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
          messages: [
            ...(opts.systemPrompt ? [{ role: 'system', content: opts.systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new AIError(
            'Rate limit exceeded. Please try again later.',
            'RATE_LIMIT',
            errorData
          );
        }

        if (response.status === 401) {
          throw new AIError(
            'Invalid API key. Please check your settings.',
            'API_ERROR',
            errorData
          );
        }

        throw new AIError(
          `API error: ${response.statusText}`,
          'API_ERROR',
          errorData
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AIError(
          'Invalid response from AI provider',
          'API_ERROR',
          data
        );
      }

      return content;
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }

      // Network or other errors
      throw new AIError(
        `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN',
        error
      );
    }
  }
}

/**
 * Mock AI Provider (for development/testing)
 */
class MockAIProvider implements AIProvider {
  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock response based on prompt type
    if (prompt.includes('Study Summary') || prompt.includes('study progress')) {
      return JSON.stringify({
        summary: "You're making steady progress across your subjects. Focus on addressing red items and completing more past papers.",
        recommendations: [
          "Prioritize studying the red syllabus items in Mathematics",
          "Complete at least 2 past papers this week",
          "Review amber items that haven't been updated recently",
          "Focus on Physics topics with low completion rates"
        ],
        weaknesses: [
          "Mathematics has 15 red items requiring attention",
          "Past paper completion rate is below 50%"
        ],
        strengths: [
          "Good progress in Information Technology",
          "Consistent tracking of study progress"
        ]
      });
    }

    if (prompt.includes('Daily Focus') || prompt.includes('focus on today')) {
      return JSON.stringify({
        focusItems: [
          {
            priority: "high",
            subject: "Mathematics",
            topic: "Calculus",
            reason: "Multiple red items in this topic",
            action: "Review calculus fundamentals and work through practice problems"
          },
          {
            priority: "medium",
            subject: "Physics",
            topic: "Mechanics",
            reason: "Amber items need reinforcement",
            action: "Complete practice questions on mechanics"
          }
        ],
        overallAdvice: "Start with high-priority red items, then move to amber items for reinforcement."
      });
    }

    return JSON.stringify({ message: "Mock AI response" });
  }
}

/**
 * Create AI Provider instance
 */
export function createAIProvider(provider: 'openai' | 'mock' = 'mock', apiKey?: string): AIProvider {
  if (provider === 'mock' || !apiKey) {
    return new MockAIProvider();
  }

  if (provider === 'openai') {
    if (!apiKey) {
      throw new AIError('API key required for OpenAI provider', 'API_ERROR');
    }
    return new OpenAIProvider(apiKey);
  }

  throw new AIError(`Unsupported AI provider: ${provider}`, 'API_ERROR');
}

/**
 * Get AI provider from environment or settings
 */
export function getAIProvider(): AIProvider | null {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const providerName = (import.meta.env.VITE_AI_PROVIDER || 'openai') as string;
  const provider = providerName === 'mock' ? 'mock' : 'openai';

  if (!apiKey && provider === 'openai') {
    return null; // No API key configured
  }

  // Use OpenRouter URL if provider is openrouter, otherwise use OpenAI
  const baseUrl = providerName === 'openrouter' 
    ? 'https://openrouter.ai/api/v1'
    : undefined;

  if (provider === 'openai') {
    return new OpenAIProvider(apiKey, baseUrl);
  }

  return createAIProvider(provider, apiKey);
}

/**
 * Parse JSON response from AI, handling common issues
 */
export function parseAIResponse<T>(text: string): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }

    // Try direct JSON parse
    return JSON.parse(text) as T;
  } catch (error) {
    throw new AIError(
      `Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
      'VALIDATION_ERROR',
      error
    );
  }
}

