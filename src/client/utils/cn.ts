import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence.
 * This combines clsx for conditional class handling and tailwind-merge
 * for resolving Tailwind class conflicts.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', isActive && 'bg-blue-500', 'text-sm')
 * // Returns: 'px-2 py-1 bg-blue-500 text-sm'
 *
 * cn('px-2', 'px-4') // Returns: 'px-4' (last one wins)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Type-safe variant class generator
 * Useful for creating component variants with proper type inference
 *
 * @example
 * ```tsx
 * const buttonVariants = variant({
 *   variants: {
 *     variant: {
 *       primary: 'bg-blue-500 text-white',
 *       secondary: 'bg-gray-200 text-gray-900',
 *     }
 *   }
 * })
 * ```
 */
export function variant<T extends Record<string, Record<string, string>>>(
  config: {
    variants: T;
    defaultVariants?: Partial<{ [K in keyof T]: keyof T[K] }>;
  }
) {
  return (props: { [K in keyof T]?: keyof T[K] } = {}) => {
    const classes: string[] = [];

    for (const [key, value] of Object.entries(props)) {
      if (value && config.variants[key as keyof T]) {
        const variantValue = config.variants[key as keyof T]?.[value as string];
        if (variantValue) {
          classes.push(variantValue);
        }
      }
    }

    // Apply default variants if not provided
    if (config.defaultVariants) {
      for (const [key, value] of Object.entries(config.defaultVariants)) {
        if (!props[key as keyof T] && value) {
          const defaultValue = config.variants[key as keyof T]?.[value as string];
          if (defaultValue) {
            classes.push(defaultValue);
          }
        }
      }
    }

    return cn(...classes);
  };
}

/**
 * Create a component with base styles and optional variants
 *
 * @example
 * ```tsx
 * const Button = ({ variant = 'primary', className, ...props }) => {
 *   return (
 *     <button
 *       className={cn(
 *         'rounded-md px-4 py-2 font-medium',
 *         buttonVariants({ variant }),
 *         className
 *       )}
 *       {...props}
 *     />
 *   );
 * };
 * ```
 */
export const buttonVariants = variant({
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

/**
 * Card variant styles
 */
export const cardVariants = variant({
  variants: {
    variant: {
      default: 'border bg-card text-card-foreground shadow-sm',
      outlined: 'border-2 border-border bg-transparent',
      elevated: 'border-0 bg-card shadow-lg',
      ghost: 'border-0 bg-transparent shadow-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Badge variant styles
 */
export const badgeVariants = variant({
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'text-foreground',
      success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
      warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
    },
    size: {
      default: 'px-2.5 py-0.5 text-xs',
      sm: 'px-2 py-0.5 text-[10px]',
      lg: 'px-3 py-1 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

/**
 * Input variant styles
 */
export const inputVariants = variant({
  variants: {
    variant: {
      default: 'border-input bg-background ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      filled: 'border-transparent bg-muted focus-visible:bg-background',
      underlined: 'border-x-0 border-t-0 border-b-2 border-input bg-transparent rounded-none px-0',
    },
    size: {
      default: 'h-10 px-3 py-2',
      sm: 'h-9 px-2 py-1 text-sm',
      lg: 'h-11 px-4 py-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

/**
 * Create CSS variable-based theme utilities
 */
export function createThemeVars(colors: Record<string, string>) {
  const vars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(colors)) {
    vars[`--${key}`] = value;
  }
  
  return vars;
}

/**
 * Generate responsive class names
 * Automatically adds responsive prefixes based on breakpoints
 *
 * @example
 * ```tsx
 * responsive({
 *   base: 'flex',
 *   sm: 'flex-row',
 *   md: 'flex-row md:gap-4',
 *   lg: 'flex-row lg:gap-8',
 * })
 * // Returns: 'flex flex-row flex-row md:gap-4 flex-row lg:gap-8'
 * ```
 */
export function responsive(classes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}) {
  return cn(
    classes.base,
    classes.sm,
    classes.md,
    classes.lg,
    classes.xl,
    classes['2xl']
  );
}