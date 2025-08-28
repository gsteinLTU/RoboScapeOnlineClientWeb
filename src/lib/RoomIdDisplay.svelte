<script lang="ts">
	import { roomId } from './roboscapeStore';
</script>

{#if $roomId}
<div>
	Room ID: {$roomId}
</div>
{/if}

<style>
	div {
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border-radius: 4px;
		font-family: monospace;
		font-size: 14px;
		position: absolute;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
	}
</style>
