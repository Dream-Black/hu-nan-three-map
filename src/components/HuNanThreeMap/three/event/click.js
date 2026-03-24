import * as THREE from 'three';
// 修改导入方式，直接引入需要的类
import { Group, Tween, Easing } from '@tweenjs/tween.js';

export class ClickManager {
  constructor(camera, controls, container, outlinePass) {
    this.camera = camera;
    this.controls = controls;
    this.container = container;
    this.outlinePass = outlinePass;

    this.tweenGroup = new Group();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.hoveredObject = null;

    this.initEvents();
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
      if (this.hoveredObject !== target) {
        this.hoveredObject = target;
        console.log('--- 鼠标移入:', target.name);
        if (this.outlinePass) this.outlinePass.selectedObjects = [target];
        this.container.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredObject) {
        this.hoveredObject = null;
        if (this.outlinePass) this.outlinePass.selectedObjects = [];
        this.container.style.cursor = 'default';
      }
    }
  }

  onPointerClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      this.focusOnObject(intersects[0].object);
    }
  }

  focusOnObject(object) {
    console.log('开始平滑移动视角至:', object.name);

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
        console.log('视角移动完成');
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