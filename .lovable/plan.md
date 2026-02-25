
# Complete UI Overhaul — Deep Teal Glassmorphism

Redesigning every page and component to match the reference images: a **deep teal/green gradient background** with **frosted glass cards**, clean white text, and a premium mobile-first feel.

---

## What Changes

### 1. New Color System & Background (`src/index.css`)
- Replace the current light grey-green palette with a **deep teal gradient background** (dark green-to-teal flowing gradient, like the water/nature reference)
- Cards become **translucent white glass** (white at 10-15% opacity with strong blur)
- Text becomes **white/light** on the dark background
- Primary accent stays **bright teal/green** for buttons and highlights
- All 5 theme variants get updated to this dark glassmorphism style

### 2. Layout & Navigation (`src/components/Layout.tsx`, `src/components/AppSidebar.tsx`)
- Background becomes a **full-screen gradient** (deep teal to dark green, flowing diagonally)
- Header becomes **transparent with glass blur** instead of solid card
- Sidebar gets the same **dark glass treatment** with translucent panels
- Add a subtle **bottom tab bar** for mobile (Home, Subjects, Revision, Dashboard) — matching the reference nav style

### 3. Home Page (`src/pages/Index.tsx`)
- Hero section with **greeting on the gradient background** (no card, just bold white text)
- Stats pills become **glass capsules** (translucent with blur)
- Continue card becomes a **prominent glass card** with green glow button
- Subject cards become **horizontal glass strips** with teal progress bars

### 4. Subjects & Topics (`src/pages/Subjects.tsx`, `src/pages/Topics.tsx`)
- Cards become **glass panels** with subtle white borders
- Icons get a **teal glow background circle**
- Progress bars use **gradient teal fill**
- Clean spacing with larger touch targets

### 5. Practice/Quiz (`src/pages/Practice.tsx`, `src/pages/RevisionPractice.tsx`)
- Header becomes **transparent glass** over the gradient
- Option buttons become **glass cards** that glow teal on hover
- Correct/wrong feedback uses **green/red glass overlays**
- Footer navigation becomes a **floating glass bar**

### 6. Results (`src/pages/Results.tsx`)
- Score displayed in a **large glass hero card** with the progress ring
- Action buttons become **glass or gradient teal buttons**
- Review cards use **glass panels with colored left borders**

### 7. Dashboard (`src/pages/Dashboard.tsx`)
- Stats in **glass metric cards** with subtle icons
- Charts get **transparent backgrounds** with teal-colored lines
- Calendar/streak section in a **glass container**

### 8. Revision, Bookmarks, Wrong Answers
- All cards converted to **glass panels** on the dark gradient
- Consistent rounded corners (20px), blur effects, and teal accents

### 9. Tailwind Config (`tailwind.config.ts`)
- Update shadow system for **glass glow effects** (teal-tinted shadows)
- Add gradient background utilities

---

## Technical Details

### Color Palette (CSS Variables)
```text
Background:  Deep teal gradient (hsl 170-190, 40-60% saturation, 12-20% lightness)
Card:        White at 10-15% opacity + blur(20px)
Foreground:  White (0 0% 98%)
Muted:       White at 50-60% opacity
Primary:     Bright teal (170 70% 50%)
Border:      White at 15-20% opacity
```

### Glass Card Pattern
```text
background: rgba(255, 255, 255, 0.08)
backdrop-filter: blur(24px) saturate(1.4)
border: 1px solid rgba(255, 255, 255, 0.12)
border-radius: 20px
```

### Files Modified (13 files)
1. `src/index.css` — Complete color/utility rewrite
2. `tailwind.config.ts` — Shadow & animation updates
3. `src/config/themes.ts` — Theme definitions update
4. `src/components/Layout.tsx` — Gradient bg, glass header, bottom nav
5. `src/components/AppSidebar.tsx` — Dark glass sidebar
6. `src/pages/Index.tsx` — Glass cards, gradient hero
7. `src/pages/Subjects.tsx` — Glass subject cards
8. `src/pages/Topics.tsx` — Glass topic list
9. `src/pages/Practice.tsx` — Glass quiz interface
10. `src/pages/RevisionPractice.tsx` — Glass quiz interface
11. `src/pages/Results.tsx` — Glass results
12. `src/pages/Dashboard.tsx` — Glass analytics
13. `src/pages/Revision.tsx` — Glass revision cards
14. `src/pages/Bookmarks.tsx` — Glass bookmarks
15. `src/pages/WrongAnswers.tsx` — Glass wrong answers
