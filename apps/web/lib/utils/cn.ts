// ======================================================================
// CLASS NAME UTILITIES
// Utilitas untuk menggabungkan class names dengan conditional logic
// ======================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Alternative function name for cn
 */
export const classNames = cn;

/**
 * Conditionally apply classes
 * @param baseClasses - Base classes to always apply
 * @param conditionalClasses - Object with condition as key and classes as value
 * @returns Combined class string
 */
export function conditionalClasses(
  baseClasses: string,
  conditionalClasses: Record<string, boolean>
): string {
  const classes = [baseClasses];
  
  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className);
    }
  });
  
  return cn(...classes);
}

/**
 * Create variant-based class names
 * @param base - Base classes
 * @param variants - Variant configurations
 * @param props - Props to determine which variants to apply
 * @returns Combined class string
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  base: string,
  variants: T,
  props: Partial<{ [K in keyof T]: keyof T[K] }>
): string {
  const classes = [base];
  
  Object.entries(props).forEach(([key, value]) => {
    if (value && variants[key] && variants[key][value as string]) {
      classes.push(variants[key][value as string]);
    }
  });
  
  return cn(...classes);
}

/**
 * Merge multiple class objects
 * @param objects - Objects containing class definitions
 * @returns Merged class object
 */
export function mergeClasses<T extends Record<string, string>>(
  ...objects: T[]
): T {
  const result = {} as T;
  
  objects.forEach(obj => {
    Object.entries(obj).forEach(([key, value]) => {
      if (result[key as keyof T]) {
        result[key as keyof T] = cn(result[key as keyof T], value) as T[keyof T];
      } else {
        result[key as keyof T] = value as T[keyof T];
      }
    });
  });
  
  return result;
}

/**
 * Apply responsive classes
 * @param classes - Object with breakpoint as key and classes as value
 * @returns Combined responsive class string
 */
export function responsiveClasses(classes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}): string {
  const responsiveClassArray: string[] = [];
  
  if (classes.base) responsiveClassArray.push(classes.base);
  if (classes.sm) responsiveClassArray.push(`sm:${classes.sm}`);
  if (classes.md) responsiveClassArray.push(`md:${classes.md}`);
  if (classes.lg) responsiveClassArray.push(`lg:${classes.lg}`);
  if (classes.xl) responsiveClassArray.push(`xl:${classes.xl}`);
  if (classes['2xl']) responsiveClassArray.push(`2xl:${classes['2xl']}`);
  
  return cn(...responsiveClassArray);
}

/**
 * Apply state-based classes (hover, focus, active, etc.)
 * @param classes - Object with state as key and classes as value
 * @returns Combined state class string
 */
export function stateClasses(classes: {
  base?: string;
  hover?: string;
  focus?: string;
  active?: string;
  disabled?: string;
  visited?: string;
}): string {
  const stateClassArray: string[] = [];
  
  if (classes.base) stateClassArray.push(classes.base);
  if (classes.hover) stateClassArray.push(`hover:${classes.hover}`);
  if (classes.focus) stateClassArray.push(`focus:${classes.focus}`);
  if (classes.active) stateClassArray.push(`active:${classes.active}`);
  if (classes.disabled) stateClassArray.push(`disabled:${classes.disabled}`);
  if (classes.visited) stateClassArray.push(`visited:${classes.visited}`);
  
  return cn(...stateClassArray);
}

/**
 * Create theme-aware classes
 * @param lightClasses - Classes for light theme
 * @param darkClasses - Classes for dark theme
 * @returns Combined theme class string
 */
export function themeClasses(lightClasses: string, darkClasses: string): string {
  return cn(lightClasses, `dark:${darkClasses}`);
}

/**
 * Apply animation classes with optional conditions
 * @param animation - Animation class name
 * @param condition - Whether to apply animation
 * @param duration - Animation duration class
 * @returns Combined animation class string
 */
export function animationClasses(
  animation: string,
  condition = true,
  duration?: string
): string {
  if (!condition) return '';
  
  const classes = [animation];
  if (duration) classes.push(duration);
  
  return cn(...classes);
}

/**
 * Create size variant classes
 * @param size - Size variant (xs, sm, md, lg, xl)
 * @param sizeMap - Mapping of size to classes
 * @returns Size-specific classes
 */
export function sizeClasses(
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  sizeMap: Record<string, string>
): string {
  return sizeMap[size] || sizeMap.md || '';
}

/**
 * Create color variant classes
 * @param color - Color variant
 * @param colorMap - Mapping of color to classes
 * @returns Color-specific classes
 */
export function colorClasses(
  color: string,
  colorMap: Record<string, string>
): string {
  return colorMap[color] || colorMap.default || '';
}

/**
 * Utility for creating component class factories
 * @param baseClasses - Base classes for the component
 * @param variants - Variant configurations
 * @returns Function that generates classes based on props
 */
export function createClassFactory<
  T extends Record<string, Record<string, string>>
>(baseClasses: string, variants: T) {
  return (props: Partial<{ [K in keyof T]: keyof T[K] }> & { className?: string }) => {
    const { className, ...variantProps } = props;
    return cn(
      baseClasses,
      createVariants('', variants, variantProps),
      className
    );
  };
}

// ======================================================================
// PREDEFINED CLASS COMBINATIONS
// ======================================================================

/**
 * Common button classes
 */
export const buttonClasses = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary'
    },
    size: {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md',
      icon: 'h-10 w-10'
    }
  }
};

/**
 * Common input classes
 */
export const inputClasses = {
  base: 'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    size: {
      default: 'h-10',
      sm: 'h-9',
      lg: 'h-11'
    },
    variant: {
      default: 'border-input',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-green-500 focus-visible:ring-green-500'
    }
  }
};

/**
 * Common card classes
 */
export const cardClasses = {
  base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  header: 'flex flex-col space-y-1.5 p-6',
  title: 'text-2xl font-semibold leading-none tracking-tight',
  description: 'text-sm text-muted-foreground',
  content: 'p-6 pt-0',
  footer: 'flex items-center p-6 pt-0'
};

/**
 * Common dialog classes
 */
export const dialogClasses = {
  overlay: 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  content: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full',
  header: 'flex flex-col space-y-1.5 text-center sm:text-left',
  title: 'text-lg font-semibold leading-none tracking-tight',
  description: 'text-sm text-muted-foreground',
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2'
};

/**
 * Common table classes
 */
export const tableClasses = {
  table: 'w-full caption-bottom text-sm',
  header: 'border-b',
  body: '[&_tr:last-child]:border-0',
  footer: 'bg-muted/50 font-medium [&>tr]:last:border-b-0',
  row: 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
  head: 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
  cell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0',
  caption: 'mt-4 text-sm text-muted-foreground'
};

export default cn;