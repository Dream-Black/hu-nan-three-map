import * as THREE from 'three';

export class GlowPath {
  constructor(scene, pathMesh) {
    this.scene = scene;
    this.pathMesh = pathMesh;
    this.flowMesh = null;
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
    this.flowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x8DC4F2) },
        uSpeed: { value: 0.8 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position + normal * 0.01; 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uSpeed;
        void main() {
          float flow = fract(vUv.x * 3.0 - uTime * uSpeed);
          float highlight = smoothstep(0.0, 0.1, flow) * smoothstep(0.7, 0.1, flow);
          float edgeMask = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);
          gl_FragColor = vec4(uColor * 3.0, highlight * edgeMask);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.flowMesh = new THREE.Mesh(flowGeo, this.flowMaterial);
    
    // 关键：将流光 Mesh 放到第 1 层，专门供 Bloom 渲染
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
  }
}