/**
 * AI Prompt Templates
 * 
 * All prompts are designed to:
 * - Be advisory only (no data modification)
 * - Focus on analysis and recommendations
 * - Avoid predictions or guarantees
 */

import { AIDataSnapshot } from './types';

/**
 * System prompt for AI Study Summary
 */
export const STUDY_SUMMARY_SYSTEM_PROMPT = `You are an educational advisor helping a student track their A-level studies. 
Your role is to:
- Analyze study data and provide insights
- Offer actionable recommendations
- Identify areas that need attention
- Acknowledge strengths

IMPORTANT CONSTRAINTS:
- You are ADVISORY ONLY - never suggest modifying data directly
- Do not make predictions or guarantees
- Focus on current state analysis
- Provide clear, actionable advice
- Be encouraging and constructive`;

/**
 * Generate prompt for Study Summary
 */
export function generateStudySummaryPrompt(snapshot: AIDataSnapshot): string {
  const { subjects, bullets, pastPapers, redBullets, amberBullets, subjectProgress } = snapshot;

  // Build subject progress summary
  const progressSummary = subjectProgress
    .map(sp => {
      const syllabusPercent = Math.round(sp.syllabusProgress * 100);
      const paperPercent = Math.round(sp.pastPaperProgress * 100);
      return `${sp.subjectName}: ${syllabusPercent}% syllabus, ${paperPercent}% papers (${sp.completedBullets}/${sp.totalBullets} bullets, ${sp.completedPapers}/${sp.totalPapers} papers)`;
    })
    .join('\n');

  // Count items by status
  const redCount = redBullets.length;
  const amberCount = amberBullets.length;
  const greenCount = bullets.filter(b => b.status === 'Green' && !b.done).length;
  const doneCount = bullets.filter(b => b.done).length;

  // Past paper summary
  const totalPapers = pastPapers.length;
  const completedPapers = pastPapers.filter(p => p.completed).length;
  const incompletePapers = totalPapers - completedPapers;

  return `Analyze this student's A-level study progress and provide a comprehensive summary.

STUDY DATA:
- Total Subjects: ${subjects.length}
- Total Syllabus Items: ${bullets.length}
- Total Past Papers: ${totalPapers}

PROGRESS BY STATUS:
- Red (Need to learn): ${redCount} items
- Amber (Partially understood): ${amberCount} items
- Green (Confident): ${greenCount} items
- Completed: ${doneCount} items

PAST PAPERS:
- Completed: ${completedPapers}/${totalPapers}
- Incomplete: ${incompletePapers}/${totalPapers}

SUBJECT PROGRESS:
${progressSummary}

${redBullets.length > 0 ? `\nRED ITEMS (Need Attention):\n${redBullets.slice(0, 10).map(b => `- ${b.bulletText.substring(0, 100)}`).join('\n')}${redBullets.length > 10 ? `\n... and ${redBullets.length - 10} more` : ''}` : ''}

${amberBullets.length > 0 ? `\nAMBER ITEMS (Need Practice):\n${amberBullets.slice(0, 10).map(b => `- ${b.bulletText.substring(0, 100)}`).join('\n')}${amberBullets.length > 10 ? `\n... and ${amberBullets.length - 10} more` : ''}` : ''}

Please provide:
1. A concise summary (2-3 sentences) of their current study state
2. 3-5 specific, actionable recommendations for improvement
3. Key weaknesses to address
4. Strengths to acknowledge

Format your response as JSON:
{
  "summary": "Brief summary text",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...],
  "strengths": ["Strength 1", "Strength 2", ...]
}

Remember: Be constructive, specific, and avoid predictions or guarantees.`;
}

/**
 * System prompt for Daily Focus Assistant
 */
export const DAILY_FOCUS_SYSTEM_PROMPT = `You are a daily study focus assistant helping a student prioritize their A-level revision.

Your role is to:
- Suggest what to focus on today based on current progress
- Prioritize items that need attention
- Provide clear, actionable next steps
- Be encouraging and realistic

IMPORTANT:
- You are ADVISORY ONLY
- Focus on immediate, actionable items
- Do not create schedules or timelines
- Avoid predictions about outcomes`;

/**
 * Generate prompt for Daily Focus
 */
