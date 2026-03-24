import * as THREE from 'three';

export const groundOverlayMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uStartTime: { value: -999.0 },
    uCenter: { value: new THREE.Vector3(0, 0, 0) },
    uColor: { value: new THREE.Color(0x00ffff) },
    uMaxRadius: { value: 1200.0 },
    uDuration: { value: 2.0 }
  },
  vertexShader: `
    varying vec3 vLocalPosition; // 使用局部坐标
    void main() {
      vLocalPosition = position; // 直接取模型局部坐标
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
        varying vec3 vLocalPosition;

        // 核心：画单个粗圈的函数
        float drawRing(float dist, float progress, float maxRad) {
            if (progress < 0.0 || progress > 1.0) return 0.0;
            
            // 非线性扩散，更有冲击力
            float easeProg = 1.0 - pow(1.0 - progress, 2.0);
            float currentRadius = easeProg * maxRad;
            
            // 环的粗细控制 (0.15 表示半径的 15% 粗)
            float thickness = maxRad * 0.15; 
            
            // 使用 smoothstep 画出粗壮的环
            return smoothstep(currentRadius - thickness, currentRadius, dist) * (1.0 - smoothstep(currentRadius, currentRadius + 0.05, dist));
        }

        void main() {
            float elapsed = uTime - uStartTime;
            if (elapsed < 0.0 || elapsed > uDuration + 0.5) discard;

            float dist = distance(vLocalPosition, uCenter);
            
            // --- 第一个圈 ---
            float progress1 = elapsed / uDuration;
            float ring1 = drawRing(dist, progress1, uMaxRadius);
            
            // --- 第二个圈 (延迟触发) ---
            // 当第一个圈走到 0.7 (70%) 时，第二个圈开始
            float delay = 0.3; // 延迟系数
            float progress2 = (elapsed - delay) / uDuration;
            float ring2 = drawRing(dist, progress2, uMaxRadius * 0.8); // 第二个圈稍微小一点点，更有层次
            
            // 合并两个圈
            float finalMask = max(ring1, ring2);
            
            // 整体随时间淡出
            float globalAlpha = 1.0 - (elapsed / (uDuration + delay));
            
            gl_FragColor = vec4(uColor, finalMask * globalAlpha * 2.0);
        }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});