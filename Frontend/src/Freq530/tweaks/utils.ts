
// Utility to prevent zustand setters from being called during render
export function useSafeZustandSetter<T extends (...args: any[]) => any>(setter: T, name: string): T {
  let inRender = false;
  // This is a runtime check, not a React hook
  const wrapped = ((...args: any[]) => {
    if (typeof window !== 'undefined') {
      // Check if we're in a render phase by inspecting the React call stack
      const err = new Error();
      if (err.stack && err.stack.includes('render')) {
        throw new Error(`Zustand setter '${name}' called during render! This is not allowed.`);
      }
    }
    return setter(...args);
  }) as T;
  return wrapped;
}