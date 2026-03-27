import * as THREE from 'three';

const MAX_RIPPLES = 10;

export const groundOverlayMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uStartTime: { value: -999.0 },
    uCenter: { value: new THREE.Vector3(0, 0, 0) },
    uColor: { value: new THREE.Color(0x00ffff) },
    uMaxRadius: { value: 1200.0 },
    uDuration: { value: 2.0 },
    uRippleCenters: { value: new Array(MAX_RIPPLES).fill(null).map(() => new THREE.Vector3(0, 0, 0)) },
    uRippleStartTimes: { value: new Array(MAX_RIPPLES).fill(-999.0) },
    uRippleCount: { value: 0 },
    uEdgeColor: { value: new THREE.Color(0x4488ff) },
    uEdgeIntensity: { value: 0.1 },
    uEdgeWidth: { value: 0.05 }
  },
  vertexShader: `
    varying vec3 vLocalPosition;
    void main() {
      vLocalPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uStartTime;
    uniform vec3 uCenter;
    uniform vec3 uColor;
    uniform float uMaxRadius;
    uniform float uDuration;
    uniform vec3 uRippleCenters[10];
    uniform float uRippleStartTimes[10];
    uniform int uRippleCount;
    uniform vec3 uEdgeColor;
    uniform float uEdgeIntensity;
    uniform float uEdgeWidth;
    varying vec3 vLocalPosition;

    float drawRing(float dist, float progress, float maxRad) {
      if (progress < 0.0 || progress > 1.0) return 0.0;
      
      float easeProg = 1.0 - pow(1.0 - progress, 2.0);
      float currentRadius = easeProg * maxRad;
      float thickness = maxRad * 0.15; 
      
      return smoothstep(currentRadius - thickness, currentRadius, dist) * (1.0 - smoothstep(currentRadius, currentRadius + 0.05, dist));
    }

    float calculateRipple(vec3 center, float startTime, float time) {
      float elapsed = time - startTime;
      if (elapsed < 0.0 || elapsed > uDuration + 0.5) return 0.0;

      float dist = distance(vLocalPosition, center);
      
      float progress1 = elapsed / uDuration;
      float ring1 = drawRing(dist, progress1, uMaxRadius);
      
      float delay = 0.3;
      float progress2 = (elapsed - delay) / uDuration;
      float ring2 = drawRing(dist, progress2, uMaxRadius * 0.8);
      
      float finalMask = max(ring1, ring2);
      float globalAlpha = 1.0 - (elapsed / (uDuration + delay));
      
      return finalMask * globalAlpha * 2.0;
    }

    void main() {
      float totalAlpha = 0.0;

      float clickRipple = calculateRipple(uCenter, uStartTime, uTime);
      totalAlpha += clickRipple;

      for (int i = 0; i < 10; i++) {
        if (i >= uRippleCount) break;
        float rippleAlpha = calculateRipple(uRippleCenters[i], uRippleStartTimes[i], uTime);
        totalAlpha += rippleAlpha;
      }

      // 边缘渐变效果 - 计算到边界的距离
      // 假设模型在 x-z 平面上，计算到中心的距离来模拟边缘
      float distFromCenter = length(vLocalPosition.xz);
      float maxDist = 30.0; // 增大模型范围
      float edgeDist = maxDist - distFromCenter;

      // 边缘渐变：只在靠近边缘的区域显示
      // 当 edgeDist < maxDist * uEdgeWidth 时才显示边缘效果
      float edgeThreshold = maxDist * uEdgeWidth;
      float edgeGradient = smoothstep(0.0, edgeThreshold, edgeDist);

      // 只在边缘区域应用效果
      float edgeFactor = 1.0 - edgeGradient; // 边缘为1，内部为0
      float edgeAlpha = edgeFactor * uEdgeIntensity;

      // 混合颜色：边缘显示 uEdgeColor，内部显示 uColor
      vec3 finalColor = mix(uEdgeColor, uColor, edgeGradient);
      totalAlpha = max(totalAlpha, edgeAlpha);

      if (totalAlpha <= 0.0) discard;

      gl_FragColor = vec4(finalColor, totalAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});

export class RippleManager {
  constructor(material, overlay = null) {
    this.material = material;
    this.overlay = overlay;
    this.ripples = [];
  }

  setOverlay(overlay) {
    this.overlay = overlay;
  }

  addRipple(worldPosition, loop = false) {
    let position = worldPosition.clone();
    if (this.overlay) {
      position = worldPosition.clone();
      this.overlay.worldToLocal(position);
    }
    
    const ripple = {
      position: position,
      startTime: this.material.uniforms.uTime.value,
      loop: loop
    };
    this.ripples.push(ripple);
    this.updateUniforms();
    return ripple;
  }

  removeRipple(ripple) {
    const index = this.ripples.indexOf(ripple);
    if (index > -1) {
      this.ripples.splice(index, 1);
      this.updateUniforms();
    }
  }

  update() {
    const currentTime = this.material.uniforms.uTime.value;
    const duration = this.material.uniforms.uDuration.value;
    
    this.ripples.forEach(ripple => {
      const elapsed = currentTime - ripple.startTime;
      if (ripple.loop && elapsed > duration + 0.5) {
        ripple.startTime = currentTime;
      }
    });
    
    this.updateUniforms();
  }

  updateUniforms() {
    const centers = this.material.uniforms.uRippleCenters.value;
    const startTimes = this.material.uniforms.uRippleStartTimes.value;
    
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (i < this.ripples.length) {
        centers[i].copy(this.ripples[i].position);
        startTimes[i] = this.ripples[i].startTime;
      } else {
        startTimes[i] = -999.0;
      }
    }
    
    this.material.uniforms.uRippleCount.value = this.ripples.length;
  }

  clear() {
    this.ripples = [];
    this.updateUniforms();
  }

  dispose() {
    this.ripples = [];
  }
}
