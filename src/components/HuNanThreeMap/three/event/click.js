import * as THREE from 'three';
import { Group, Tween, Easing } from '@tweenjs/tween.js';

export class ClickManager {
  constructor(camera, controls, container, outlinePass, vue, overlay) {
    this.camera = camera;
    this.controls = controls;
    this.container = container;
    this.outlinePass = outlinePass;
    this.vue = vue;
    this.overlay = overlay;

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

      if (this.hoveredObject === target) return;

      this.resetCurrentHover();

      this.hoveredObject = target;
      this.container.style.cursor = 'pointer';

      if (target.isSprite) {
        // Sprite 缩放和亮度
        this.handleSpriteHover(target, true);
        this.vue.$emit('moveInto', { type: 'marker', name: target.name });
      } else {
        // Mesh 轮廓线
        if (this.outlinePass) this.outlinePass.selectedObjects = [target];
        this.vue.$emit('moveInto', { type: 'city', name: target.name });
      }
      
    } else {
      if (this.hoveredObject) {
        this.resetCurrentHover();
      }
    }
  }

  /**
   * 处理 Sprite 的缩放和亮度
   */
  handleSpriteHover(sprite, isIn) {
    if (!this.spriteOriginalScales.has(sprite.uuid)) {
      this.spriteOriginalScales.set(sprite.uuid, sprite.scale.clone());
    }

    const originalScale = this.spriteOriginalScales.get(sprite.uuid);

    this.tweenGroup.removeAll(); 

    const ratio = isIn ? 1.05 : 1.0;
    const targetScale = {
      x: originalScale.x * ratio,
      y: originalScale.y * ratio,
      z: originalScale.z
    };

    const targetIntensity = isIn ? 1.5 : 1.0;

    new Tween(sprite.scale, this.tweenGroup)
      .to(targetScale, 500)
      .easing(Easing.Back.Out)
      .start();

    if (sprite.material.color) {
      new Tween(sprite.material.color, this.tweenGroup)
        .to({ r: targetIntensity, g: targetIntensity, b: targetIntensity }, 500)
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
      const clickedObject = intersects[0].object;
      if (clickedObject.isSprite) {
        this.triggerRippleEffect(clickedObject);
      } else {
        this.focusOnObject(clickedObject);
      }
    }
  }

  /**
   * 触发扩散波特效
   * @param {*} sprite 
   */
  triggerRippleEffect(sprite) {
    const worldPos = new THREE.Vector3();
    sprite.getWorldPosition(worldPos);
    console.log(this.overlay)
    if (this.overlay) {
        const localPos = worldPos.clone();
        this.overlay.worldToLocal(localPos);

        const mat = this.overlay.material;
        
        // --- 核心调试打印 ---
        console.log('--- 触发特效 ---');
        console.log('点击局部坐标 (uCenter):', localPos);
        console.log('当前时间 (uTime):', mat.uniforms.uTime.value);
        
        mat.uniforms.uCenter.value.copy(localPos);
        mat.uniforms.uStartTime.value = mat.uniforms.uTime.value;
        
        console.log('设置起始时间 (uStartTime):', mat.uniforms.uStartTime.value);
    }
}

  /**
   * 普通模型点击：移动视角
   * @param {*} object 
   */
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
      y: targetPos.y + 0,
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

  update(time) {
    this.tweenGroup.update();
    if (this.overlay && this.overlay.material && this.overlay.material.uniforms) {
      this.overlay.material.uniforms.uTime.value = time;
    }
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