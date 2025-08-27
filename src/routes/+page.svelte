
<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// noop disableDrag until external script provides an implementation
	function disableDrag() {
		/* noop until external script provides an implementation */
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

		if (browser) {
			const win = window as any;
			win.externalVariables = win.externalVariables || {};

			// Create 3D view dialog for later use
			{
				const dialogEl = win.createDialog('RoboScape Online') as HTMLElement;
				if (dialogEl) {
					dialogEl.style.width = '400px';
					dialogEl.style.height = '400px';
					const canvas = document.createElement('canvas');
					canvas.id = 'roboscape-canvas';
					canvas.style.flex = '1 1 auto';
					canvas.style.overflow = 'hidden';
					const contentElement = dialogEl.querySelector('content') as HTMLElement | null;
					if (contentElement) {
						contentElement.style.display = 'flex';
						(contentElement.style as any)['flex-flow'] = 'column';
						(contentElement.style as any)['justify-content'] = 'flex-end';
						contentElement.appendChild(canvas);
						win.setupDialog(dialogEl);
						win.externalVariables['roboscapedialog'] = dialogEl;

						const buttonbar = document.createElement('div');
						buttonbar.id = 'roboscapebuttonbar';
						buttonbar.style.flex = '0 1';
						contentElement.appendChild(buttonbar);

						const robotmenu_label = document.createElement('label');
						robotmenu_label.innerText = 'Robot ID:';
						buttonbar.appendChild(robotmenu_label);
						const robotmenu = document.createElement('select');
						robotmenu.className = 'inset';
						robotmenu.onpointerdown = (e: Event) => { e.stopPropagation(); disableDrag(); };
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

				const joinDialog = win.createDialog('Join a Session', false, ['Join', 'Close']) as HTMLElement;
				const joinContent = joinDialog ? (joinDialog.querySelector('content') as HTMLElement | null) : null;
				if (joinContent) {
					joinContent.innerHTML += `
				<div style="margin-bottom: 12px;"><label>Room ID:&nbsp;</label><input list="roboscapedialog-join-rooms-list" class="inset"/></div>
				<div><label>Password:&nbsp;</label><input class="inset"/></div>
				`;
				}

				win.setupDialog(joinDialog, false);
				win.externalVariables['roboscapedialog-join'] = joinDialog;

				const newEnvsList = document.createElement('datalist');
				newEnvsList.id = 'roboscapedialog-new-environments-list';
				document.body.appendChild(newEnvsList);
				win.externalVariables['roboscapedialog-new-environments-list'] = newEnvsList;

				const newDialog = win.createDialog('Create a Session', false, ['Create', 'Edit Mode', 'Close']) as HTMLElement;
				const newContent = newDialog ? (newDialog.querySelector('content') as HTMLElement | null) : null;
				if (newContent) {
					newContent.innerHTML += `
				<div style="margin-bottom: 12px;"><label>Environment:&nbsp;</label><input list="roboscapedialog-new-environments-list" id="roboscapedialog-new-environment" class="inset"/></div>
				<div><label>Password:&nbsp;</label><input id="roboscapedialog-new-password" class="inset"/></div>
				`;
				}

				win.setupDialog(newDialog, false);
				win.externalVariables['roboscapedialog-new'] = newDialog;
			}
		}
	});
</script>

<svelte:head>
    <link rel="stylesheet" href="https://pseudomorphic.netsblox.org/style.css">
</svelte:head>

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