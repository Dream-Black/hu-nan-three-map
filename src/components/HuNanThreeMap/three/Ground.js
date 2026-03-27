import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/**
 * 带模糊效果的反射地面
 * @param {*} options
 * @returns
 */
export function createGround(options = {}){
  const {
    radius = 10,
    color = 0x8899aa,
    textureWidth = 1024,
    textureHeight = 1024,
    clipBias = 0.003, // 偏移量
    multisample = 4, // 采样次数
    mixBlur = 10,    // 模糊程度
    mixStrength = 0.2, // 反射强度
  } = options;

  const geometry = new THREE.CircleGeometry(radius, 128);

  const reflector = new Reflector(geometry, {
    color: color,
    textureWidth: textureWidth,
    textureHeight: textureHeight,
    clipBias: clipBias,
    multisample: multisample,
    mixBlur: mixBlur,
    mixStrength: mixStrength,
  });

  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0;

  return reflector;
}

/**
 * 普通地面，用于接收阴影
 */
export function createShadowGround(options = {}){
  const {
    radius = 10,
    color = 0x111122,
    opacity = 0.5,
    transparent = true,
  } = options;

  const geometry = new THREE.CircleGeometry(radius, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    transparent: transparent,
    opacity: opacity,
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true; // 接收阴影
  return ground;
}

/**
 * 透明反射地面 - 使用自定义 Shader 实现透明 + 反射效果
 * 不会遮挡背景，同时有轻微的反射和阴影
 */
export function createTransparentReflectiveGround(options = {}) {
  const {
    radius = 15,
    reflectivity = 0.15,  // 反射强度
    shadowIntensity = 0.3, // 阴影强度
    fresnelPower = 2.0,    // 菲涅尔效果强度
  } = options;

  const geometry = new THREE.CircleGeometry(radius, 64);

  // 自定义 Shader 材质
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReflectivity: { value: reflectivity },
      uShadowIntensity: { value: shadowIntensity },
      uFresnelPower: { value: fresnelPower },
      uCameraPosition: { value: new THREE.Vector3() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uReflectivity;
      uniform float uShadowIntensity;
      uniform float uFresnelPower;
      uniform vec3 uCameraPosition;

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      // 简单的噪声函数
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        // 计算到中心的距离
        float distFromCenter = length(vWorldPosition.xz);
        float radius = 15.0;

        // 边缘渐变 - 让地面边缘柔和消失
        float edgeFade = 1.0 - smoothstep(radius * 0.7, radius, distFromCenter);

        // 菲涅尔效果 - 视角越平行地面，反射越强
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), uFresnelPower);

        // 模拟反射效果（使用噪声模拟环境反射）
        vec2 reflectUv = vWorldPosition.xz * 0.1 + uTime * 0.02;
        float reflectNoise = noise(reflectUv) * 0.5 + noise(reflectUv * 2.0) * 0.25;
        float reflection = reflectNoise * fresnel * uReflectivity;

        // 模拟阴影接收（在物体下方产生暗部）
        // 这里使用简单的渐变来模拟环境遮挡
        float ambientOcclusion = 1.0 - (1.0 - fresnel) * uShadowIntensity * 0.3;

        // 基础颜色 - 完全透明，只有反射和阴影
        vec3 baseColor = vec3(0.8, 0.9, 1.0); // 淡蓝色反射
        vec3 finalColor = baseColor * reflection * ambientOcclusion;

        // 最终透明度：反射越强越不透明，但总体保持透明
        float alpha = reflection * edgeFade;

        // 只在有反射或阴影的地方显示
        if (alpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, alpha * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,  // 不写入深度缓冲，不影响背景
    blending: THREE.AdditiveBlending,  // 叠加混合，不会遮挡背景
    side: THREE.DoubleSide,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01; // 稍微抬高避免 z-fighting
  ground.receiveShadow = true;

  // 添加更新方法
  ground.update = function(time, camera) {
    material.uniforms.uTime.value = time;
    material.uniforms.uCameraPosition.value.copy(camera.position);
  };

  return ground;
}

/**
 * 简单的透明阴影接收地面
 * 完全透明，只显示阴影
 */
export function createShadowOnlyGround(options = {}) {
  const {
    radius = 20,
    shadowOpacity = 0.3,
  } = options;

  const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);

  const material = new THREE.ShadowMaterial({
    opacity: shadowOpacity,
    color: 0x000000,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;

  return ground;
}
