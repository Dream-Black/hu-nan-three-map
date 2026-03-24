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
        { position: { x: 1, y: 0, z: 2 }, html: '<span>铁塔A</span>', type: '信号塔' },
        { position: { x: -2, y: 0, z: -1 }, html: '<div style="color:yellow;">铁塔B</div>', type: '信号塔' },
        { position: { x: 1, y: 2, z: -3 }, html: '<div>卫星A</div>', type: '卫星' },
        { position: { x: -4, y: 1.5, z: 1 }, html: '', type: '无人机' },
      ],
    };
  },
  mounted(){
    setTimeout(() => {
      this.markersData[1].html = '<div style="color:orange;">铁塔B</div>'
    }, 5 * 1000)
  }
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
