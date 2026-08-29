# UI/UX Pro Max & Frontend Design Guidelines

Apply the following design principles whenever creating, styling, or refactoring UI components or web pages:

## 1. Visual Hierarchy & Composition
- **Focal Points**: Establish a clear visual hierarchy with deliberate font sizes, weights, and color contrast.
- **Spacing Rhythm**: Adhere to consistent 4px / 8px spacing scales (p-2, p-4, p-6, gap-4, etc.). Never mix arbitrary padding values without rationale.
- **Containers & Elevation**: Use subtle borders (order-border/40), subtle shadows (shadow-sm, shadow-md), and backdrop blurs (ackdrop-blur-md bg-background/80) rather than harsh solid borders.

## 2. Color & Dark Mode
- Use semantic color tokens (e.g. g-background, 	ext-foreground, 	ext-muted-foreground, g-primary, g-accent).
- Never hardcode raw hex colors in JSX when theme tokens are available.
- Ensure all components look stunning and high-contrast in both Light and Dark modes.

## 3. Typography
- Pair expressive headings (tight tracking, high contrast) with highly legible body text.
- Use tabular numbers (	abular-nums) for timers, metrics, data grids, and monetary values.

## 4. Micro-Interactions & Animation
- Add smooth transitions to interactive elements (	ransition-colors duration-200, hover:scale-[1.02] active:scale-[0.98]).
- Use subtle skeleton loaders or optimistic UI during asynchronous states rather than abrupt layout shifts.
- Keep animation durations snappy (150ms–300ms) with clean easing (ease-out / cubic-bezier).
