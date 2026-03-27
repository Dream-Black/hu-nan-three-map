import * as THREE from 'three';

/**
 * 丁达尔效应光束
 * 从 marker 位置向下投射的锥形光束
 */
export class TyndallBeam {
  constructor(scene, position, options = {}) {
    this.scene = scene;
    this.position = position.clone();
    this.options = Object.assign({
      color: new THREE.Color(0x88ccff),
      intensity: 0.6,
      height: 3.0,
      topRadius: 0.3,
      bottomRadius: 1.2,
      fadeSpeed: 2.0
    }, options);

    this.mesh = null;
    this.material = null;
    this.isActive = false;
    this.startTime = 0;
    this.duration = 2.0;

    this.init();
  }

  init() {
    // 创建锥形几何体
    const geometry = new THREE.ConeGeometry(
      this.options.bottomRadius,
      this.options.height,
      32,
      1,
      true
    );

    // 调整几何体位置，使锥顶在上方
    geometry.translate(0, -this.options.height / 2, 0);

    // 创建自定义材质
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.options.color },
        uIntensity: { value: this.options.intensity },
        uTime: { value: 0 },
        uProgress: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          vUv = uv;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          // 从顶部到底部的渐变
          float gradient = smoothstep(-1.0, 0.0, vHeight);
          
          // 中心到边缘的渐变（丁达尔效应通常是中心亮边缘暗）
          float centerDist = distance(vUv, vec2(0.5, 0.5));
          float radialFade = 1.0 - smoothstep(0.0, 0.5, centerDist);
          
          // 随时间淡入淡出
          float timeFade = sin(uProgress * 3.14159);
          
          // 添加轻微的闪烁效果
          float flicker = 0.9 + 0.1 * sin(uTime * 3.0);
          
          float alpha = gradient * radialFade * timeFade * uIntensity * flicker;
          
          // 底部更透明
          alpha *= smoothstep(-1.0, -0.3, vHeight);
          
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(this.position);
    this.mesh.visible = false;

    this.scene.add(this.mesh);
  }

  trigger() {
    this.isActive = true;
    this.startTime = performance.now() / 1000;
    this.mesh.visible = true;
  }

  update(currentTime) {
    if (!this.isActive) return;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1.0);

    this.material.uniforms.uTime.value = currentTime;
    this.material.uniforms.uProgress.value = progress;

    // 更新位置跟随飞行动画
    this.mesh.position.copy(this.position);

    if (progress >= 1.0) {
      this.isActive = false;
      this.mesh.visible = false;
    }
  }

  setPosition(position) {
    this.position.copy(position);
    if (this.mesh) {
      this.mesh.position.copy(position);
    }
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.material.dispose();
      this.mesh = null;
    }
  }
}

/**
 * 持续存在的丁达尔光束（用于卫星和无人机的持续扩散波）
 */
export class SustainedTyndallBeam {
  constructor(scene, getPositionFn, options = {}) {
    this.scene = scene;
    this.getPositionFn = getPositionFn; // 获取位置的函数，用于跟随飞行动画
    this.options = Object.assign({
      color: new THREE.Color(0x88ccff),
      intensity: 0.4,
      height: 3.0,
      topRadius: 0.2,
      bottomRadius: 1.0,
      pulseSpeed: 1.5
    }, options);

    this.mesh = null;
    this.material = null;
    this.isActive = false;

    this.init();
  }

  init() {
    const geometry = new THREE.ConeGeometry(
      this.options.bottomRadius,
      this.options.height,
      32,
      1,
      true
    );

    geometry.translate(0, -this.options.height / 2, 0);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.options.color },
        uIntensity: { value: this.options.intensity },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          vUv = uv;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uTime;
        varying vec2 vUv;
        varying float vHeight;
        
        void main() {
          float gradient = smoothstep(-1.0, 0.0, vHeight);
          
          float centerDist = distance(vUv, vec2(0.5, 0.5));
          float radialFade = 1.0 - smoothstep(0.0, 0.5, centerDist);
          
          // 持续的脉冲效果
          float pulse = 0.7 + 0.3 * sin(uTime * 2.0);
          
          float alpha = gradient * radialFade * uIntensity * pulse;
          alpha *= smoothstep(-1.0, -0.3, vHeight);
          
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.visible = false;

    this.scene.add(this.mesh);
  }

  start() {
    this.isActive = true;
    this.mesh.visible = true;
  }

  stop() {
    this.isActive = false;
    this.mesh.visible = false;
  }

  update(currentTime) {
    if (!this.isActive) return;

    this.material.uniforms.uTime.value = currentTime;

    // 更新位置
    const position = this.getPositionFn();
    if (position) {
      this.mesh.position.copy(position);
    }
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.material.dispose();
      this.mesh = null;
    }
  }
}
