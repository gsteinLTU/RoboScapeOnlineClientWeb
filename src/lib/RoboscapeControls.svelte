<script lang="ts">
import { browser } from '$app/environment';
import { onMount } from 'svelte';
    import { roomId } from './roboscapeStore';

let beepsEnabled = true;
let idBillboardsEnabled = true;
let robotMenu: HTMLSelectElement | null = null;

onMount(() => {
    if (!browser) return;
    try {
        const b = localStorage.getItem('roboscape_beep');
        if (b !== null) beepsEnabled = b === 'true';
        const ib = localStorage.getItem('roboscape_id_billboards');
        if (ib !== null) idBillboardsEnabled = ib === 'true';
    } catch {}

    // Make robot menu available to external scripts
    if (typeof window !== 'undefined') {
        const win = window as any;
        win.externalVariables = win.externalVariables || {};
        // The robot menu will be available after the component mounts
        // We'll set it up in a reactive statement or after mount
    }
});

// Store robot menu reference for external scripts
$: if (robotMenu && typeof window !== 'undefined') {
    const win = window as any;
    win.externalVariables = win.externalVariables || {};
    win.externalVariables['roboscapedialog-robotmenu'] = robotMenu;
}

function toggleBeeps() {
    try { localStorage.setItem('roboscape_beep', beepsEnabled ? 'true' : 'false'); } catch {}
}

function toggleBillboards() {
    try { localStorage.setItem('roboscape_id_billboards', idBillboardsEnabled ? 'true' : 'false'); } catch {}
}

function callFnIfReady(name: string) {
    const f = (window as any).RoboScapeOnline_fns && (window as any).RoboScapeOnline_fns[name];
    if (typeof f === 'function') {
        try { f(); }
        catch (e) { console.error(`Error calling ${name}`, e); }
    } else {
        console.warn(`${name} not available yet`);
    }
}

function copyRobotId() {
    if(browser){
        const selectedOption = robotMenu?.selectedOptions[0];
        if (selectedOption) {
            navigator.clipboard.writeText(selectedOption.value)
                .then(() => {
                    console.log(`Copied robot ID: ${selectedOption.value}`);
                })
                .catch(err => {
                    console.error('Failed to copy robot ID: ', err);
                });
        }
    }
}

function handleNew() { callFnIfReady('new_sim_menu'); }
function handleJoin() { callFnIfReady('join_sim_menu'); }
function handleResetCamera() { callFnIfReady('reset_camera_menu'); }

function handleRobotMenuPointerDown(e: Event) {
    e.stopPropagation();
    if (typeof window !== 'undefined' && (window as any).disableDrag) {
        (window as any).disableDrag();
    }
}
</script>

{#if browser}
    <div id="roboscape-controls" style="position:fixed;right:12px;top:12px;background:rgba(255,255,255,0.9);border-radius:8px;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:999;">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:160px;">
            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                <button on:click={handleNew} class="inset">New simulation...</button>
                <button on:click={handleJoin} class="inset">Join room...</button>
                <button on:click={handleResetCamera} class="inset">Reset Camera</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;padding-top:4px;border-top:1px solid rgba(0,0,0,0.06);">
                <label style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" bind:checked={beepsEnabled} on:change={toggleBeeps} />
                    Beeps Enabled
                </label>
                <label style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" bind:checked={idBillboardsEnabled} on:change={toggleBillboards} />
                    Robot ID Billboards
                </label>
            </div>
        </div>
    </div>
    <div id="roboscapebuttonbar" style="display:{$roomId ? 'block' : 'none'};">
        <label>
            Selected Robot:
            <select class="inset" on:pointerdown={handleRobotMenuPointerDown} bind:this={robotMenu}>
                <option></option>
            </select>
        </label>
        <button class="inset" on:click={copyRobotId}>
            Copy ID
        </button>
    </div>
{/if}

<style>
    .inset, :global(#roboscapebuttonbar button) {
        padding: 4px 8px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .inset:hover, :global(#roboscapebuttonbar button:hover) {
        background: #f0f0f0;
        cursor: pointer;
    }

    .inset:active, :global(#roboscapebuttonbar button:active) {
        background: #e0e0e0;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    } 

    :global(#roboscapebuttonbar) {
        position: fixed;
        left: 12px;
        top: 12px;
        max-width: 40vw;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 999;
    }
</style>