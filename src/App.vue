<template>
  <div id="app">
    <HuNanThreeMap
      :markers="markersData"
      ref="huNanThreeMapRef"
      @moveInto="onMoveInto"
      @moveOut="onMoveOut"
      @click="onClick"
    ></HuNanThreeMap>

    <button @click="onRest">重置视角</button>
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
        { position: { x: 3, y: 0.5, z: 4 }, html: '<span>铁塔A</span>', type: '信号塔', name: '铁塔A', enableRipple: true },
        { position: { x: 2, y: 0.5, z: -1 }, html: '<div style="color:yellow;">铁塔B</div>', type: '信号塔', name: '铁塔B', enableRipple: true },
        { position: { x: -3, y: 0.5, z: 1 }, html: '<div>铁塔C</div>', type: '信号塔', name: '铁塔C', enableRipple: true },
        { position: { x: 0, y: 0.5, z: 1.5 }, html: '<div>铁塔D</div>', type: '信号塔', name: '铁塔D', enableRipple: true },
        { position: { x: 3, y: 2, z: -3 }, html: '<div>卫星A</div>', type: '卫星', name: '卫星A', enableRipple: true },
        { position: { x: 0, y: 2.5, z: 4 }, html: '<div>卫星B</div>', type: '卫星', name: '卫星B', enableRipple: false },
        { position: { x: -2, y: 2, z: 0 }, html: '<div>卫星C</div>', type: '卫星', name: '卫星C', enableRipple: false },
        { position: { x: -4, y: 2.5, z: 1 }, html: '<div>无人机A</div>', type: '无人机', name: '无人机A', enableRipple: true },
        { position: { x: 4, y: 2, z: 2 }, html: '<div>无人机B</div>', type: '无人机', name: '无人机B', enableRipple: false },
      ],
    };
  },
  mounted(){
    setTimeout(() => {
      this.markersData[1].html = '<div style="color:orange;">铁塔B</div>'
    }, 5 * 1000)
  },
  methods: {
    onRest() {
      this.$refs.huNanThreeMapRef.resetView();
    },

    onMoveInto(event) {
      console.log('移入', event)
    },

    onMoveOut(event) {
      console.log('移出', event)
    },

    onClick(event) {
      console.log('点击', event)
    }
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
  position: relative;
}

button {
  position: absolute;
  top: 10px;
  left: 10px;
}
</style>
