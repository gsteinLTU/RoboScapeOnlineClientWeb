
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Provide a typed noop `disableDrag` which external scripts may override by
	// assigning to `window.disableDrag`. We also expose a typed `externalVariables`
	// on `window` used across the module.
	// Default no-op. External scripts can replace `window.disableDrag` with an
	// actual implementation. (Window augmentation lives in `src/types/window.d.ts`.)
	const disableDrag = () => { /* no-op */ };
	if (typeof window !== 'undefined') {
		window.externalVariables = window.externalVariables || {};
		// Only set the window-level default if nothing else provided.
		if (typeof window.disableDrag !== 'function') window.disableDrag = disableDrag;
	}

	// Small helper to create a labeled input pair safely instead of using innerHTML
	function createLabeledInput(labelText: string, opts?: { listId?: string; id?: string; cls?: string; type?: string }) {
		const container = document.createElement('div');
		container.style.marginBottom = '12px';
		const label = document.createElement('label');
		label.innerText = labelText + '\u00A0'; // non-breaking space
		const input = document.createElement('input');
		input.type = opts?.type || 'text';
		if (opts?.listId) input.setAttribute('list', opts.listId);
		if (opts?.id) input.id = opts.id;
		if (opts?.cls) input.className = opts.cls;
		// Improve accessibility
		input.setAttribute('aria-label', labelText.replace(/[:\s]+$/,''));
		container.appendChild(label);
		container.appendChild(input);
		return container;
	}

	// Helper that wraps window.createDialog safely and returns the dialog element
	// along with its <content> element (if present). Callers still should call
	// `window.setupDialog` where appropriate.
	function safeCreateDialog(title: string, modal = true, buttons?: string[]) {
		if (typeof window === 'undefined' || typeof window.createDialog !== 'function') {
			return { dialogEl: null as HTMLElement | null, contentEl: null as HTMLElement | null };
		}
		const dialogEl = window.createDialog(title, modal, buttons) as HTMLElement | null;
		if (!dialogEl) return { dialogEl: null, contentEl: null };
		const contentEl = dialogEl.querySelector('content') as HTMLElement | null;
		return { dialogEl, contentEl };
	}

	function loadScript(url: string, async = true) {
		return new Promise<void>((resolve, reject) => {
			// SSR guard
			if (typeof document === 'undefined') return resolve();
			// Avoid loading the same script twice
			if (document.querySelector(`script[src="${url}"]`)) return resolve();
			const s = document.createElement('script');
			s.src = url;
			s.async = async;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error(`Failed to load ${url}`));
			document.head.appendChild(s);
		});
	}

	// Controls component is extracted to a separate file
	import RoboscapeControls from '$lib/RoboscapeControls.svelte';

	onMount(async () => {
		try {
			// Load core first, then loaders and GUI so dependencies are available
			const urls = [
				'https://preview.babylonjs.com/babylon.js',
				'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js',
				'https://preview.babylonjs.com/gui/babylon.gui.js',
                'https://pseudomorphic.netsblox.org/script.js'
			];

			for (const u of urls) await loadScript(u);

			// BABYLON is available on window after loading
			// You can initialize your scene here, e.g.:
			// const BABYLON = (window as any).BABYLON;
			console.log('Babylon scripts loaded', !!(window as any).BABYLON);

			// Create dialogs and required DOM before initializing the wasm package.
			if (browser) {
				const win = window as any;
				win.externalVariables = win.externalVariables || {};

				// Create 3D view dialog for later use
				{
					const { dialogEl, contentEl } = safeCreateDialog('RoboScape Online');
					if (dialogEl) {
						dialogEl.style.width = '400px';
						dialogEl.style.height = '400px';
						const canvas = document.createElement('canvas');
						canvas.id = 'roboscape-canvas';
						canvas.style.flex = '1 1 auto';
						canvas.style.overflow = 'hidden';
						if (contentEl) {
							contentEl.style.display = 'flex';
							(contentEl.style as any)['flex-flow'] = 'column';
							(contentEl.style as any)['justify-content'] = 'flex-end';
							contentEl.appendChild(canvas);
							win.setupDialog(dialogEl);
							win.externalVariables['roboscapedialog'] = dialogEl;

							const buttonbar = document.createElement('div');
							buttonbar.id = 'roboscapebuttonbar';
							buttonbar.style.flex = '0 1';
							contentEl.appendChild(buttonbar);

							const robotmenu_label = document.createElement('label');
							robotmenu_label.innerText = 'Robot ID:';
							buttonbar.appendChild(robotmenu_label);
							const robotmenu = document.createElement('select');
							robotmenu.className = 'inset';
							robotmenu.onpointerdown = (e: Event) => { e.stopPropagation(); (window.disableDrag || disableDrag)(); };
							const nonchoice = document.createElement('option');
							robotmenu.appendChild(nonchoice);
							buttonbar.appendChild(robotmenu);
							win.externalVariables['roboscapedialog-robotmenu'] = robotmenu;
						}
					}
				}

				// Create join dialog for later use
				{
					const joinList = document.createElement('datalist');
					joinList.id = 'roboscapedialog-join-rooms-list';
					document.body.appendChild(joinList);
					win.externalVariables['roboscapedialog-join-rooms-list'] = joinList;

					const { dialogEl: joinDialog, contentEl: joinContent } = safeCreateDialog('Join a Session', false, ['Join', 'Close']);
					if (joinDialog && joinContent) {
						joinContent.appendChild(createLabeledInput('Room ID:', { listId: 'roboscapedialog-join-rooms-list', cls: 'inset' }));
						joinContent.appendChild(createLabeledInput('Password:', { cls: 'inset', type: 'password' }));
					}
					win.setupDialog(joinDialog, false);
					win.externalVariables['roboscapedialog-join'] = joinDialog;

					const newEnvsList = document.createElement('datalist');
					newEnvsList.id = 'roboscapedialog-new-environments-list';
					document.body.appendChild(newEnvsList);
					win.externalVariables['roboscapedialog-new-environments-list'] = newEnvsList;

					const { dialogEl: newDialog, contentEl: newContent } = safeCreateDialog('Create a Session', false, ['Create', 'Edit Mode', 'Close']);
					if (newDialog && newContent) {
						newContent.appendChild(createLabeledInput('Environment:', { listId: 'roboscapedialog-new-environments-list', id: 'roboscapedialog-new-environment', cls: 'inset' }));
						newContent.appendChild(createLabeledInput('Password:', { id: 'roboscapedialog-new-password', cls: 'inset', type: 'password' }));
					}
					win.setupDialog(newDialog, false);
					win.externalVariables['roboscapedialog-new'] = newDialog;
				}
				

				// Create 3D view dialog for later use
				{
					const { dialogEl, contentEl } = safeCreateDialog('RoboScape Online');
					if (dialogEl) {
						dialogEl.style.width = '400px';
						dialogEl.style.height = '400px';
						const canvas = document.createElement('canvas');
						canvas.id = 'roboscape-canvas';
						canvas.style.flex = '1 1 auto';
						canvas.style.overflow = 'hidden';
						if (contentEl) {
							contentEl.style.display = 'flex';
							(contentEl.style as any)['flex-flow'] = 'column';
							(contentEl.style as any)['justify-content'] = 'flex-end';
							contentEl.appendChild(canvas);
							win.setupDialog(dialogEl);
							win.externalVariables['roboscapedialog'] = dialogEl;

							const buttonbar = document.createElement('div');
							buttonbar.id = 'roboscapebuttonbar';
							buttonbar.style.flex = '0 1';
							contentEl.appendChild(buttonbar);

							const robotmenu_label = document.createElement('label');
							robotmenu_label.innerText = 'Robot ID:';
							buttonbar.appendChild(robotmenu_label);
							const robotmenu = document.createElement('select');
							robotmenu.className = 'inset';
							robotmenu.onpointerdown = (e: Event) => { e.stopPropagation(); (window.disableDrag || disableDrag)(); };
							const nonchoice = document.createElement('option');
							robotmenu.appendChild(nonchoice);
							buttonbar.appendChild(robotmenu);
							win.externalVariables['roboscapedialog-robotmenu'] = robotmenu;
						}
					}
				}

				// Create join dialog for later use
				{
					const joinList = document.createElement('datalist');
					joinList.id = 'roboscapedialog-join-rooms-list';
					document.body.appendChild(joinList);
					win.externalVariables['roboscapedialog-join-rooms-list'] = joinList;

					const { dialogEl: joinDialog, contentEl: joinContent } = safeCreateDialog('Join a Session', false, ['Join', 'Close']);
					if (joinDialog && joinContent) {
						joinContent.appendChild(createLabeledInput('Room ID:', { listId: 'roboscapedialog-join-rooms-list', cls: 'inset' }));
						joinContent.appendChild(createLabeledInput('Password:', { cls: 'inset', type: 'password' }));
					}
					win.setupDialog(joinDialog, false);
					win.externalVariables['roboscapedialog-join'] = joinDialog;

					const newEnvsList = document.createElement('datalist');
					newEnvsList.id = 'roboscapedialog-new-environments-list';
					document.body.appendChild(newEnvsList);
					win.externalVariables['roboscapedialog-new-environments-list'] = newEnvsList;

					const { dialogEl: newDialog, contentEl: newContent } = safeCreateDialog('Create a Session', false, ['Create', 'Edit Mode', 'Close']);
					if (newDialog && newContent) {
						newContent.appendChild(createLabeledInput('Environment:', { listId: 'roboscapedialog-new-environments-list', id: 'roboscapedialog-new-environment', cls: 'inset' }));
						newContent.appendChild(createLabeledInput('Password:', { id: 'roboscapedialog-new-password', cls: 'inset', type: 'password' }));
					}
					win.setupDialog(newDialog, false);
					win.externalVariables['roboscapedialog-new'] = newDialog;
				}
			}
			// Load the wasm/js package via dynamic import instead of injecting a
			// multiline <script> into innerHTML (which causes unescaped line
			// break syntax errors when compiled).
			try {
				// Use SvelteKit `base` to calculate the correct absolute
				// paths when the app is hosted on a subpath (e.g. GitHub Pages).
				// Fetch the JS as text, create a blob to bypass Vite's public
				// file import restrictions, then dynamically import the
				// blob URL so the wrapper can fetch its .wasm file.
				// `base` is provided by SvelteKit and is an empty string in
				// dev when served at root.
				// Import `base` lazily to avoid SSR issues.
				const { base } = await import('$app/paths');
				const jsUrl = `${base}/pkg/roboscapesim_client.js`;
				const wasmUrl = `${base}/pkg/roboscapesim_client_bg.wasm`;

				const response = await fetch(jsUrl);
				const jsText = await response.text();
				const blob = new Blob([jsText], { type: 'text/javascript' });
				const blobUrl = URL.createObjectURL(blob);
				const mod = await import(blobUrl);
				URL.revokeObjectURL(blobUrl); // Clean up

				// wasm-pack style packages often export an init/default function
				if (typeof (mod as any).default === 'function') {
					// Pass the explicit wasm URL so the wrapper doesn't try
					// to fetch from the domain root.
					await (mod as any).default(wasmUrl);
				}

				const {
					join_sim_menu,
					new_sim_menu,
					reset_camera_menu,
					robots_in_room,
					room_id,
					show_3d_view
				} = mod as any;

				(window as any).RoboScapeOnline_fns = {
					join_sim_menu,
					new_sim_menu,
					reset_camera_menu,
					robots_in_room,
					room_id,
					show_3d_view
				};
			} catch (e) {
				console.error('Failed to load roboscapesim_client', e);
			}
		} catch (err) {
			console.error('Error loading external scripts', err);
		}

	});
</script>

<svelte:head>
    <link rel="stylesheet" href="https://pseudomorphic.netsblox.org/style.css">
</svelte:head>

<RoboscapeControls />

	<div id="scene-root" style="width:100%;height:100%;">
	<canvas id="roboscape-canvas"></canvas>
	</div>

	<!-- Hidden element so the #roboscapebuttonbar selector is considered used by Svelte -->
	<div style="display:none;">
		<div id="roboscapebuttonbar"></div>
	</div>

<style>
	:global(#roboscapebuttonbar *) {
		margin: auto 5px;
	}
</style>