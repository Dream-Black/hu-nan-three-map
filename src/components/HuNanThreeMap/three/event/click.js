import * as THREE from 'three';
// 修改导入方式，直接引入需要的类
import { Group, Tween, Easing } from '@tweenjs/tween.js';

export class ClickManager {
  constructor(camera, controls, container, outlinePass, vue) {
    this.camera = camera;
    this.controls = controls;
    this.container = container;
    this.outlinePass = outlinePass;
    this.vue = vue;

    this.tweenGroup = new Group();

    this.initialCameraPos = camera.position.clone();
    this.initialTarget = controls.target.clone();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.hoveredObject = null;

    this.spriteOriginalScales = new Map();

    this.initEvents();
  }

  /**
   * 回到初始视角
   * @param {number} duration 动画持续时间，默认 1200ms
   */
  resetView(duration = 600) {    
    this.tweenGroup.removeAll();

    new Tween(this.camera.position, this.tweenGroup)
      .to({
        x: this.initialCameraPos.x,
        y: this.initialCameraPos.y,
        z: this.initialCameraPos.z
      }, duration)
      .easing(Easing.Cubic.InOut) // 使用更柔和的曲线
      .start();

    new Tween(this.controls.target, this.tweenGroup)
      .to({
        x: this.initialTarget.x,
        y: this.initialTarget.y,
        z: this.initialTarget.z
      }, duration)
      .easing(Easing.Cubic.InOut)
      .onUpdate(() => {
        this.controls.update();
      })
      .onComplete(() => {

      })
      .start();
    
    if (this.outlinePass) {
        this.outlinePass.selectedObjects = [];
    }
  }

  setObjects(objects) {
    this.interactiveObjects = objects;
  }

  initEvents() {
    this.container.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.container.addEventListener('click', (e) => this.onPointerClick(e));
  }

  onPointerMove(event) {
  const rect = this.container.getBoundingClientRect();
  this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  this.raycaster.setFromCamera(this.mouse, this.camera);
  const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

  if (intersects.length > 0) {
    const target = intersects[0].object;

    // 如果当前选中的物体没变，直接跳过，防止重复触发 Tween
    if (this.hoveredObject === target) return;

    // 1. 先重置之前的状态
    this.resetCurrentHover();

    // 2. 记录新状态
    this.hoveredObject = target;
    this.container.style.cursor = 'pointer';

    // --- 分类处理交互逻辑 ---
    if (target.isSprite) {
      // 方案：Sprite 呼吸缩放 + 亮度增强
      this.handleSpriteHover(target, true);
      this.vue.$emit('moveInto', { type: 'marker', name: target.name });
    } else {
      // 方案：Mesh 轮廓线
      if (this.outlinePass) this.outlinePass.selectedObjects = [target];
      this.vue.$emit('moveInto', { type: 'city', name: target.name });
    }
    
  } else {
    // 3. 移出空白区域
    if (this.hoveredObject) {
      this.resetCurrentHover();
    }
  }
}

/**
 * 专门处理 Sprite 的缩放和亮度
 */
handleSpriteHover(sprite, isIn) {
  // 1. 如果是第一次移入这个 Sprite，记录它的原始缩放
  if (!this.spriteOriginalScales.has(sprite.uuid)) {
    this.spriteOriginalScales.set(sprite.uuid, sprite.scale.clone());
  }

  const originalScale = this.spriteOriginalScales.get(sprite.uuid);
  
  // 2. 停止该物体上正在运行的动画，防止“抖动”
  this.tweenGroup.removeAll(); 

  // 3. 计算目标值：移入则在原始基础上乘以 1.3，移出则回到原始值
  const ratio = isIn ? 1.3 : 1.0;
  const targetScale = {
    x: originalScale.x * ratio,
    y: originalScale.y * ratio,
    z: originalScale.z
  };

  const targetIntensity = isIn ? 2.0 : 1.0;

  // 执行缩放动画
  new Tween(sprite.scale, this.tweenGroup)
    .to(targetScale, 300)
    .easing(Easing.Back.Out)
    .start();

  // 执行亮度动画
  if (sprite.material.color) {
    new Tween(sprite.material.color, this.tweenGroup)
      .to({ r: targetIntensity, g: targetIntensity, b: targetIntensity }, 300)
      .start();
  }
}

/**
 * 统一的重置逻辑
 */
resetCurrentHover() {
  if (!this.hoveredObject) return;

  if (this.hoveredObject.isSprite) {
    this.handleSpriteHover(this.hoveredObject, false);
    this.vue.$emit('moveOut', { type: 'marker', name: this.hoveredObject.name });
  } else {
    if (this.outlinePass) this.outlinePass.selectedObjects = [];
    this.vue.$emit('moveOut', { type: 'city', name: this.hoveredObject.name });
  }

  this.hoveredObject = null;
  this.container.style.cursor = 'default';
}

  onPointerClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      this.focusOnObject(intersects[0].object);
    }
  }

  focusOnObject(object) {
    this.vue.$emit('click', {
      type: 'city',
      name: object.name
    });

    const targetPos = new THREE.Vector3();
    object.getWorldPosition(targetPos);

    this.tweenGroup.removeAll();

    const endCameraPos = {
      x: targetPos.x,
      y: targetPos.y + 2,
      z: targetPos.z + 2
    };

    new Tween(this.camera.position, this.tweenGroup)
      .to(endCameraPos, 600)
      .easing(Easing.Quadratic.Out)
      .start();

    new Tween(this.controls.target, this.tweenGroup)
      .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 600)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.controls.update();
      })
      .onComplete(() => {

      })
      .start();
  }

  update() {
    this.tweenGroup.update();
  }

  dispose() {
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('click', this.onPointerClick);

    if (this.tweenGroup) {
      this.tweenGroup.removeAll();
      this.tweenGroup = null;
    }

    this.camera = null;
    this.controls = null;
    this.container = null;
    this.outlinePass = null;
    this.hoveredObject = null;
    this.interactiveObjects = [];
  }
}