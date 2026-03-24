import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import { citiesConfig } from './config';

const vertexShaderNeon = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 1.0;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShaderNeon = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    float threshold = 0.5;
    if (abs(vNormal.z) < threshold) {
      vec3 sideColor = vec3(0.05, 0.1, 0.2);
      gl_FragColor = vec4(sideColor, 1.0);
      return;
    }
    
    vec3 neonColors[3];
    neonColors[0] = vec3(0.2, 0.5, 1.0);
    neonColors[1] = vec3(0.3, 0.7, 1.0);
    neonColors[2] = vec3(0.5, 0.9, 1.0);
    
    float colorShift = sin(uTime * 1.5) * 0.5 + 0.5;
    vec3 baseColor = mix(neonColors[0], neonColors[2], colorShift);
    
    float edgeX = min(vUv.x, 1.0 - vUv.x);
    float edgeY = min(vUv.y, 1.0 - vUv.y);
    float edgeIntensity = min(edgeX, edgeY);
    
    float coreGlow = pow(1.0 - edgeIntensity, 1.5);
    
    float halo = 0.0;
    if (edgeIntensity < 0.1) {
      halo = (0.1 - edgeIntensity) * 5.0;
    }
    
    float pulse = 0.6 + sin(uTime * 4.0) * 0.3;
    float glowIntensity = (coreGlow * 0.8 + halo * 1.2) * pulse * uIntensity;
    
    vec3 finalColor = baseColor + vec3(0.6, 0.8, 1.0) * glowIntensity;
    float scanLine = sin(vUv.y * 200.0 + uTime * 20.0) * 0.1 + 0.9;
    finalColor *= scanLine;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export class CityManager {
  constructor(scene) {
    this.scene = scene;
    this.cities = [];
    this.sharedMaterial = null;
    this.font = null;
    this.animationId = null;
    this.startTime = null;
  }

  /**
   * 初始化管理器，加载字体并创建所有城市文字
   */
  async init() {
    // 加载字体
    const loader = new FontLoader();
    this.font = await loader.loadAsync('./font/CJ-gaodeguo-mh_Regular.json');

    // 创建共享材质
    this.sharedMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x33aaff) },
        uIntensity: { value: 1.2 },
      },
      vertexShader: vertexShaderNeon,
      fragmentShader: fragmentShaderNeon,
      transparent: false,
      side: THREE.DoubleSide,
    });

    // 为每个城市创建文字
    for (const city of citiesConfig) {
      await this.addCity(city.text, city.position);
    }

    // 启动动画
    this.startAnimation();
  }

  /**
   * 添加单个城市
   * @param {string} text 城市名称
   * @param {THREE.Vector3|Object} position
   */
  async addCity(text, position) {
    if (!this.font) {
      throw new Error('字体未加载，请先调用 init()');
    }

    // 创建几何体
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 0.2,
      height: 0.2,
      curveSegments: 12,
    });

    // 创建网格
    const mesh = new THREE.Mesh(geometry, this.sharedMaterial);

    // 设置位置（居中处理）
    geometry.computeBoundingBox();
    mesh.position.set(
      position.x - geometry.boundingBox.max.x / 2,
      position.y,
      position.z,
    );

    // 应用压扁效果（侧面更薄）
    mesh.scale.set(1, 1, 0.001);

    // 保存以便清理
    this.cities.push({ mesh, geometry });
    this.scene.add(mesh);
  }

  /**
   * 清空所有城市
   */
  clear() {
    this.cities.forEach((item) => {
      this.scene.remove(item.mesh);
      item.geometry.dispose();
    });
    this.cities = [];
  }

  /**
   * 动态更新城市列表（清空后重新添加）
   * @param {Array} cities
   */
  async updateCities(cities) {
    this.clear();
    for (const city of cities) {
      await this.addCity(city.text, city.position);
    }
  }

  /**
   * 启动动画循环（统一更新所有文字的 uTime）
   */
  startAnimation() {
    if (this.animationId) return;
    this.startTime = performance.now();

    const animate = () => {
      if (!this.sharedMaterial) return;

      const currentTime = (performance.now() - this.startTime) / 1000;
      this.sharedMaterial.uniforms.uTime.value = currentTime;

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 全局设置颜色（影响所有城市）
   */
  setColor(color) {
    if (this.sharedMaterial) {
      this.sharedMaterial.uniforms.uColor.value.setHex(color);
    }
  }

  /**
   * 全局设置发光强度
   */
  setIntensity(intensity) {
    if (this.sharedMaterial) {
      this.sharedMaterial.uniforms.uIntensity.value = intensity;
    }
  }

  /**
   * 彻底释放资源
   */
  dispose() {
    this.stopAnimation();
    this.clear();

    if (this.sharedMaterial) {
      this.sharedMaterial.dispose();
      this.sharedMaterial = null;
    }

    this.font = null;
  }
}
