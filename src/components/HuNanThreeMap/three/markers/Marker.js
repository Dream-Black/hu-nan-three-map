import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const TextureScaleConfig = {
  '信号塔': [0.36, 1.8, 1],
  '无人机': [1.2, 0.7, 1],
  '卫星': [2, 0.8, 1]
}

/**
 * 单个标注点
 * @param {THREE.Vector3} position - 世界坐标
 * @param {string} htmlContent - HTML字符串
 * @param {Object} options - 可选配置
 * @param {THREE.Texture} texture - 贴图
 */
export default class Marker {
  constructor(position, htmlContent, options = {}, texture) {
    this.position = position.clone();
    this.htmlContent = htmlContent;
    this.options = Object.assign({
      type: '信号塔',
      height: 5,
      labelOffsetY: 0,
      name: '',
      enableRipple: false
    }, options);
    this.texture = texture;
    this.label = null;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.createSprite();
    this.createLabel();
  }

  getObject(){
    return this.group;
  }

  createSprite() {
    const spriteMat = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);

    sprite.scale.set(...TextureScaleConfig[this.options.type]);
    sprite.center.set(0.5, 0);
    sprite.name = this.options.name

    this.group.add(sprite);
  }

  createLabel() {
    if(!this.htmlContent) return

    const {labelOffsetY, type} = this.options

    // 创建HTML容器
    const div = document.createElement('div');
    div.innerHTML = this.htmlContent;
    div.style.color = 'white';
    div.style.background = 'rgba(0,0,0,0.7)';
    div.style.padding = '4px 8px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '14px';
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.style.whiteSpace = 'nowrap';

    this.label = new CSS2DObject(div);
    this.label.position.set(0, TextureScaleConfig[type][1] / 2 + labelOffsetY, 0);
    this.group.add(this.label);
  }

  dispose() {
    // 清理 CSS2D 对象
    if (this.label) {
      this.group.remove(this.label);
      if (this.label.dispose) {
        this.label.dispose();
      }
    }
    
    // 清空 group
    while(this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}