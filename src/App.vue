<template>
  <div id="app">
    <HuNanThreeMap
      :markers="markersData"
    ></HuNanThreeMap>
  </div>
</template>

<script>
import HuNanThreeMap from './components/HuNanThreeMap/Index.vue'

export default {
  name: 'App',
  components: {
    HuNanThreeMap
  },
  data() {
    return {
      markersData: [
        { position: { x: 1, y: 1, z: 2 }, html: '<span>铁塔A</span>' },
        { position: { x: -2, y: 1, z: -1 }, html: '<div style="color:yellow;">铁塔B</div>' },
      ],
    };
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100vw;
  height: 100vh;
}
</style>
