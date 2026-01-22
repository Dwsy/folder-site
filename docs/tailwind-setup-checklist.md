# Tailwind CSS Setup Checklist

## ✅ Configuration Files

- [x] `tailwind.config.ts` - Extended with full design system
  - [x] Content paths configured for `./src/client/**/*.{js,ts,jsx,tsx}` and `./public/index.html`
  - [x] Dark mode configured with `class` strategy
  - [x] Extended color palette (primary, secondary, muted, accent, destructive, etc.)
  - [x] Semantic colors (success, warning, error, info)
  - [x] Font families configured (IBM Plex Sans, JetBrains Mono)
  - [x] Extended spacing scale
  - [x] Border radius variants
  - [x] Shadow scale
  - [x] Z-index scale
  - [x] Animation keyframes
  - [x] Transition durations and easings

- [x] `postcss.config.js` - Configured with tailwindcss and autoprefixer plugins

## ✅ Global Styles

- [x] `src/client/styles/globals.css` - Created with:
  - [x] Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
  - [x] CSS custom properties for light and dark mode
  - [x] Base layer with global styles
  - [x] Typography improvements (headings, paragraphs, links)
  - [x] Focus visible styles for accessibility
  - [x] Custom scrollbar styles
  - [x] Selection styles
  - [x] Code block styles
  - [x] Component layer with reusable classes (card, button, badge, tooltip, skeleton, separator, container, glass, sidebar)
  - [x] Utility layer with custom utilities (text-balance, scrollbar-hide, aspect ratios, safe area insets, print styles, reduced motion)

## ✅ Utility Functions

- [x] `src/client/utils/cn.ts` - Created with:
  - [x] `cn()` function for merging Tailwind classes with proper precedence
  - [x] `variant()` function for type-safe variant class generators
  - [x] `buttonVariants` preset (primary, secondary, ghost, outline, destructive, link)
  - [x] `cardVariants` preset (default, outlined, elevated, ghost)
  - [x] `badgeVariants` preset (default, secondary, destructive, outline, success, warning, info)
  - [x] `inputVariants` preset (default, filled, underlined)
  - [x] `createThemeVars()` function for CSS variable generation
  - [x] `responsive()` function for responsive class names

## ✅ Dependencies

All required dependencies are listed in `package.json`:

- [x] `tailwindcss: ^3.4.14` (devDependency)
- [x] `postcss: ^8.4.47` (devDependency)
- [x] `autoprefixer: ^10.4.20` (devDependency)
- [x] `clsx: ^2.1.1` (dependency)
- [x] `tailwind-merge: ^2.5.4` (dependency)

Note: Dependencies will be installed in Task 006 (安装依赖)

## ✅ Documentation

- [x] `docs/design-system.md` - Comprehensive design system documentation with:
  - [x] Color palette (primary, semantic, neutral, sidebar)
  - [x] Typography (font families, sizes, weights, line heights, letter spacing)
  - [x] Spacing scale
  - [x] Border radius
  - [x] Shadows
  - [x] Z-index scale
  - [x] Animations (durations, easings, keyframes)
  - [x] Component examples (Button, Card, Badge, Input)
  - [x] Utility functions documentation
  - [x] Accessibility guidelines
  - [x] Dark mode usage
  - [x] Responsive breakpoints
  - [x] Best practices

## 🎯 Next Steps

1. **Install dependencies** (Task 006):
   ```bash
   npm install
   # or
   bun install
   ```

2. **Import global styles in your React app**:
   ```tsx
   import '@/client/styles/globals.css';
   ```

3. **Use utility functions in components**:
   ```tsx
   import { cn, buttonVariants } from '@/client/utils/cn';
   
   <button className={cn(buttonVariants({ variant: 'primary' }))}>
     Click me
   </button>
   ```

4. **Test dark mode**:
   - Add `dark` class to `<html>` or `<body>` element
   - Verify all colors switch correctly

5. **Verify accessibility**:
   - Check focus states on all interactive elements
   - Verify color contrast ratios
   - Test keyboard navigation

## 📋 Verification

To verify the setup after installing dependencies:

```bash
# Check Tailwind CSS is working
npx tailwindcss --version

# Build CSS to verify no errors
npx tailwindcss -i ./src/client/styles/globals.css -o ./dist/output.css

# Check configuration
npx tailwindcss --help
```

## 🎨 Design System Features

### Supported Features
- ✅ Full color palette with semantic colors
- ✅ Dark mode with CSS variables
- ✅ Responsive design utilities
- ✅ Accessibility-first approach
- ✅ Component variants system
- ✅ Custom animations
- ✅ Typography scale
- ✅ Spacing system
- ✅ Shadow scale
- ✅ Z-index management

### Design Principles
- **Accessibility First**: All components follow WCAG guidelines
- **Responsive**: Mobile-first approach with breakpoints
- **Consistent**: Unified design tokens across the app
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new variants and utilities

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind Merge Documentation](https://github.com/dcastil/tailwind-merge)
- [CLSX Documentation](https://github.com/lukeed/clsx)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
