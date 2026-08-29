---
name: shadcn-ui
description: Best practices and CLI guidelines for installing, customizing, and composing shadcn/ui and Radix UI components in Next.js.
---

# shadcn/ui Guide & Component Recipes

## Adding Components
When adding shadcn/ui components:
1. Prefer running the shadcn CLI or inspecting the existing components/ui/ folder before creating custom primitives.
2. Ensure components are installed in @/components/ui/.
3. Always utilize the cn() helper (clsx + 	ailwind-merge) when merging className props:
   `	sx
   import { cn } from @/lib/utils;

   export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
     return <div className={cn(rounded-xl border bg-card text-card-foreground shadow, className)} {...props} />;
   }
   `

## Best Practices
- **Radix Primitives**: Preserve accessibility props (keyboard navigation, focus traps, ARIA roles) when wrapping Radix primitives (Dialog, DropdownMenu, Tooltip, Popover).
- **Controlled vs Uncontrolled**: Maintain standard React patterns for form inputs (integrate with React Hook Form & Zod when applicable).
- **Icons**: Use lucide-react with standard sizing (size-4, size-5) and consistent icon styling.
