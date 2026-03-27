import Marker from './Marker';
import * as THREE from 'three';
import { SustainedTyndallBeam } from '../effects/TyndallBeam';

export class MarkerManager {
  constructor(scene, labelRenderer, rippleManager = null) {
    this.scene = scene;
    this.labelRenderer = labelRenderer;
    this.rippleManager = rippleManager;
    this.markers = [];
    this.markerRipples = new Map();
    this.markerBeams = new Map();
    this.textureMap = {
      '信号塔': null,
      '无人机': null,
      '卫星': null
    };
  }

  setRippleManager(rippleManager) {
    this.rippleManager = rippleManager;
  }

  /**
   * 加载精灵纹理
   */
  loadTextures() {
    const fns = [];
    ['信号塔', '无人机', '卫星'].forEach((item) => {
    const loader = new THREE.TextureLoader();
    const promise = new Promise((resolve, reject) => {
        loader.load( `./img/${item}.png`, texture => {
            this.textureMap[item] = texture;
            resolve(texture);
          },
          undefined,
          error => reject(error)
        );
      });
      fns.push(promise);
    });
    return Promise.all(fns)
  }

  /**
   * 设置所有标注点
   * @param {Array} markersData
   */
  setMarkers(markersData) {
    this.clear()
    markersData.forEach(data => {
      const marker = new Marker(
        new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        data.html,
        {
          type: data.type,
          name: data.name,
          enableRipple: data.enableRipple || false
        },
        this.textureMap[data.type]
      );
      this.markers.push(marker);
      this.scene.add(marker.getObject());

      if (data.enableRipple && this.rippleManager) {
        const ripple = this.rippleManager.addRipple(
          new THREE.Vector3(data.position.x, data.position.y, data.position.z),
          true
        );
        this.markerRipples.set(marker, ripple);

        // 为卫星和无人机添加丁达尔光束
        if (data.type === '卫星' || data.type === '无人机') {
          const beam = new SustainedTyndallBeam(
            this.scene,
            () => marker.getObject().position,
            {
              color: new THREE.Color(0x88ccff),
              intensity: 0.5,
              height: data.type === '卫星' ? 4.0 : 2.5,
              topRadius: 0.15,
              bottomRadius: data.type === '卫星' ? 1.2 : 0.8
            }
          );
          beam.start();
          this.markerBeams.set(marker, beam);
        }
      }
    });
  }

  clear() {
    this.markerRipples.forEach((ripple) => {
      if (this.rippleManager) {
        this.rippleManager.removeRipple(ripple);
      }
    });
    this.markerRipples.clear();

    this.markerBeams.forEach((beam) => {
      beam.dispose();
    });
    this.markerBeams.clear();

    this.markers.forEach(marker => {
      marker.dispose();
      const group = marker.getObject();
      this.scene.remove(group);
    });
    this.markers = [];
  }

  dispose() {
    this.clear();
    for(const key in this.textureMap){
      this.textureMap[key]?.dispose && this.textureMap[key].dispose();
    }
    this.textureMap = {
      '信号塔': null,
      '无人机': null,
      '卫星': null
    }
  }

  update(time) {
    if (this.rippleManager) {
      this.rippleManager.update();
    }

    this.markers.forEach(marker => {
      marker.update(time);
    });

    this.markerBeams.forEach((beam) => {
      beam.update(time);
    });
  }
}