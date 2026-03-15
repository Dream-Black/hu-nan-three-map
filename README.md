# hu-nan-three-map

## Project setup
```
pnpm install
```

### Compiles and hot-reloads for development
```
pnpm run serve
```

### Compiles and minifies for production
```
pnpm run build
```

### Lints and fixes files
```
pnpm run lint
```

node 版本 24.3.0

安装依赖
three 0.183.2

集成说明
HuNanThreeMap组件默认宽高为100%,建议使用时，用div包裹该组件。由外层div来决定组件的实际渲染大小。

复制到目标项目的文件如下
src\components\HuNanThreeMap 全部文件
public\threeModel 3D模型文件

组件支持参数说明：
或者可查看App.vue 的使用示例