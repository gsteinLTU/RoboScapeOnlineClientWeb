// Global Window augmentation for the app. Kept minimal and specific to
// properties used by `src/routes/+page.svelte` so TypeScript sees the types in
// Svelte components.

export {};

declare global {
    interface Window {
        externalVariables: Record<string, any>;
        RoboScapeOnline_fns?: any;
        disableDrag?: () => void;
        createDialog?: (title: string, modal?: boolean, buttons?: string[]) => HTMLElement | null;
        setupDialog?: (el: HTMLElement | null, modal?: boolean) => void;
    }
}
