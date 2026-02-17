
# Personalised Dashboard

Enhance the existing dashboard (Index.tsx) with intelligent, performance-based recommendations that help learners focus on their weak areas and track improvement over time.

## What You'll Get

- **Weak Topics Section**: A "Recommended for You" area highlighting topics where your accuracy is lowest, so you always know what to study next
- **Subject Progress Rings**: Visual circular progress indicators for each subject showing completion percentage at a glance
- **Recent Activity Feed**: A timeline of your last few practice sessions with scores, replacing the single "Resume Last Session" card
- **Performance Trend**: A small sparkline chart showing your accuracy trend over your last 10 answered batches
- **Adaptive Difficulty Badge**: Each recommended topic shows a difficulty tag (Easy / Medium / Hard) based on your historical accuracy on that topic

## How It Works

All recommendations are computed locally from your existing answer history (the `answers` record in the progress store). No backend changes or new database tables are needed -- everything derives from the data already stored in localStorage.

---

## Technical Details

### 1. New utility: `src/utils/analytics.ts`
A pure-function module that takes the `answers` record and the question data, and computes:
- Per-topic accuracy (correct / attempted)
- Per-subject completion percentage (attempted / total)
- Weakest N topics sorted by accuracy ascending
- Recent activity timeline from answer timestamps (requires a small store change)
- Accuracy trend buckets

### 2. Store update: `src/store/useAppStore.ts`
- Add `answeredAt: string` (ISO timestamp) to the `AnswerRecord` interface so we can build a recent activity feed and accuracy trend
- Existing answers without `answeredAt` will gracefully default (treated as "no timestamp")

### 3. Dashboard redesign: `src/pages/Index.tsx`
Restructure the page into sections:

```text
+----------------------------------+
| Dashboard Header + Stats Grid    |
+----------------------------------+
| Recommended Topics (weak areas)  |
|  [Topic Card] [Topic Card] ...   |
+----------------------------------+
| Subject Progress    | Recent     |
|  [Ring] [Ring] ...  | Activity   |
|                     | Feed       |
+----------------------------------+
| Accuracy Trend (sparkline)       |
+----------------------------------+
| Quick Actions (Subjects/Battle)  |
+----------------------------------+
```

- **Recommended Topics**: Up to 4 cards showing weakest topics with accuracy %, question count, difficulty badge, and a "Practice" link. Uses glass-card styling with accent gradient strip.
- **Subject Progress Rings**: SVG-based circular progress for each subject. Animated on mount with framer-motion.
- **Recent Activity**: Last 5 answered topics with score, displayed as a compact timeline.
- **Accuracy Trend**: Uses the existing `recharts` dependency to render a tiny area/line chart of accuracy over recent batches.

### 4. New component: `src/components/ProgressRing.tsx`
A reusable SVG circular progress indicator component accepting `value` (0-100), `size`, and `color` props. Animated with framer-motion's `motion.circle` for the stroke-dashoffset.

### Files Modified
1. `src/store/useAppStore.ts` -- add `answeredAt` to AnswerRecord
2. `src/utils/analytics.ts` -- new file with analytics computation functions
3. `src/components/ProgressRing.tsx` -- new reusable progress ring component
4. `src/pages/Index.tsx` -- redesigned dashboard with all new sections
