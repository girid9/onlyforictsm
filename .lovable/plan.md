

# Theme and UI Redesign: Frosted Glass / Steel Blue

Based on the reference image, the app will shift from the current Blue & White Neumorphism to a **Frosted Glassmorphism** style with a cool **steel-blue and soft gray** palette.

## Visual Direction (from reference)
- **Light mode**: Pale gray-blue background, white frosted-glass cards with blur/transparency, subtle borders
- **Dark mode**: Deep navy/slate background, translucent dark cards with blue tint, frosted blur
- Rounded corners (2xl), soft shadows, no hard neumorphic raised/pressed effects
- Clean typography, generous spacing
- Accent color: soft teal-blue for primary actions, coral/red for small highlights

---

## Changes

### 1. Color Palette Update (`src/index.css`)
- **Light mode**: Background shifts to cool pale blue-gray (`hsl(215, 20%, 95%)`), cards become white with slight transparency, primary becomes a muted steel-blue (`hsl(215, 60%, 55%)`)
- **Dark mode**: Background becomes deep navy (`hsl(220, 30%, 10%)`), cards become translucent dark slate, primary becomes lighter steel-blue
- Accent: soft coral/salmon for small highlights
- Muted tones for secondary elements

### 2. Glassmorphism Utility Classes (`src/index.css`)
- Replace neumorphic `box-shadow` effects with `backdrop-filter: blur()` and semi-transparent backgrounds
- `.glass` and `.glass-card`: white/dark with ~60-80% opacity + blur(20px) + subtle border
- `.compact-card`: frosted glass treatment
- `.arctic-btn` / `.compact-btn`: transparent backgrounds with hover glow instead of inset shadows
- `.option-btn`: frosted glass with soft border, no raised shadow

### 3. Tailwind Config (`tailwind.config.ts`)
- Remove neumorphic shadow definitions (`neu`, `neu-dark`, `neu-inset`)
- Add glass-related shadows: soft drop shadows with low opacity
- Keep existing animations

### 4. Hero Background (`src/index.css`)
- Update `.app-hero` gradients to use the new steel-blue tones

### 5. Page-Level UI Tweaks
- **Index.tsx (Dashboard)**: Update stat cards and action cards to use frosted glass classes, add `backdrop-blur` styling
- **Subjects.tsx**: Update subject cards to frosted glass style with softer gradient strips
- **Topics.tsx**: Update topic list items to use glass styling
- **Practice.tsx**: Update header/footer bars to frosted translucent style
- **AppSidebar.tsx**: Apply frosted glass background to sidebar

---

## Technical Details

### New CSS Variables (Light)
```
--background: 215 20% 95%
--card: 0 0% 100%  (used with opacity)
--primary: 215 60% 55%
--accent: 12 80% 62%  (coral)
--border: 215 15% 88%
```

### New CSS Variables (Dark)
```
--background: 220 30% 10%
--card: 220 25% 16%  (used with opacity)
--primary: 215 70% 62%
--accent: 12 80% 65%
--border: 220 20% 20%
```

### Glass Utility Example
```css
.glass-card {
  background: hsl(var(--card) / 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px hsl(var(--border) / 0.15);
}
```

### Files Modified
1. `src/index.css` -- color variables + utility classes
2. `tailwind.config.ts` -- shadow cleanup
3. `src/pages/Index.tsx` -- dashboard card styling
4. `src/pages/Subjects.tsx` -- subject card styling
5. `src/pages/Topics.tsx` -- topic list styling
6. `src/pages/Practice.tsx` -- header/footer glass treatment
7. `src/components/AppSidebar.tsx` -- sidebar glass background

