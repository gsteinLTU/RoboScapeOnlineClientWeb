
<script lang="ts">
    import { browser } from '$app/environment';
	import { onMount } from 'svelte';

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
							// Fetch the JS as text, create a blob to bypass Vite's public file import restrictions,
							// then dynamically import the blob URL so the wrapper can fetch its .wasm file.
							const response = await fetch('/pkg/roboscapesim_client.js');
							const jsText = await response.text();
							const blob = new Blob([jsText], { type: 'text/javascript' });
							const blobUrl = URL.createObjectURL(blob);
							const mod = await import(blobUrl);
							URL.revokeObjectURL(blobUrl); // Clean up

							// wasm-pack style packages often export an init/default function
							if (typeof (mod as any).default === 'function') {
								await (mod as any).default();
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

        if(browser) {
            window.externalVariables = {};
            // Create 3D view dialog for later use
            {
                var element = window.createDialog('RoboScape Online');
                element.style.width = '400px';
                element.style.height = '400px';
                const canvas = document.createElement('canvas');
                canvas.id = 'roboscape-canvas';
                canvas.style.flex = '1 1 auto';
                canvas.style.overflow = 'hidden';
                const contentElement = element.querySelector('content');
                contentElement.style.display = 'flex';
                contentElement.style['flex-flow'] = 'column';
                contentElement.style['justify-content'] = 'flex-end';
                contentElement.appendChild(canvas);
                window.setupDialog(element);        
                window.externalVariables['roboscapedialog'] = element;

                
                const buttonbar = document.createElement('div');
                buttonbar.id = 'roboscapebuttonbar';
                buttonbar.style.flex = '0 1';
                element.querySelector('content').appendChild(buttonbar);
                
                const robotmenu_label = document.createElement('label');
                robotmenu_label.innerText = 'Robot ID:';
                buttonbar.appendChild(robotmenu_label);
                const robotmenu = document.createElement('select');
                robotmenu.className = 'inset';
                robotmenu.onpointerdown = (e) => { e.stopPropagation(); disableDrag(); };
                const nonchoice = document.createElement('option');
                robotmenu.appendChild(nonchoice);
                buttonbar.appendChild(robotmenu);
                window.externalVariables['roboscapedialog-robotmenu'] = robotmenu;
            }

            // Create join dialog for later use
            {
                var element = document.createElement('datalist');
                element.id = 'roboscapedialog-join-rooms-list';
                document.body.appendChild(element);
                window.externalVariables['roboscapedialog-join-rooms-list'] = element;

                element = window.createDialog('Join a Session', false, ['Join', 'Close']);
                element.querySelector('content').innerHTML += `
                <div style="margin-bottom: 12px;"><label>Room ID:&nbsp;</label><input list="roboscapedialog-join-rooms-list" class="inset"/></div>
                <div><label>Password:&nbsp;</label><input class="inset"/></div>
                `;

                window.setupDialog(element, false);
                window.externalVariables['roboscapedialog-join'] = element;


                element = document.createElement('datalist');
                element.id = 'roboscapedialog-new-environments-list';
                document.body.appendChild(element);
                window.externalVariables['roboscapedialog-new-environments-list'] = element;

                element = window.createDialog('Create a Session', false, ['Create', 'Edit Mode', 'Close']);
                element.querySelector('content').innerHTML += `
                <div style="margin-bottom: 12px;"><label>Environment:&nbsp;</label><input list="roboscapedialog-new-environments-list" id="roboscapedialog-new-environment" class="inset"/></div>
                <div><label>Password:&nbsp;</label><input id="roboscapedialog-new-password" class="inset"/></div>
                `;

                window.setupDialog(element, false);
                window.externalVariables['roboscapedialog-new'] = element;

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

<style>
    #roboscapebuttonbar * {
        margin: auto 5px;
    }
</style>