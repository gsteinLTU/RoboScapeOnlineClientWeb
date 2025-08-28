<script lang="ts">
  // Lightweight component that renders the scene root and canvas used
  // by the RoboScape client. The canvas has a stable id so existing
  // code that queries #roboscape-canvas keeps working.
  export let canvasId: string = 'roboscape-canvas';
</script>

<div id="scene-root" class="w-full h-full">
  <canvas id={canvasId} width="700" height="500"></canvas>
</div>

<style>
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
