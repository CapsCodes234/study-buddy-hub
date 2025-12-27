/**
 * AI Client - Provider-Agnostic Interface
 * 
 * This module provides a unified interface for AI providers.
 * 
 * DEFAULT PROVIDER: OpenRouter (VITE_AI_PROVIDER=openrouter)
 * 
 * To switch to OpenAI:
 * 1. Set VITE_AI_PROVIDER=openai in .env.local
 * 2. Set VITE_AI_API_KEY to your OpenAI API key
 * 
 * Environment Variables:
 * - VITE_AI_API_KEY: Your API key (required for real extraction)
 * - VITE_AI_PROVIDER: 'openrouter' (default) | 'openai' | 'mock'
 */

import { AIProvider, AIRequestOptions, AIError } from './types';
import { ExtractionResult } from '@/types/syllabus';
import { SYLLABUS_EXTRACTION_SYSTEM_PROMPT, generateSyllabusExtractionPrompt } from './prompts';
import { validateExtractedSyllabus, safeJSONParse } from '@/lib/validation';

/**
 * Default AI request options
 */
const DEFAULT_OPTIONS: Required<AIRequestOptions> = {
  maxTokens: 4000,
  temperature: 0.3, // Lower temperature for more consistent extraction
  systemPrompt: '',
};

/**
 * Provider configurations
 */
const PROVIDER_CONFIG = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    headers: (origin: string) => ({
      'HTTP-Referer': origin,
      'X-Title': 'Study Buddy Hub',
    }),
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    headers: () => ({}),
  },
} as const;

/**
 * OpenAI-compatible AI Provider (works with OpenRouter and OpenAI)
 */
class OpenAICompatibleProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private providerName: 'openrouter' | 'openai';

  constructor(
    apiKey: string,
    providerName: 'openrouter' | 'openai' = 'openrouter'
  ) {
    this.apiKey = apiKey;
    this.providerName = providerName;
    const config = PROVIDER_CONFIG[providerName];
    this.baseUrl = config.baseUrl;
    this.model = config.model;
  }

  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      const additionalHeaders = PROVIDER_CONFIG[this.providerName].headers(
        typeof window !== 'undefined' ? window.location.origin : 'https://studybuddy.app'
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...additionalHeaders,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
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

        if (response.status === 402) {
          throw new AIError(
            'Insufficient credits. Please add credits to your account.',
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

      throw new AIError(
        `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN',
        error
      );
    }
  }
}

/**
 * Mock AI Provider (for development/testing without API key)
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

    // Mock syllabus extraction
    if (prompt.includes('syllabus') || prompt.includes('extract')) {
      return JSON.stringify({
        subject: "Sample Subject",
        subjectConfidence: 0.9,
        topics: [
          {
            name: "1.0 Introduction to Topic",
            orderNumber: 1,
            confidence: 0.95,
            subtopics: [
              {
                name: "1.1 Basic Concepts",
                confidence: 0.9,
                bullets: [
                  { text: "Understand fundamental principles", confidence: 0.85 },
                  { text: "Apply concepts to simple problems", confidence: 0.88 }
                ]
              },
              {
                name: "1.2 Advanced Applications",
                confidence: 0.85,
                bullets: [
                  { text: "Solve complex problems", confidence: 0.82 },
                  { text: "Analyze and evaluate solutions", confidence: 0.8 }
                ]
              }
            ]
          },
          {
            name: "2.0 Secondary Topic",
            orderNumber: 2,
            confidence: 0.92,
            subtopics: [
              {
                name: "2.1 Core Principles",
                confidence: 0.88,
                bullets: [
                  { text: "Define key terminology", confidence: 0.9 },
                  { text: "Explain relationships between concepts", confidence: 0.85 }
                ]
              }
            ]
          }
        ],
        components: [
          { name: "Paper 1", totalMarks: 100, confidence: 0.7 },
          { name: "Paper 2", totalMarks: 80, confidence: 0.65 }
        ],
        confidence: {
          overall: 0.85,
          subject: 0.9,
          topics: 0.88,
          components: 0.68
        },
        extractedAt: new Date().toISOString()
      });
    }

    return JSON.stringify({ message: "Mock AI response" });
  }
}

/**
 * Get the current AI provider based on environment configuration
 */
export function getAIProvider(): AIProvider | null {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const providerName = (import.meta.env.VITE_AI_PROVIDER || 'openrouter') as string;

  // If explicitly set to mock, use mock provider
  if (providerName === 'mock') {
    return new MockAIProvider();
  }

  // If no API key, return null (caller should handle fallback)
  if (!apiKey) {
    return null;
  }

  // Use the appropriate provider
  if (providerName === 'openai' || providerName === 'openrouter') {
    return new OpenAICompatibleProvider(apiKey, providerName);
  }

  // Default to OpenRouter
  return new OpenAICompatibleProvider(apiKey, 'openrouter');
}

/**
 * Get AI provider or mock fallback
 */
export function getAIProviderWithFallback(): { provider: AIProvider; isMock: boolean } {
  const provider = getAIProvider();
  if (provider) {
    return { provider, isMock: false };
  }
  return { provider: new MockAIProvider(), isMock: true };
}

/**
 * Check if AI is configured (has valid API key)
 */
export function isAIConfigured(): boolean {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Get the current provider name
 */
export function getProviderName(): string {
  return (import.meta.env.VITE_AI_PROVIDER || 'openrouter') as string;
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<{ success: boolean; error?: string; isMock: boolean }> {
  try {
    const { provider, isMock } = getAIProviderWithFallback();
    
    const response = await provider.generateText(
      'Say "Connection successful" and nothing else.',
      { maxTokens: 20, temperature: 0 }
    );
    
    return {
      success: response.toLowerCase().includes('connection') || response.toLowerCase().includes('successful'),
      isMock,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isMock: false,
    };
  }
}

/**
 * Extract syllabus from PDF text content
 */
export async function extractSyllabusFromPDF(
  pdfText: string,
  availableSubjects: string[] = ['Mathematics', 'Physics', 'Information Technology']
): Promise<ExtractionResult> {
  const { provider, isMock } = getAIProviderWithFallback();
  
  const prompt = generateSyllabusExtractionPrompt(pdfText, availableSubjects);
  
  const response = await provider.generateText(prompt, {
    systemPrompt: SYLLABUS_EXTRACTION_SYSTEM_PROMPT,
    maxTokens: 4000,
    temperature: 0.2,
  });
  
  const result = parseAIResponse<ExtractionResult>(response);
  
  // Ensure extractedAt is set
  if (!result.extractedAt) {
    result.extractedAt = new Date().toISOString();
  }
  
  return result;
}

/**
 * Parse JSON response from AI, handling common issues with safe parsing
 */
export function parseAIResponse<T>(text: string): T {
  try {
    let jsonString: string | null = null;
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    // Try to find JSON object in the text
    if (!jsonString) {
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
      }
    }

    // Fallback to direct text
    if (!jsonString) {
      jsonString = text;
    }

    // Use safe JSON parse to prevent prototype pollution
    const parsed = safeJSONParse<T>(jsonString);
    if (parsed === null) {
      throw new Error('Invalid JSON structure');
    }

    // For syllabus extraction, validate the structure
    const syllabusValidation = validateExtractedSyllabus(parsed);
    if (syllabusValidation) {
      return syllabusValidation as T;
    }

    return parsed;
  } catch (error) {
    throw new AIError(
      `Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
      'VALIDATION_ERROR',
      error
    );
  }
}

/**
 * Create AI Provider instance (for custom configurations)
 */
export function createAIProvider(
  provider: 'openrouter' | 'openai' | 'mock' = 'mock',
  apiKey?: string
): AIProvider {
  if (provider === 'mock' || !apiKey) {
    return new MockAIProvider();
  }

  return new OpenAICompatibleProvider(apiKey, provider);
}
