<template>
  <div id="app">
    <HuNanThreeMap></HuNanThreeMap>
  </div>
</template>

<script>
import HuNanThreeMap from './components/HuNanThreeMap/Index.vue'

export default {
  name: 'App',
  components: {
    HuNanThreeMap
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
