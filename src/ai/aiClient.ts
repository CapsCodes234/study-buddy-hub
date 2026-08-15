/**
 * AI Client - Provider-Agnostic Interface
 * 
 * Real provider calls are intentionally unavailable in the browser. Production
 * AI remains deferred until an authenticated server-side implementation exists.
 * A deterministic mock provider may be enabled in local development with
 * VITE_AI_PROVIDER=mock.
 */

import { AIProvider, AIRequestOptions, AIError } from './types';
import { ExtractionResult } from '@/types/syllabus';
import { SYLLABUS_EXTRACTION_SYSTEM_PROMPT, generateSyllabusExtractionPrompt } from './prompts';
import { validateExtractedSyllabus, safeJSONParse } from '@/lib/validation';

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
 * Check whether the local-only mock provider is available.
 */
export function isMockAIAvailable(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_AI_PROVIDER === 'mock';
}

/**
 * Get the local development provider. Production always returns null until the
 * protected server-side AI phase is implemented.
 */
export function getAIProvider(): AIProvider | null {
  return isMockAIAvailable() ? new MockAIProvider() : null;
}

export function getAIProviderWithFallback(): { provider: AIProvider | null; isMock: boolean } {
  const provider = getAIProvider();
  return { provider, isMock: provider !== null };
}

/**
 * Check if AI is configured (has valid API key)
 */
export function isAIConfigured(): boolean {
  return isMockAIAvailable();
}

/**
 * Get the current provider name
 */
export function getProviderName(): string {
  return isMockAIAvailable() ? 'Mock development provider' : 'Server AI deferred';
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<{ success: boolean; error?: string; isMock: boolean }> {
  try {
    const { provider, isMock } = getAIProviderWithFallback();
    
    if (!provider) {
      return {
        success: false,
        error: 'AI is unavailable until protected server-side infrastructure is implemented.',
        isMock: false,
      };
    }

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
  if (!provider) {
    throw new AIError(
      'AI extraction is deferred until protected server-side infrastructure is implemented.',
      'API_ERROR',
    );
  }
  
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
