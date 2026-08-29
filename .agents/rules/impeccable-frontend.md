# Impeccable Frontend Code Quality Guidelines

## 1. Code Quality & Type Safety
- **Strict TypeScript**: Avoid ny. Explicitly type component props, event handlers, and API responses.
- **Component Modularity**: Keep components focused and single-purpose. Extract subcomponents when a file exceeds ~200 lines.
- **Clean State Management**: Minimize unnecessary state. Derive state during render where possible.

## 2. Accessibility (a11y)
- Target WCAG 2.1 AA compliance:
  - All interactive elements must be keyboard accessible (Tab, Enter, Space, Escape).
  - Interactive icons must have ria-label or visually hidden text (sr-only).
  - Form fields must have associated <label> elements or ria-labelledby.
  - Contrast ratios must meet minimum standards (4.5:1 for normal text).

## 3. Performance & Next.js Best Practices
- Prevent Layout Shifts (CLS) by providing explicit dimensions or aspect ratios for media/images (
ext/image).
- Keep Client Components (use client) at the leaves of the component tree to maximize Server Component benefits.
- Clean up side effects and event listeners inside useEffect.
