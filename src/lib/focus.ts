/**
 * Today's Focus Logic
 * 
 * Smart surfacing of items that need attention:
 * - Red confidence bullets (highest priority)
 * - Amber bullets with no recent interaction
 * - Incomplete/unattempted past papers
 */

import { Bullet, PastPaper, Subject, FocusItem } from '@/types';

const STALE_DAYS = 7; // Items not updated in 7 days are considered stale

/**
 * Check if a date is older than threshold days
 */
const isStale = (dateString: string, daysThreshold: number = STALE_DAYS): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > daysThreshold;
};

/**
 * Generate focus items from bullets
 */
export const getBulletFocusItems = (
  bullets: Bullet[],
  subjects: Subject[],
  maxItems: number = 10
): FocusItem[] => {
  const items: FocusItem[] = [];
  
  // Priority 1: Red bullets (not done)
  const redBullets = bullets
    .filter(b => b.status === 'Red' && !b.done)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  redBullets.slice(0, maxItems).forEach(bullet => {
    const subject = subjects.find(s => s.id === bullet.subjectId);
    items.push({
      id: `bullet-${bullet.id}`,
      type: 'bullet',
      priority: 'high',
      title: bullet.bulletText,
      subtitle: `${subject?.name || 'Unknown'} • ${bullet.mainTopic} • ${bullet.subtopic}`,
      subjectId: bullet.subjectId,
      reason: 'Low confidence - needs review',
      data: bullet,
    });
  });
  
  // Priority 2: Stale amber bullets
  const staleAmberBullets = bullets
    .filter(b => b.status === 'Amber' && !b.done && isStale(b.updatedAt))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  
  staleAmberBullets.slice(0, Math.max(0, maxItems - items.length)).forEach(bullet => {
    const subject = subjects.find(s => s.id === bullet.subjectId);
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(bullet.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    items.push({
      id: `bullet-${bullet.id}`,
      type: 'bullet',
      priority: 'medium',
      title: bullet.bulletText,
      subtitle: `${subject?.name || 'Unknown'} • ${bullet.mainTopic} • ${bullet.subtopic}`,
      subjectId: bullet.subjectId,
      reason: `Not reviewed in ${daysSinceUpdate} days`,
      data: bullet,
    });
  });
  
  // Priority 3: Unrated bullets (null status)
  const unratedBullets = bullets
    .filter(b => b.status === null && !b.done)
    .slice(0, Math.max(0, maxItems - items.length));
  
  unratedBullets.forEach(bullet => {
    const subject = subjects.find(s => s.id === bullet.subjectId);
    items.push({
      id: `bullet-${bullet.id}`,
      type: 'bullet',
      priority: 'low',
      title: bullet.bulletText,
      subtitle: `${subject?.name || 'Unknown'} • ${bullet.mainTopic} • ${bullet.subtopic}`,
      subjectId: bullet.subjectId,
      reason: 'Not yet rated',
      data: bullet,
    });
  });
  
  return items;
};

/**
 * Generate focus items from past papers
 */
export const getPaperFocusItems = (
  papers: PastPaper[],
  subjects: Subject[],
  maxItems: number = 5
): FocusItem[] => {
  const items: FocusItem[] = [];
  
  // Incomplete papers, sorted by year (most recent first)
  const incompletePapers = papers
    .filter(p => !p.completed)
    .sort((a, b) => b.year - a.year);
  
  incompletePapers.slice(0, maxItems).forEach(paper => {
    const subject = subjects.find(s => s.id === paper.subjectId);
    items.push({
      id: `paper-${paper.id}`,
      type: 'paper',
      priority: 'medium',
      title: `${paper.year} ${paper.session} Paper ${paper.paper}${paper.variant ? ` v${paper.variant}` : ''}`,
      subtitle: subject?.name || 'Unknown Subject',
      subjectId: paper.subjectId,
      reason: 'Not attempted',
      data: paper,
    });
  });
  
  return items;
};

/**
 * Get all focus items combined, sorted by priority
 */
export const getAllFocusItems = (
  bullets: Bullet[],
  papers: PastPaper[],
  subjects: Subject[],
  maxItems: number = 10
): FocusItem[] => {
  const bulletItems = getBulletFocusItems(bullets, subjects, maxItems);
  const paperItems = getPaperFocusItems(papers, subjects, Math.ceil(maxItems / 2));
  
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  return [...bulletItems, ...paperItems]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, maxItems);
};

/**
 * Get focus summary stats
 */
export const getFocusSummary = (bullets: Bullet[], papers: PastPaper[]) => {
  return {
    redCount: bullets.filter(b => b.status === 'Red' && !b.done).length,
    staleAmberCount: bullets.filter(b => b.status === 'Amber' && !b.done && isStale(b.updatedAt)).length,
    unratedCount: bullets.filter(b => b.status === null && !b.done).length,
    incompletePaperCount: papers.filter(p => !p.completed).length,
  };
};
