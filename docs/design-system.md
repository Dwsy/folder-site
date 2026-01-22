# Folder-Site CLI - Design System

This document outlines the design system implemented for the Folder-Site CLI project using Tailwind CSS.

## 🎨 Colors

### Primary Colors
- **Primary (Blue)**:
  - DEFAULT: `#3B82F6` (blue-500)
  - 50: `#EFF6FF` → 950: `#1E3A8A`
  - Used for: Primary actions, links, active states

### Semantic Colors
- **Success (Green)**:
  - DEFAULT: `#10B981` (emerald-500)
  - Used for: Success messages, positive indicators

- **Warning (Yellow)**:
  - DEFAULT: `#F59E0B` (amber-500)
  - Used for: Warnings, caution states

- **Error (Red)**:
  - DEFAULT: `#EF4444` (red-500)
  - Used for: Errors, destructive actions

- **Info (Cyan)**:
  - DEFAULT: `#06B6D4` (cyan-500)
  - Used for: Informational messages

### Neutral Colors
- **Background**:
  - Light: `#FFFFFF` (white)
  - Dark: `#0F172A` (slate-900)

- **Foreground**:
  - Light: `#0F172A` (slate-900)
  - Dark: `#F8FAFC` (slate-50)

- **Muted**:
  - Light: `#F1F5F9` (slate-100) / `#64748B` (slate-500)
  - Dark: `#1E293B` (slate-800) / `#94A3B8` (slate-400)

- **Border**:
  - Light: `#E2E8F0` (slate-200)
  - Dark: `#334155` (slate-700)

### Sidebar Colors
- **Background**:
  - Light: `#FFFFFF` (white)
  - Dark: `#1E293B` (slate-800)

- **Foreground**:
  - Light: `#0F172A` (slate-900)
  - Dark: `#F8FAFC` (slate-50)

## 📝 Typography

### Font Families
- **Sans**: IBM Plex Sans, sans-serif
- **Mono**: JetBrains Mono, monospace

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)

### Font Weights
- **light**: 300
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

### Line Heights
- **none**: 1
- **tight**: 1.25
- **snug**: 1.375
- **normal**: 1.5
- **relaxed**: 1.625
- **loose**: 2

### Letter Spacing
- **tighter**: -0.05em
- **tight**: -0.025em
- **normal**: 0em
- **wide**: 0.025em
- **wider**: 0.05em
- **widest**: 0.1em

## 📐 Spacing

### Base Unit: 0.25rem (4px)

| Name | Value | Pixels |
|------|-------|--------|
| 0 | 0 | 0px |
| px | 1px | 1px |
| 0.5 | 0.125rem | 2px |
| 1 | 0.25rem | 4px |
| 1.5 | 0.375rem | 6px |
| 2 | 0.5rem | 8px |
| 2.5 | 0.625rem | 10px |
| 3 | 0.75rem | 12px |
| 3.5 | 0.875rem | 14px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 7 | 1.75rem | 28px |
| 8 | 2rem | 32px |
| 9 | 2.25rem | 36px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |
| 20 | 5rem | 80px |
| 24 | 6rem | 96px |
| 32 | 8rem | 128px |
| 40 | 10rem | 160px |
| 48 | 12rem | 192px |
| 56 | 14rem | 224px |
| 64 | 16rem | 256px |

## 🔲 Border Radius

| Name | Value |
|------|-------|
| none | 0 |
| sm | 0.125rem (2px) |
| DEFAULT | 0.5rem (8px) |
| md | 0.375rem (6px) |
| lg | 0.5rem (8px) |
| xl | 0.75rem (12px) |
| 2xl | 1rem (16px) |
| 3xl | 1.5rem (24px) |
| full | 9999px |

## 🌫️ Shadows

| Name | Value |
|------|-------|
| xs | 0 1px 2px 0 rgb(0 0 0 / 0.05) |
| sm | 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) |
| DEFAULT | 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) |
| md | 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) |
| lg | 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) |
| xl | 0 25px 50px -12px rgb(0 0 0 / 0.25) |
| 2xl | 0 50px 100px -20px rgb(0 0 0 / 0.25) |
| inner | inset 0 2px 4px 0 rgb(0 0 0 / 0.05) |
| none | none |

## 📍 Z-Index Scale

| Name | Value |
|------|-------|
| base | 0 |
| dropdown | 10 |
| sticky | 20 |
| fixed | 30 |
| modal-backdrop | 40 |
| modal | 50 |
| popover | 60 |
| tooltip | 70 |

