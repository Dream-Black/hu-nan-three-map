import * as THREE from 'three';

/**
 * 创建渐变材质
 * @param {number} yMin - 模型的最小 y 值
 * @param {number} yMax - 模型的最大 y 值
 * @returns {THREE.ShaderMaterial}
 */
export function createGradientMaterial(yMin, yMax){
  return new THREE.ShaderMaterial({
    uniforms: {
      yMin: { value: yMin },
      yMax: { value: yMax },
      colorTop: { value: new THREE.Color(0x093C7A) },
      colorMiddle: { value: new THREE.Color(0x062245) },
      colorBottom: { value: new THREE.Color(0x36A1F7) },
    },
    vertexShader: `
      varying float vY;
      void main() {
        vY = (modelMatrix * vec4(position, 1.0)).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float yMin;
      uniform float yMax;
      uniform vec3 colorBottom;
      uniform vec3 colorMiddle;
      uniform vec3 colorTop;
      varying float vY;

      void main() {
        float t = (vY - yMin) / (yMax - yMin);
        t = clamp(t, 0.0, 1.0);
        
        vec3 finalColor;
        if (t < 0.5) {
          float s = t * 2.0;
          finalColor = mix(colorBottom, colorMiddle, s);
        } else {
          float s = (t - 0.5) * 2.0;
          finalColor = mix(colorMiddle, colorTop, s);
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide 
  })
}