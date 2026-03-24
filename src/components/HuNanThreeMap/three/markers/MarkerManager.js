import Marker from './Marker';
import * as THREE from 'three';

export class MarkerManager {
  constructor(scene, labelRenderer) {
    this.scene = scene;
    this.labelRenderer = labelRenderer;
    this.markers = [];
    this.textureMap = {
      '信号塔': null,
      '无人机': null,
      '卫星': null
    };
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
          name: data.name
        },
        this.textureMap[data.type]
      );
      this.markers.push(marker);
      this.scene.add(marker.getObject());
    });
  }

  clear() {
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

  update() {
    
  }
}