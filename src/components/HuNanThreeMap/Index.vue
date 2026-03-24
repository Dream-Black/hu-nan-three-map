<template>
  <div ref="container" class="three-container">
    <!-- 进度条 UI -->
    <div v-if="loading" class="progress-overlay">
      <div class="progress-container">
        <div class="progress-bar determinate" :style="{ width: progressPercent }"></div>
        <span class="progress-text">{{ progressText }}</span>
      </div>
    </div>
    <div v-if="error" class="error-overlay">
      <div class="error-message">加载失败: {{ error }}</div>
    </div>
    <img class="bg-img" src="/img/bg.jpg" alt="bg">
  </div>
</template>

<script>
import { ThreeManager, ModelLoader } from './three';

export default {
  name: 'HuNanThreeMap',
  props: {
    modelUrl: {
      type: String,
      default: '/threeModel/hunan.glb',
    },
    markers: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    markers: {
      handler(newMarkers) {
        if (this.manager) {
          this.manager.setMarkers(newMarkers);
        }
      },
      deep: true,
    },
  },
  data() {
    return {
      manager: null,
      progressPercent: '0%',
      progressText: '',
      error: null,
      loading: true,
    };
  },
  mounted() {
    const modelLoader = new ModelLoader();
    this.manager = new ThreeManager(this.$refs.container, modelLoader);

    if (this.markers) {
      this.manager.setMarkers(this.markers);
    }

    this.manager.loadModel(this.modelUrl, (xhr) => {
      // console.log(xhr.loaded)
      this.progressPercent = `${((xhr.loaded / 20332800) * 100).toFixed(0)}%`;
      this.progressText = `已加载: ${this.progressPercent}`;
      if (this.progressPercent === '100%') {
        this.loading = false;
      }
    });

    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.manager) {
      this.manager.dispose();
      this.manager = null;
    }
  },
  methods: {
    handleResize() {
      this.manager?.resize();
    },
  },
};
</script>

<style>
.three-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.bg-img {
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  pointer-events: none;
}

.progress-container {
  width: 300px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  position: relative;
  text-align: center;
}

.progress-bar.determinate {
  height: 20px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.2s ease;
}

@keyframes flow {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  line-height: 20px;
  color: white;
  font-size: 12px;
  text-shadow: 1px 1px 2px black;
  pointer-events: none;
}

/* 错误提示 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  font-size: 16px;
}
.error-message {
  background: #f44336;
  padding: 10px 20px;
  border-radius: 4px;
}
</style>
