/**
 * INP (Interaction to Next Paint) Optimization Utilities
 * 
 * These utilities help improve INP scores by yielding to the main thread
 * before executing potentially blocking operations.
 * 
 * @see https://web.dev/inp/
 */

/**
 * Wraps a callback to yield to the main thread before executing,
 * improving Interaction to Next Paint (INP) scores.
 * 
 * Uses the Scheduler API if available (Chrome 115+), otherwise falls back
 * to setTimeout which still allows the browser to paint before executing.
 * 
 * @example
 * ```tsx
 * const handleClick = () => {
 *   yieldToMain(() => {
 *     // Heavy state update or computation
 *     setItems(processLargeArray(data));
 *   });
 * };
 * ```
 */
export function yieldToMain(callback: () => void): void {
  // Use Scheduler.yield() if available (modern browsers)
  if (typeof window !== 'undefined' && 'scheduler' in window) {
    const scheduler = (window as Window & { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) {
      scheduler.yield().then(callback);
      return;
    }
  }
  
  // Fallback to setTimeout(0) which still yields to the main thread
  setTimeout(callback, 0);
}

/**
 * Creates a debounced version of a function that yields to main thread.
 * Useful for scroll handlers, resize handlers, and other frequent events.
 * 
 * @param callback - The function to debounce
 * @param delay - Debounce delay in milliseconds (default: 100)
 * @returns Debounced function
 * 
 * @example
 * ```tsx
 * const handleScroll = yieldingDebounce(() => {
 *   updateScrollPosition();
 * }, 100);
 * ```
 */
export function yieldingDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      yieldToMain(() => callback(...args));
    }, delay);
  };
}

/**
 * Wraps an async operation to yield before and after execution.
 * Useful for data fetching or other async operations triggered by user interaction.
 * 
 * @param asyncFn - The async function to wrap
 * @returns Promise that resolves after yielding
 * 
 * @example
 * ```tsx
 * const handleSubmit = async () => {
 *   await yieldingAsync(async () => {
 *     await submitForm(data);
 *   });
 * };
 * ```
 */
export async function yieldingAsync<T>(asyncFn: () => Promise<T>): Promise<T> {
  // Yield before starting
  await new Promise<void>((resolve) => yieldToMain(resolve));
  
  // Execute the async function
  const result = await asyncFn();
  
  // Yield after completion to allow paint
  await new Promise<void>((resolve) => yieldToMain(resolve));
  
  return result;
}

