import * as THREE from 'three';

export class GlowPath {
  constructor(scene, points, pathMesh) {
    this.scene = scene;
    this.points = points;
    this.pathMesh = pathMesh;

    this.flowMesh = null;
    this.curve = new THREE.CatmullRomCurve3(this.points, true);

    this.initPath();
    this.initFlow();
  }

  initPath() {
    this.pathMesh.material.dispose()
    const material = new THREE.LineBasicMaterial({ 
      color: 0x8DC4F2,
    });
    this.pathMesh.material = material;
  }

  initFlow() {
    const tubeGeo = new THREE.TubeGeometry(this.curve, 512, 0.05, 8, true);

    this.flowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x8DC4F2) },
        uFlowSpeed: { value: 0.25 },
        uFlowLength: { value: 0.1 },
      },
      vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uFlowLength;
        uniform float uFlowSpeed;

        void main() {
            float flow = mod(vUv.x - uTime * uFlowSpeed * 0.2, 1.0);
            
            float mask = smoothstep(uFlowLength, 0.0, distance(flow, 0.5));
            
            float glow = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0);
            
            float breathe = sin(uTime * 2.0) * 0.1 + 0.9;

            float finalAlpha = mask * glow * breathe;
            gl_FragColor = vec4(uColor, finalAlpha);
        }
     `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.flowMesh = new THREE.Mesh(tubeGeo, this.flowMaterial);

    this.scene.add(this.flowMesh);
  }

  update() {
    if (this.flowMaterial) {
      this.flowMaterial.uniforms.uTime.value += 0.016;
    }
  }

  reverseDirection() {
    this.flowMaterial.uniforms.uFlowSpeed.value *= -1;
  }

  dispose() {
    if (this.flowMesh) {
      this.scene.remove(this.flowMesh);
      this.flowMesh.geometry.dispose();
      this.flowMesh.material.dispose();
    }
  }
}
