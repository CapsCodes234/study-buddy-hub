/**
 * Milestone Toast - Celebration component for achievements
 */

import { useEffect, useState, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { MilestoneAchievement, ConfidenceState } from '@/types/reminders';
import { loadMilestones, checkMilestones, markMilestoneCelebrated } from '@/lib/streak';
import { Bullet, PastPaper, Subject } from '@/types';
import { statusToConfidence } from '@/components/ui/ConfidenceToggle';

// Milestone configuration
const MILESTONE_EMOJIS: Record<MilestoneAchievement['type'], string> = {
  topics: '📚',
  papers: '📝',
  streak: '🔥',
  subject_complete: '🎓',
};

const MILESTONE_COLORS: Record<MilestoneAchievement['type'], string> = {
  topics: 'bg-status-green/10 border-status-green/30',
  papers: 'bg-primary/10 border-primary/30',
  streak: 'bg-status-amber/10 border-status-amber/30',
  subject_complete: 'bg-gradient-to-r from-primary/20 to-accent/20 border-accent/30',
};

interface MilestoneToastProps {
  subjects: Subject[];
  bullets: Bullet[];
  pastPapers: PastPaper[];
  streakDays: number;
}

export const MilestoneToast = memo(function MilestoneToastComponent({
  subjects,
  bullets,
  pastPapers,
  streakDays,
}: MilestoneToastProps) {
  const [lastCheckedCounts, setLastCheckedCounts] = useState({
    confidentTopics: 0,
    completedPapers: 0,
    streakDays: 0,
  });

  const showMilestoneToast = useCallback((milestone: MilestoneAchievement) => {
    const emoji = MILESTONE_EMOJIS[milestone.type];
    
    toast.success(
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-semibold">{milestone.title}</p>
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
        </div>
      </div>,
      {
        duration: 5000,
        className: 'celebration-toast',
      }
    );

    markMilestoneCelebrated(milestone.id);
  }, []);

  useEffect(() => {
    // Calculate current counts
    const confidentTopics = bullets.filter((b) => {
      const confidence = statusToConfidence(b.status, b.done);
      return confidence === 'confident';
    }).length;

    const completedPapers = pastPapers.filter((p) => p.completed).length;

    // Calculate subjects that are complete (all bullets confident)
    const subjectsComplete: string[] = [];
    subjects.forEach((subject) => {
      const subjectBullets = bullets.filter((b) => b.subjectId === subject.id);
      if (subjectBullets.length > 0) {
        const allConfident = subjectBullets.every((b) => {
          const confidence = statusToConfidence(b.status, b.done);
          return confidence === 'confident';
        });
        if (allConfident) {
          subjectsComplete.push(subject.name);
        }
      }
    });

    // Check for new milestones
    const newMilestones = checkMilestones({
      confidentTopics,
      completedPapers,
      currentStreak: streakDays,
      subjectsComplete,
    });

    // Show toast for each new milestone
    newMilestones.forEach((milestone) => {
      showMilestoneToast(milestone);
    });

    // Update last checked counts
    setLastCheckedCounts({
      confidentTopics,
      completedPapers,
      streakDays,
    });
  }, [bullets, pastPapers, streakDays, subjects, showMilestoneToast]);

  // This component doesn't render anything visible
  return null;
});

// Small win indicator for inline use
export const SmallWinIndicator = memo(function SmallWinIndicator({
  value,
  previousValue,
  label,
}: {
  value: number;
  previousValue?: number;
  label?: string;
}) {
  const diff = previousValue !== undefined ? value - previousValue : 0;

  if (diff <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-status-green animate-fade-in">
      <span className="font-medium">+{diff}</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
});

// Progress celebration animation
export const ProgressCelebration = memo(function ProgressCelebration({
  show,
  message,
}: {
  show: boolean;
  message?: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce text-4xl">🎉</div>
      {message && (
        <div className="absolute bottom-1/3 bg-card border rounded-lg px-4 py-2 shadow-lg animate-fade-in">
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
    </div>
  );
});
