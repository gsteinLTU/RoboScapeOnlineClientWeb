// Minimal global typings for external scripts used at runtime.
// Keeps Svelte/TypeScript happy during compilation.

declare global {
  interface Window {
    externalVariables: any;
    createDialog: (...args: any[]) => HTMLElement;
    setupDialog: (...args: any[]) => void;
    RoboScapeOnline_fns?: any;
  }

  // Some external code calls disableDrag; provide a global declaration so
  // TypeScript doesn't error if it's referenced before the runtime script
  // overwrites it.
  function disableDrag(): void;
}

export {};
