import * as THREE from 'three';

const hunanCities = [
  { text: '长沙', lng: 112.9389, lat: 28.2282 },
  { text: '株洲', lng: 113.1517, lat: 27.8277 },
  { text: '湘潭', lng: 112.9356, lat: 27.8298 },
  { text: '衡阳', lng: 112.6077, lat: 26.8945 },
  { text: '邵阳', lng: 111.4678, lat: 27.2389 },
  { text: '岳阳', lng: 113.1287, lat: 29.3573 },
  { text: '常德', lng: 111.6985, lat: 29.0316 },
  { text: '张家界', lng: 110.4792, lat: 29.1170 },
  { text: '益阳', lng: 112.3552, lat: 28.5538 },
  { text: '郴州', lng: 113.0117, lat: 25.7936 },
  { text: '永州', lng: 111.6080, lat: 26.4233 },
  { text: '怀化', lng: 110.0010, lat: 27.5697 },
  { text: '娄底', lng: 112.0011, lat: 27.7009 },
  { text: '湘西州', lng: 109.7397, lat: 28.3143 }
];

/**
 * 将经纬度转换为场景坐标（X, Y, Z）
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @param {Object} options 配置项
 * @param {number} options.scaleX 经度缩放系数
 * @param {number} options.scaleZ 纬度缩放系数
 * @param {number} options.offsetX X轴偏移
 * @param {number} options.offsetZ Z轴偏移
 * @param {number} options.yBase Y轴基准高度
 */
function lngLatToPosition(lng, lat, options = {}) {
  const {
    scaleX = 0.01,
    scaleZ = 0.01,
    offsetX = 0,
    offsetZ = 0,
    yBase = 1
  } = options;

  const x = (lng - options.centerLng) * scaleX + offsetX;
  const z = (lat - options.centerLat) * scaleZ + offsetZ;
  return new THREE.Vector3(x, yBase, z);
}

const transformOptions = {
  centerLng: 112.0,   // 参考中心经度
  centerLat: 28.0,    // 参考中心纬度
  scaleX: 2.5,        // 经度缩放系数
  scaleZ: -2.5,       // 纬度缩放系数
  offsetX: 0.45,      // X轴偏移
  offsetZ: -1.4,      // Z轴偏移
  yBase: 1            // Y轴固定高度
};

export const citiesConfig = hunanCities.map(city => ({
  text: city.text,
  position: lngLatToPosition(city.lng, city.lat, transformOptions)
}));