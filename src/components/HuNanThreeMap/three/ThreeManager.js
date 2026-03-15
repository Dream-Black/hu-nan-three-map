import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as Handle from "./handle";

export default class ThreeManager {
  constructor(container, modelLoader) {
    this.container = container;
    this.modelLoader = modelLoader;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.models = [];

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initControls();
    this.animate();
  }

  initHandle() {
    Handle.applyGradientToBorder(this.models);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);
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
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambient);
  }

  loadModel(url, onProgress) {
    return this.modelLoader.load(url, onProgress).then((model) => {
      this.scene.add(model);
      model.children.forEach((mesh) => {
        this.models.push(mesh);
      });

      this.initHandle();
      return model;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.models.length === 0) return;

    this.models.forEach((model) => {
      if (model.isMesh) {
        model.geometry.dispose();
        model.material.dispose();
      } else {
        model.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
      }

      this.scene.remove(model);
    });
  }
}
