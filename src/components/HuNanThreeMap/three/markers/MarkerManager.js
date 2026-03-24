import Marker from './Marker';
import * as THREE from 'three';

export class MarkerManager {
  constructor(scene, labelRenderer) {
    this.scene = scene;
    this.labelRenderer = labelRenderer;
    this.markers = [];
  }

  /**
   * 设置所有标注点
   * @param {Array} markersData - [{ position: {x,y,z}, html: string }]
   */
  setMarkers(markersData) {
    // 清除旧标注
    this.clear();

    markersData.forEach(data => {
      const marker = new Marker(
        new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        data.html
      );
      this.markers.push(marker);
      this.scene.add(marker);
    });
  }

  clear() {
    this.markers.forEach(marker => {
      marker.dispose();
      this.scene.remove(marker);
    });
    this.markers = [];
  }

  update() {
    
  }
}