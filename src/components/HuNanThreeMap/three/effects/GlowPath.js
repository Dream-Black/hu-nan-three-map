import * as THREE from 'three';

export class GlowPath {
  constructor(scene, pathMesh) {
    this.scene = scene;
    this.pathMesh = pathMesh;
    this.flowMesh = null;
    this.baseGlowMesh = null;
    this.initFlow();
  }

  initFlow() {
    // 基础管道：放在默认 Layer 0
    this.pathMesh.material = new THREE.MeshBasicMaterial({
      color: 0x8DC4F2,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    const flowGeo = this.pathMesh.geometry;

    // 1. 基础辉光层 - 让整个线条都有微弱的辉光
    this.baseGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x8DC4F2) },
        uIntensity: { value: 0.25 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position + normal * 0.02;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uIntensity;
        void main() {
          // 边缘淡出效果
          float edgeMask = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.5);
          gl_FragColor = vec4(uColor * uIntensity, edgeMask * 0.1);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.baseGlowMesh = new THREE.Mesh(flowGeo, this.baseGlowMaterial);
    // 基础辉光也放到 Layer 1
    this.baseGlowMesh.layers.set(1);
    this.pathMesh.add(this.baseGlowMesh);

    // 2. 流动高光层 - 3个长条高光
    this.flowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x8DC4F2) },
        uSpeed: { value: 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position + normal * 0.03;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uSpeed;

        void main() {
          // 3个长条高光，每个占 1/3 的长度，但高光本身很长
          float loopLength = 1.0; // 循环长度
          float highlightLength = 0.4; // 每个高光的长度（40%）

          // 计算位置在循环中的相位
          float phase = fract(vUv.x * loopLength - uTime * uSpeed);

          // 3个高光位置：0.0, 0.333, 0.666
          float highlight1 = smoothstep(0.0, highlightLength, phase) * smoothstep(highlightLength * 2.0, highlightLength, phase);
          float highlight2 = smoothstep(0.333, 0.333 + highlightLength, phase) * smoothstep(0.333 + highlightLength * 2.0, 0.333 + highlightLength, phase);
          float highlight3 = smoothstep(0.666, 0.666 + highlightLength, phase) * smoothstep(0.666 + highlightLength * 2.0, 0.666 + highlightLength, phase);

          // 合并3个高光
          float highlight = max(max(highlight1, highlight2), highlight3);

          // 边缘淡出
          float edgeMask = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);

          gl_FragColor = vec4(uColor * 0.8, highlight * edgeMask);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.flowMesh = new THREE.Mesh(flowGeo, this.flowMaterial);
    // 将流光 Mesh 放到第 1 层，专门供 Bloom 渲染
    this.flowMesh.layers.set(1);
    this.pathMesh.add(this.flowMesh);
  }

  update() {
    if (this.flowMaterial) {
      this.flowMaterial.uniforms.uTime.value += 0.016;
    }
  }

  dispose() {
    if (this.flowMesh) {
      this.flowMaterial.dispose();
      this.pathMesh.remove(this.flowMesh);
    }
    if (this.baseGlowMesh) {
      this.baseGlowMaterial.dispose();
      this.pathMesh.remove(this.baseGlowMesh);
    }
  }
}
