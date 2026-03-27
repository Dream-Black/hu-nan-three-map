import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import * as Handle from './handle';
import { createGround, createShadowGround } from './Ground';
import { GlowPath, groundOverlayMaterial, RippleManager } from './effects';
import { MarkerManager } from './markers/MarkerManager';
import { CityManager } from './city';
import { ClickManager } from './event/click';


export default class ThreeManager {
  constructor(container, modelLoader, vue) {
    this.container = container;
    this.modelLoader = modelLoader;
    this.vue = vue;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.models = [];
    this.ground = null;
    this.shadowGround = null;
    this.pathMesh = null;
    this.glowPath = null;
    this.cityManager = null;
    this.clickManager = null;
    this.overlay = {};
    this.rippleManager = null;
    
    // 分层渲染所需变量
    this.composer = null;
    this.bloomComposer = null;
  }

  async init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initControls();
    this.initClickManager();
    await this.initMarkerManager();
    await this.initCity();
    this.animate();
  }

  initClickManager() {
    this.clickManager = new ClickManager(
      this.camera, 
      this.controls, 
      this.container, 
      this.outlinePass,
      this.vue,
      this.overlay
    );
  }

  /**
   * 设置需要交互的模型
   */
  setClickObjects(){
    const citys = this.cityManager.cities.map(item => {
      return item.mesh
    })
    const markers = this.markerManager.markers.map(item => {
      return item.getObject();
    });
    this.clickManager.setObjects([
      ...citys,
      ...markers
    ])
  }

  async initCity() {
    this.cityManager = new CityManager(this.scene);
    await this.cityManager.init();
    this.setClickObjects()
  }

  initGlowPath() {
    if (!this.pathMesh) return;
    this.glowPath = new GlowPath(this.scene, this.pathMesh);
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
    this.camera.position.set(0, 3.5, 12);
    this.camera.lookAt(0, 0, 0);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.target.set(0, 0, 0);

    this.controls.enableZoom = false; // 禁止缩放
    this.controls.enablePan = false; // 禁止平移
    this.controls.enableRotate = false; // 禁止旋转
  }

  initRenderer() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);
    
    // --- 1. 常规合成器 (渲染 Layer 0 + 1) ---
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.outlinePass = new OutlinePass(new THREE.Vector2(width, height), this.scene, this.camera);
    this.outlinePass.edgeStrength = 5.0; 
    this.outlinePass.edgeThickness = 2.0;
    this.outlinePass.visibleEdgeColor.set('#ffffff');
    this.composer.addPass(this.outlinePass);
    this.composer.addPass(new OutputPass());

    // --- 2. 辉光合成器 (只渲染 Layer 1) ---
    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.renderToScreen = false; // 结果存在内存里供后续混合
    this.bloomComposer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.1);
    this.bloomComposer.addPass(bloomPass);
  }

  setMarkers(markersData) {
    this.markerManager.setMarkers(markersData);
    this.setClickObjects()
  }

  async initMarkerManager() {
    this.rippleManager = new RippleManager(groundOverlayMaterial);
    this.markerManager = new MarkerManager(this.scene, this.labelRenderer, this.rippleManager);
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

        if (mesh.name === 'hunan') {
          this.hunanGroundMesh = mesh;
          this.initEffectOverlay()
        }
      });
      model.rotateY(-Math.PI / 2);

      this.initHandle();
      this.initGlowPath();
      return model;
    });
  }

  initEffectOverlay(){
    if (!this.hunanGroundMesh) return;
   const overlayGeo = this.hunanGroundMesh.geometry;

    this.overlay = new THREE.Mesh(overlayGeo, groundOverlayMaterial);

    this.hunanGroundMesh.add(this.overlay);

    this.overlay.position.set(0, 0, 0);
    this.overlay.rotation.set(0, 0, 0);
    this.overlay.scale.set(1, 1, 1);
    this.overlay.position.y += 0.02; 
    this.overlay.matrixAutoUpdate = true;

    if (this.clickManager) {
      this.clickManager.overlay = this.overlay;
    }

    if (this.rippleManager) {
      this.rippleManager.setOverlay(this.overlay);
    }
  }

  animate(time) {
    requestAnimationFrame(time => this.animate(time));
    const seconds = time / 1000;
  
    if (this.clickManager) this.clickManager.update(seconds);
    if (this.controls) this.controls.update();
    if (this.glowPath) this.glowPath.update();
    if (this.markerManager) this.markerManager.update();
    if (groundOverlayMaterial.uniforms?.uTime) {
      groundOverlayMaterial.uniforms.uTime.value = seconds;
    }
  
    // --- 修正后的分层渲染流程 ---
    
    // 1. 先渲染辉光效果到 bloomComposer 的缓存中
    // 这一步只会提取 Layer 1 的物体进行模糊处理
    this.renderer.autoClear = true; 
    this.camera.layers.set(1); 
    this.bloomComposer.render();
  
    // 2. 渲染主场景
    this.renderer.autoClear = false; // 关键：不要清除刚才 bloomComposer 产生的内容（如果要在同一画布叠加）
    this.renderer.clearDepth();     // 但要清除深度，防止遮挡
    
    this.camera.layers.set(0);      // 恢复相机看到层级 0
    this.camera.layers.enable(1);   // 同时也看到层级 1 (保证物体本身可见)
    this.composer.render();         // 渲染最终合成器
  
    if (this.labelRenderer) this.labelRenderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.composer) this.composer.setSize(width, height);
    if (this.bloomComposer) this.bloomComposer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    if(this.overlay){
      this.overlay.geometry.dispose()
      this.overlay.material.dispose()
    }

    if (this.clickManager) {
      this.clickManager.dispose();
      this.clickManager = null;
    }

    if (this.rippleManager) {
      this.rippleManager.dispose();
      this.rippleManager = null;
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
