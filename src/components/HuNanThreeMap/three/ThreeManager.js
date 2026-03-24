import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Handle from './handle';
import { createGround, createShadowGround } from './Ground';
import { GlowPath } from './effects';
import { MarkerManager } from './markers/MarkerManager';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default class ThreeManager {
  constructor(container, modelLoader) {
    this.container = container;
    this.modelLoader = modelLoader;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.models = [];
    this.ground = null;
    this.shadowGround = null;
    this.pathMesh = null;
    this.glowPath = null;
  }

  async init(){
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initControls();
    // this.initGround();
    await this.initMarkerManager();
    this.animate();
  }

  initGlowPath() {
    if (!this.pathMesh) return;

    this.pathMesh.updateMatrixWorld(true);
    const points = [];
    const posAttr = this.pathMesh.geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const vec = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      vec.applyMatrix4(this.pathMesh.matrixWorld);
      points.push(vec);
    }

    const sortedPoints = [points.shift()];
    while (points.length > 0) {
      let lastPoint = sortedPoints[sortedPoints.length - 1];
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < points.length; i++) {
        let dist = lastPoint.distanceTo(points[i]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      sortedPoints.push(points.splice(closestIdx, 1)[0]);
    }

    this.glowPath = new GlowPath(this.scene, sortedPoints, this.pathMesh);
  }

  /**
   * 创建地面(反射、阴影)
   */
  initGround() {
    this.shadowGround = createShadowGround();
    this.scene.add(this.shadowGround);

    this.ground = createGround();
    this.ground.position.y = -0.01;
    this.scene.add(this.ground);
  }

  initHandle() {
    Handle.applyGradientToBorder(this.models);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.target.set(0, 0, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 启用阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.left = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none'; // 允许点击穿透到canvas
    this.container.appendChild(this.labelRenderer.domElement);
  }

  setMarkers(markersData) {
    this.markerManager.setMarkers(markersData);
  }

  async initMarkerManager() {
    this.markerManager = new MarkerManager(this.scene, this.labelRenderer);
    await this.markerManager.loadTextures();
  }

  initLights() {
    const mainLight = new THREE.DirectionalLight(0xffffff, 4);
    mainLight.position.set(0, 3, 2);

    mainLight.castShadow = true; // 投射阴影
    mainLight.receiveShadow = true; // 可选
    // 设置阴影范围
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    const d = 15;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.bias = -0.0001;
    this.scene.add(mainLight);

    this.scene.add(mainLight);
  }

  loadModel(url, onProgress) {
    return this.modelLoader.load(url, onProgress).then((model) => {
      this.scene.add(model);

      const shadowModelName = ['border'];
      model.children.forEach((mesh) => {
        this.models.push(mesh);

        if (shadowModelName.includes(mesh.name)) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }

        if (mesh.name === 'border-top') {
          this.pathMesh = mesh;
        }
      });

      this.initHandle();
      this.initGlowPath();
      return model;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) this.controls.update();
    if (this.glowPath) this.glowPath.update();

    if( this.renderer) this.renderer.render(this.scene, this.camera);
    if(this.labelRenderer) this.labelRenderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    if (this.markerManager) {
      this.markerManager.dispose();
      this.markerManager = null;
    }
    if (this.labelRenderer) {
      this.labelRenderer.domElement.remove();
      this.labelRenderer = null;
    }

    // 清理光带
    if (this.glowPath) {
      this.glowPath.dispose();
      this.glowPath = null;
    }

    // 清理地面
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      if (this.ground.material) {
        if (Array.isArray(this.ground.material)) {
          this.ground.material.forEach((m) => m.dispose());
        } else {
          this.ground.material.dispose();
        }
      }
      this.ground = null;
    }
    if (this.shadowGround) {
      this.scene.remove(this.shadowGround);
      this.shadowGround.geometry.dispose();
      this.shadowGround.material.dispose();
      this.shadowGround = null;
    }

    // 清理模型
    if (this.models.length === 0) return;
    this.models.forEach((model) => {
      if (model.material) {
        if (Array.isArray(model.material)) {
          model.material.forEach((m) => m.dispose());
        } else {
          model.material.dispose();
        }
      }
      if (model.geometry) model.geometry.dispose();
      this.scene.remove(model);
    });
  }
}