export function generateDailyFocusPrompt(snapshot: AIDataSnapshot): string {
  const { redBullets, amberBullets, pastPapers, subjectProgress } = snapshot;

  const incompletePapers = pastPapers.filter(p => !p.completed);

  return `Based on this student's current study progress, suggest what they should focus on today.

CURRENT STATE:
- Red items needing attention: ${redBullets.length}
- Amber items needing practice: ${amberBullets.length}
- Incomplete past papers: ${incompletePapers.length}

${redBullets.length > 0 ? `\nTOP RED ITEMS:\n${redBullets.slice(0, 5).map((b, i) => `${i + 1}. ${b.bulletText.substring(0, 80)}`).join('\n')}` : ''}

${amberBullets.length > 0 ? `\nTOP AMBER ITEMS:\n${amberBullets.slice(0, 5).map((b, i) => `${i + 1}. ${b.bulletText.substring(0, 80)}`).join('\n')}` : ''}

${incompletePapers.length > 0 ? `\nINCOMPLETE PAPERS:\n${incompletePapers.slice(0, 3).map(p => `- ${p.year} ${p.session} ${p.paper}`).join('\n')}` : ''}

SUBJECT PROGRESS:
${subjectProgress.map(sp => {
  const syllabusPercent = Math.round(sp.syllabusProgress * 100);
  return `${sp.subjectName}: ${syllabusPercent}% complete`;
}).join('\n')}

Provide:
1. 3-5 focus items with priority (high/medium/low), subject, topic, reason, and action
2. Overall advice for today's study session

Format as JSON:
{
  "focusItems": [
    {
      "priority": "high|medium|low",
      "subject": "Subject name",
      "topic": "Topic name",
      "reason": "Why this needs attention",
      "action": "What to do"
    }
  ],
  "overallAdvice": "Brief advice for today"
}

Be specific, actionable, and encouraging.`;
}

/**
 * System prompt for Syllabus Extraction
 */
export const SYLLABUS_EXTRACTION_SYSTEM_PROMPT = `You are a syllabus parser that extracts structured syllabus information from educational documents.
Your role is to:
- Extract subject names, main topics, subtopics, and bullet points
- Organize information hierarchically
- Maintain accuracy and preserve the original structure
- Ignore non-syllabus content (headers, footers, page numbers, etc.)

IMPORTANT:
- Return ONLY valid JSON in the specified format
- Do not include any explanatory text outside the JSON
- Preserve the exact wording from the document when possible`;

/**
 * Generate prompt for Syllabus Extraction from PDF text
 */
export function generateSyllabusExtractionPrompt(pdfText: string, availableSubjects: string[]): string {
  const subjectsList = availableSubjects.join(', ');
  const truncatedText = pdfText.length > 12000 ? pdfText.substring(0, 12000) + '\n[... content truncated ...]' : pdfText;
  
  return 'Extract syllabus information from the following document text and organize it into a structured format.\n\n' +
    'AVAILABLE SUBJECTS (match the subject name as closely as possible):\n' +
    subjectsList + '\n\n' +
    'DOCUMENT TEXT:\n' +
    truncatedText + '\n\n' +
    'Extract the syllabus content and organize it as follows:\n' +
    '- Identify the subject (match to one of the available subjects above)\n' +
    '- Extract main topics (major sections/chapters)\n' +
    '- Extract subtopics under each main topic\n' +
    '- Extract individual bullet points/learning objectives under each subtopic\n\n' +
    'Return the result as a JSON object with this exact structure:\n' +
    '{\n' +
    '  "subject": "Subject Name",\n' +
    '  "topics": [\n' +
    '    {\n' +
    '      "mainTopic": "Main Topic Name",\n' +
    '      "subtopics": [\n' +
    '        {\n' +
    '          "name": "Subtopic Name",\n' +
    '          "bullets": ["Bullet point 1", "Bullet point 2", ...]\n' +
    '        }\n' +
    '      ]\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    'Important:\n' +
    '- Only include actual syllabus content (topics, learning objectives, etc.)\n' +
    '- Ignore headers, footers, page numbers, and administrative text\n' +
    '- Group related content hierarchically\n' +
    '- Ensure subject name matches one of the available subjects (case-insensitive)\n' +
    '- Return ONLY the JSON object, no additional text';
}

