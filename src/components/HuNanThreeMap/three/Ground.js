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