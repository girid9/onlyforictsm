

# Phase 1: Core Upgrade - Score Machine Foundation

## Overview
Remove broken voice/tutor features, then add the most impactful scoring features: instant explanations, mock test timer, performance dashboard, streak calendar, and smart revision modes.

## What gets removed
- Voice answer hook (`useVoiceAnswer.ts`) and all mic button UI from Practice page
- AI Tutor chat component (`TutorChat.tsx`) and its FAB button from Practice page
- Related settings toggles (AI Tutor, Global Chat toggles in Practice settings)
- Voice hint overlay at bottom of Practice page

## What gets built

### 1. Instant Explanation After Answer
When a user selects an option and the answer is revealed:
- Show a clear "Correct!" or "Incorrect" label with color coding
- Display the existing `notes` field as "Why this is correct"
- For wrong answers, highlight what the user picked and why the correct answer is right
- Smooth fade-in animation for the explanation panel

### 2. Smart Revision Modes (new page `/revision`)
Add a Revision page accessible from the sidebar with 3 modes:
- **Wrong Questions Only** - pulls all incorrectly answered questions for re-practice
- **Hard Questions Only** - questions from topics where accuracy is below 50%
- **Fast 20 Challenge** - random 20 questions with a 10-minute countdown timer
Each mode launches the existing Practice component with a filtered question set.

### 3. Timed Mock Test Mode
Add a timer option to the Practice page settings panel:
- Toggle "Exam Mode" on/off
- Set time limit (15, 30, 45, 60 minutes)
- Countdown timer displayed in the header
- Auto-submit when time runs out (navigates to Results)
- Timer bar changes color as time runs low (green to amber to red)

### 4. Performance Dashboard (new page `/dashboard`)
A dedicated analytics page showing:
- Overall accuracy percentage (big number)
- Strong topics (top 3 by accuracy, green badges)
- Weak topics (bottom 3 by accuracy, red badges)
- Speed rating (average time per question)
- Accuracy trend line chart using Recharts (already installed)
- Recent activity feed

### 5. Streak Calendar + XP Levels
Enhance the existing streak/XP system in the sidebar and dashboard:
- Calendar heatmap showing practice days (last 30 days)
- Level system: Beginner (0-99 XP), Learner (100-499), Skilled (500-999), Expert (1000-2499), Master (2500+)
- Level badge displayed in sidebar next to XP
- Streak fire icon with day count

## Technical Details

### Files to delete
- `src/hooks/useVoiceAnswer.ts`
- `src/components/TutorChat.tsx`

### Files to modify
- `src/pages/Practice.tsx` - Remove voice/tutor imports and UI, add exam timer, enhance explanation panel
- `src/components/AppSidebar.tsx` - Add Revision and Dashboard nav links, add level badge
- `src/App.tsx` - Add routes for `/revision` and `/dashboard`
- `src/store/useAppStore.ts` - Add exam mode settings (timer enabled, duration)
- `src/utils/analytics.ts` - Add speed rating calculation, daily activity heatmap data
- `src/pages/Index.tsx` - Add streak calendar widget and level display

### New files to create
- `src/pages/Revision.tsx` - Revision mode selector with 3 cards
- `src/pages/Dashboard.tsx` - Full performance dashboard with charts
- `src/components/StreakCalendar.tsx` - 30-day heatmap grid component
- `src/components/LevelBadge.tsx` - XP level indicator component

### Data flow
- All analytics derived from the existing `answers` record in the persisted store (no database changes needed)
- Mock test timer state kept in Practice component local state
- Streak calendar computed from `answeredAt` timestamps already stored in answer records

## Sequence
1. Remove voice + tutor code
2. Enhance Practice page (better explanations + exam timer)
3. Build analytics utilities
4. Create Dashboard page
5. Create Revision page
6. Add StreakCalendar and LevelBadge components
7. Update sidebar navigation and routes

## Future Phases (not in this plan)
- Phase 2: Spaced repetition system, concept mode, keyword tooltips
- Phase 3: Multiplayer upgrades, AI mentor, simple/technical language toggle