## 🎭 Animations

### Duration
- **75**: 75ms
- **100**: 100ms
- **150**: 150ms
- **200**: 200ms (default for micro-interactions)
- **300**: 300ms
- **500**: 500ms
- **700**: 700ms
- **1000**: 1000ms

### Easing
- **linear**: linear
- **in**: cubic-bezier(0.4, 0, 1, 1)
- **out**: cubic-bezier(0, 0, 0.2, 1)
- **in-out**: cubic-bezier(0.4, 0, 0.2, 1) (default)

### Keyframes
- **spin**: Rotate 360deg
- **ping**: Scale and fade
- **pulse**: Opacity animation
- **bounce**: Bounce animation
- **fade-in**: Fade from 0 to 1
- **fade-out**: Fade from 1 to 0
- **slide-in-from-top**: Slide from top
- **slide-in-from-bottom**: Slide from bottom
- **slide-in-from-left**: Slide from left
- **slide-in-from-right**: Slide from right
- **zoom-in**: Scale from 0.95 to 1
- **zoom-out**: Scale from 1 to 0.95

## 🧩 Components

### Button
Variants: `primary`, `secondary`, `ghost`, `outline`, `destructive`, `link`
Sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10)

```tsx
import { buttonVariants, cn } from '@/client/utils/cn';

<button className={cn(buttonVariants({ variant: 'primary', size: 'default' }))} />
```

### Card
Variants: `default`, `outlined`, `elevated`, `ghost`

```tsx
import { cardVariants, cn } from '@/client/utils/cn';

<div className={cn(cardVariants({ variant: 'default' }))}>
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-content">Content</div>
</div>
```

### Badge
Variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`
Sizes: `default` (px-2.5 py-0.5 text-xs), `sm`, `lg`

```tsx
import { badgeVariants, cn } from '@/client/utils/cn';

<span className={cn(badgeVariants({ variant: 'success' }))}>Success</span>
```

### Input
Variants: `default`, `filled`, `underlined`
Sizes: `default` (h-10), `sm` (h-9), `lg` (h-11)

```tsx
import { inputVariants, cn } from '@/client/utils/cn';

<input className={cn(inputVariants({ variant: 'default' }))} />
```

## 🛠️ Utility Functions

### cn()
Merge Tailwind CSS classes with proper precedence.

```tsx
import { cn } from '@/client/utils/cn';

cn('px-2 py-1', isActive && 'bg-blue-500', 'text-sm')
```

### variant()
Create type-safe variant class generators.

```tsx
import { variant } from '@/client/utils/cn';

const myVariants = variant({
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    }
  }
});
```

### responsive()
Generate responsive class names.

```tsx
import { responsive } from '@/client/utils/cn';

responsive({
  base: 'flex',
  sm: 'flex-row',
  md: 'flex-row md:gap-4',
  lg: 'flex-row lg:gap-8',
})
```

## ♿ Accessibility

### Color Contrast
- Normal text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

### Focus States
All interactive elements have visible focus rings:
```css
*:focus-visible {
  outline: none;
  ring: 2px solid var(--ring);
  ring-offset: 2px;
}
```

### Touch Targets
- Minimum touch target size: 44x44px
- Spacing between touch targets: 8px minimum

### Keyboard Navigation
- Tab order matches visual order
- All interactive elements are keyboard accessible
- Skip to content link available

### Screen Readers
- Semantic HTML elements used throughout
- ARIA labels on icon-only buttons
- Alt text on meaningful images

## 🌓 Dark Mode

The design system supports dark mode using the `dark:` prefix and CSS custom properties.

### Usage
```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
  Content
</div>
```

### CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Laptops |
| 2xl | 1536px | Large screens |

## 🎯 Best Practices

1. **Use semantic colors**: `primary`, `secondary`, `muted`, `accent`, `destructive`
2. **Maintain contrast**: Ensure text has sufficient contrast with background
3. **Consistent spacing**: Use the spacing scale (multiples of 4px)
4. **Proper hierarchy**: Use font sizes and weights to establish visual hierarchy
5. **Responsive design**: Always consider mobile-first approach
6. **Accessibility first**: Ensure all components are keyboard accessible
7. **Performance**: Use Tailwind's utility classes instead of custom CSS when possible
8. **Consistency**: Use the provided component variants for consistency

## 📚 Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)