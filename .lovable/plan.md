
# First-Time Student UX Review

Scope: Reviewed as if I'd just opened the app for the first time. No code changes proposed here — this is a findings report. If you want, approve and I'll turn any subset into a fix plan.

---

## 🔴 Critical usability issues (block or confuse a first-time user)

### 1. Onboarding modal explains theory, not the first action
`OnboardingModal.tsx` teaches the R/A/G system and mentions AI extraction, but the app has moved to a 4-state confidence model (`not_started / in_progress / confident / needs_revision`) used everywhere else (SubjectOverview, SubjectSyllabus, ConfidenceToggle). A new user is trained on a vocabulary that no longer matches the UI they'll see. The "Getting Started" list also says "mark topics R/A/G" — inconsistent.

There is also no guided "do this first" step. The modal closes into a Dashboard that is almost entirely empty until data is imported.

### 2. Empty Dashboard is overwhelming *and* underwhelming at the same time
With subjects present but no bullets/papers, `Dashboard.tsx` still renders:
- DeadlinesCard, GlobalReadinessScore, StudyMomentumIndicator, PastPaperPerformanceOverview, YearlyPerformanceCard, NextActionPanel, plus subject cards
All showing 0 / empty / "No data" states stacked vertically. For a first-time user this reads as "the app is broken" rather than "you haven't added data yet."

The single empty-state CTA ("Go to Syllabus") only appears when `!hasAnyData` **and** `hasSubjects` — but the Tier-1 cards render anyway just below it, drowning it out.

### 3. Two competing "import" entry points, unclear which is canonical
- Dashboard empty state → "Go to Syllabus" → routes to `/[firstSubject]/syllabus`, which does **not** contain an importer.
- The importer actually lives on `/[subject]` (SubjectOverview) as the "Import Data for {subject}" card.
- Settings also has Import (JSON backup), which is a different thing entirely.
A first-time user clicking "Go to Syllabus" lands on an empty page telling them to "Import syllabus data to get started" — with no button to do so on that page.

### 4. Navigation doesn't scale and hides the primary action
`Header.tsx` puts Dashboard, Exams, and every subject in one horizontal nav with `overflow-x-auto`. On the current 772px viewport there's no visible affordance for scrolling; subject labels collapse to first word only. New users don't know Subjects are the main workspace — they look like tabs equal to "Exams."

Settings is a gear icon with no label. New users often can't find import/export/backup.

### 5. "Log Paper" flow blocks silently when there are no components
In `SubjectPapers.tsx`, opening "Log Paper" with no components shows: *"No components found. Import component metadata first via CSV."* — but provides no link, no button, no explanation of what "component metadata" is or where to get the CSV. Dead end.

### 6. Chapter deadline picker is discoverable only if the user opens a chapter
Deadlines are a headline feature (DeadlinesCard, celebrations, contextual toasts) but the only way to set one is to expand a chapter row on the Syllabus page and find `ChapterDeadlinePicker`. First-time users won't reach it.

---

## 🟠 Weak visual hierarchy

- **SubjectOverview** stacks: Pace badge → Tabs → Overall Progress card → Import card → Deadlines card → Next Action panel → Weak areas. All cards have similar weight; nothing tells the eye "start here." The Import card should be the hero when data is empty and demoted once populated.
- **Dashboard** has ~10 card sections with roughly the same visual treatment (Card + CardHeader + Progress). Readiness Score and Next Action get no visual promotion despite being the most important.
- Status/confidence colors (Red/Amber/Green) compete with the primary brand color used on progress bars and CTAs, so nothing stands out.
- Breadcrumbs are rendered as a secondary bar under the header, but the page title inside `SubjectPageWrapper` repeats the same info immediately below — redundant.

## 🟠 Unclear calls to action

- Header "Settings" is icon-only.
- "Generate Study Summary" and "Weekly Reflection" sit as equal outline buttons at the top-right of the Dashboard with no explanation of what they do or why a first-time user should press them.
- "Plan deadlines" button on the Deadlines card just routes to the syllabus list — the user then has to hunt for the picker.
- The Import card's file input is the whole CTA; there's no primary "Choose CSV" button and no link to a sample CSV (which exists at `sample/syllabus-sample.csv`).
- "Test AI Connection" in Settings has no context about what happens if it fails or succeeds.

## 🟠 Missing onboarding guidance

- No inline tour, no tooltips on first visit, no "sample data" option to explore the app before importing.
- Confidence system is documented behind a collapsible "Show confidence states explanation" — reversed from what a new user needs.
- No explanation of what a "component" is (paper code, weighting, etc.) before the user is asked to select one.
- No mention that data is stored locally in the browser and can be lost — important for a study tracker before an exam.
- Keyboard shortcut `N` opens notes but is never surfaced.

## 🟠 Poor empty states

- `SubjectSyllabus` empty chapter card: "No chapters yet. Import syllabus data to get started." — no button.
- `SubjectPapers` with no papers: renders filters, tabs, and a "Log Paper" button that leads to the dead end from issue #5.
- Dashboard Weak Areas / Next Action / Momentum all render "no data" tiles instead of collapsing.
- ComponentAnalyzer likely shows a similar empty grid (worth spot-checking).
- Settings integrity check panel shows nothing until pressed — no hint what it does.

## 🟠 Potentially overwhelming pages

- **Dashboard** (most severe): 10+ analytics widgets, several duplicative (SubjectHealth vs SubjectCard vs OverallProgress). First-time user has no way to hide advanced widgets.
- **SubjectOverview**: hero progress + import + deadlines + tabs + next action + weak areas + confidence explanation, all above the fold on desktop.
- **SubjectSyllabus**: two progress cards (Chapters + Topics), sync indicator, three filters (search / status / deadline), expand-all/collapse-all, plus deep-link highlight — a lot of chrome before you see a bullet.
- **Settings**: 887 lines of settings, no section index or search. Data Management, Subject Themes, Reminders, AI, Import/Export, Integrity all coexist.

---

## 🟢 Optional polish

- Rename "Study Buddy" logo to match app title (`README`, index.html, header) consistently.
- Give the streak counter a hover tooltip explaining the rules.
- Add a "?" info popover next to "Readiness" and "Momentum" scores.
- Show a subtle "scroll for more" fade on the header nav on narrow viewports.
- On the Import card, show the required CSV columns as a small `<code>` block and add a "Download sample CSV" link (`sample/syllabus-sample.csv` already exists).
- Consistent icon set for status (some places use emoji like 🎯 ✅ ⚠️ 🚀, others use lucide icons).
- Fade-in animations are already used; consider staggering Dashboard cards to reduce the "wall of widgets" impression.
- Breadcrumbs could be hidden on top-level pages to reduce chrome.
- Add labels to the Settings icon and Theme Toggle on tablet.

---

## Suggested priority order if you want to act on this

1. Rewrite the onboarding modal to match current confidence vocabulary and end with a **single next action** ("Import your first subject's syllabus") that deep-links to the Import card.
2. Fix the "Go to Syllabus" empty-state CTA to route to the subject's overview (where the importer lives), OR add the importer to the empty Syllabus page.
3. Progressive dashboard: hide Tier-2 analytics widgets until minimum data thresholds are met; promote NextAction + Readiness.
4. Fix the "Log Paper" dead end: link directly to the import flow when components are missing, and explain what components are.
5. Surface deadline setting from the Deadlines card, not only from inside a chapter.
6. Add a "Load sample data" button in Settings/Onboarding so users can explore before importing.

Approve this plan to convert any of the above into a concrete implementation plan, or tell me which items to drop.
