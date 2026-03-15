import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * 单个标注点：渐变长方体 + CSS2D文字标签
 * @param {THREE.Vector3} position - 世界坐标
 * @param {string} htmlContent - HTML字符串
 * @param {Object} options - 可选配置
 */
export default class Marker {
  constructor(position, htmlContent, options = {}) {
    this.position = position.clone();
    this.htmlContent = htmlContent;
    this.options = Object.assign({
      width: 0.2,
      height: 0.8,
      depth: 0.2,
      colorTop: 0xff3333,
      colorBottom: 0x330000,
      labelOffsetY: 0.5,
    }, options);

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.createBox();
    this.createLabel();

    return this.group;
  }

  getObject(){
    return this.group;
  }

  createBox() {
    const { width, height, depth, colorTop, colorBottom } = this.options;

    const geometry = new THREE.BoxGeometry(width, height, depth);

    // 基于顶点Y坐标的渐变材质（局部坐标）
    const material = new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color(colorTop) },
        colorBottom: { value: new THREE.Color(colorBottom) },
        yMin: { value: -height / 2 },
        yMax: { value: height / 2 },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = position.y; // 局部坐标Y
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        uniform float yMin;
        uniform float yMax;
        varying float vY;
        void main() {
          float t = (vY - yMin) / (yMax - yMin);
          t = clamp(t, 0.0, 1.0);
          vec3 finalColor = mix(colorBottom, colorTop, t);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const box = new THREE.Mesh(geometry, material);
    box.castShadow = true;
    box.receiveShadow = true;
    this.group.add(box);
  }

  createLabel() {
    // 创建HTML容器
    const div = document.createElement('div');
    div.innerHTML = this.htmlContent;
    div.style.color = 'white';
    div.style.background = 'rgba(0,0,0,0.7)';
    div.style.padding = '4px 8px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '14px';
    div.style.pointerEvents = 'none'; // 允许点击穿透到3D
    div.style.userSelect = 'none';
    div.style.whiteSpace = 'nowrap';

    const label = new CSS2DObject(div);
    label.position.set(0, this.options.height / 2 + this.options.labelOffsetY, 0);
    this.group.add(label);
  }
}