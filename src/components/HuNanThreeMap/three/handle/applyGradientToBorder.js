import * as THREE from 'three'
import { createGradientMaterial } from '../effects';

/**
 * 获取指定模型，绑定渐变材质
 * @param {Array} models
 */
export function applyGradientToBorder(models){
  if(models.length === 0) return
  const borderMeshes = models.find(mesh => mesh.name === 'border')

  const geometry = borderMeshes.geometry

  const tempVec = new THREE.Vector3()
  const position = geometry.attributes.position
  const count = position.count

  let minY = Infinity, maxY = -Infinity
  for (let i = 0; i < count; i++) {
    tempVec.fromBufferAttribute(position, i)
    borderMeshes.localToWorld(tempVec)
    minY = Math.min(minY, tempVec.y)
    maxY = Math.max(maxY, tempVec.y)
  }

  if (minY === Infinity || maxY === -Infinity) {
    console.warn('无法计算 Y 范围，渐变特效未应用')
    return
  }
  
  console.log(minY, maxY)
  const material = createGradientMaterial(minY, maxY)
  if (borderMeshes.material) {
    if (Array.isArray(borderMeshes.material)) {
      borderMeshes.material.forEach(m => m.dispose())
    } else {
      borderMeshes.material.dispose()
    }
  }
  borderMeshes.material = material
}