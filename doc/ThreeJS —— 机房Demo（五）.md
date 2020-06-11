# ThreeJS —— 机房Demo（五）

上一节我们基本完成了我们Demo所需要的所有功能，离成功只差最后一步 —— **性能优化**！

# 目录结构
├── font	// 字体文件  
 &nbsp;|├──── font.ttf // 字体源文件  
 &nbsp;|└──── font.json // 转换后的字体文件  
├── img	// 素材图片  
&nbsp;|├──── xx.png  
&nbsp;|├──── xxx.jpg  
&nbsp;|└──── ...  
├── js // 自己编写的js文件   
&nbsp;|├────  common_fn.js // 公共部分  
&nbsp;|├──── composer_fn.js // 后期处理  
&nbsp;|├──── create_fn.js // 创建各种几何  
&nbsp;|├──── init_fn.js // 初始化项目  
&nbsp;|└──── util_fn.js // 工具函数  
├── lib // 需要引入的js文件  
&nbsp;|├──── three.js  
&nbsp;|├──── OrbitControls.js  
&nbsp;|├──── RenderPass.js  
&nbsp;|└──── ...  
├── model // 建模工具导出的模型  
&nbsp;|├──── computer.gltf  
&nbsp;|└──── ...  
└── index.html // 入口文件
# 性能优化
ThreeJS常用性能优化方法
## 提取公共部分
在构建Demo的过程，我们需要创建很多几何体 Geometry 和材质 Material，以及一些 Loader 等等，这些资源都是可以单独提取成公共部分的

```js
// 创建一个common_fn.js，放在js目录下
// common_fn.js

// MeshBasicMaterial 这个材质经常使用，并且该黑色材质被多次使用
const blackBasicMaterial = window.blackBasicMaterial = new THREE.MeshBasicMaterial({ color: "black" });

// TextureLoader 也是一个常用的 Loader，先创建一个实例出来供后面共用（这里也是参考了享元模式）
const textureLoader = window.textureLoader = new THREE.TextureLoader();

// 后续代码中如要使用，直接用变量名即可，因为放入了全局变量
```
## 利用 clone 方法复用
Demo中有很多几何体都是同一种类型，只是他们的位置不一样，所以我们可以通过 Mesh 的 clone 方法实现复用的目的，复用后修改位置即可
```js
// 在 create_fn.js 中构建一个 createClone 方法
// create_fn.js
function createClone(mesh, conf) {
  const newMesh = mesh.clone();
  initConfig(newMesh, conf);
  return newMesh;
}
```
在入口文件 index.html 中使用
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="canvas-frame"></div>
    
    <script>...</script>
    <script>
      // ...
      (async function () {
        // scene场景的公共内容，用于后面 createClone 公用
        const earth = createEarth({ position: { x: -15, y: -1 } });
        const machine = createMachine("./img/move.png", {
          position: { x: 15, z: -20, y: -5 },
        });

        // scene场景的第一组内容
        let group1, group1Animate;
        {
          const earth2 = createClone(earth, { position: { x: 15, y: -1 } });
          const machine2 = createClone(machine, {
            position: { x: -15 },
          });
          // ...
        }

        // scene场景的第二组内容
        {
          const earth1 = createClone(earth, {
            position: { x: 0, z: -10, y: -1.1 },
          });
          const machine1 = createClone(machine, {
            position: { x: 0, y: -5, z: 10 },
          });
          // ...
        }

        // ...
      })();
    </script>
  </body>
</html>
```
## 减少 animate 内容
之前我们的 animate 方法中有如下内容：
```js
// index.html
function animate() {
  // 管道运动，路线循环流动效果
  group1Animate();
  group2Animate();
  commonAnimate();
  normalSceneAnimate();

  // fps监控
  stats.update();

  // 实现局部辉光
  scene.traverse(darkenNonBloomed);
  bloomComposer.render();
  scene.traverse(restoreMaterial);
  finalComposer.render();

  requestAnimationFrame(animate);
}
```
这里我们发现，实现局部辉光的过程，如果我们不转动控制器，就不需要每次 requestAnimationFrame 的时候都调用 bloomComposer.render()，所以对入口文件 index.html 优化如下
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="canvas-frame"></div>
    
    <script>...</script>
    <script>
      // ...

      // 产生局部辉光的前三步，初始状态必须先调用 bloomComposer.render()
      scene.traverse(darkenNonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);

      controls.addEventListener("change", function () {
        // 产生局部辉光的前三步，操作控制器的时候重新调用 bloomComposer.render() 更新辉光
        scene.traverse(darkenNonBloomed);
        bloomComposer.render();
        scene.traverse(restoreMaterial);
      });

      function animate() {
          // 管道运动，路线循环流动效果
          group1Animate();
          group2Animate();
          commonAnimate();
          normalSceneAnimate();

          // fps监控
          stats.update();

          // 实现局部辉光
          finalComposer.render(); // 因为有动画的存在，每帧依然要执行渲染函数 render，这里不能省

          requestAnimationFrame(animate);
        }
    </script>
  </body>
</html>
```
除此之外，在每帧动画中，我们也应该减少更新，这里的更新指的是当前的几何体、材质、纹理等发生了修改，需要Three.js重新更新显存的数据，具体包括：
- 几何体：
```js
geometry.verticesNeedUpdate = true; //顶点发生了修改
geometry.elementsNeedUpdate = true; //面发生了修改
geometry.morphTargetsNeedUpdate = true; //变形目标发生了修改
geometry.uvsNeedUpdate = true; //uv映射发生了修改
geometry.normalsNeedUpdate = true; //法向发生了修改
geometry.colorsNeedUpdate = true; //顶点颜色发生的修改
```
- 材质
```js
material.needsUpdate = true
```
- 纹理
```js
texture.needsUpdate = true;
```
如果它们发生更新，则将其设置为true，Three.js会通过判断，将数据重新传输到显存当中，并将配置项重新修改为false。此外，我们可以利用函数的节流防抖，对 animate 函数进行优化
## 引入模型优化
通常项目中，需要引入第三方软件建模后的模型，例如这个Demo中也引入了电脑的模型，模型文件通常很大，如何压缩模型文件，加快引入时间也是优化的重要一环
1. 利用 [obj2gltf](https://github.com/CesiumGS/obj2gltf) 插件把 obj 格式的模型转成 gltf 格式，用法如下：
    ```
    obj2gltf  -i ./xxx.obj -o ./xxx.gltf --unlit --separate
    
    --unlit 表示保留环境贴图的效果
    --separate 表示将贴图文件提取出来，浏览器可以缓存，如果你需要继续压缩gltf文件，这里可以不加，因为后续压缩的时候也能提出来
    ```
2. 利用 [gltf-pipeline](https://github.com/CesiumGS/obj2gltf) 插件把 gltf 格式的模型进行压缩，用法如下：
    ```
    gltf-pipeline -i  ./xxx.gltf  -o  ./xxx.gltf -d --separate
    
    -d是--draco.compressMeshes的缩写，使用draco算法压缩模型
    --separate就是将贴图文件提取出来，不提可以不加
    ```
## 引入字体优化
之前我们创建3D文字的时候，是利用官方推荐的 facetype.js 将 ttf 格式的字体转成 json 格式后引入的，不过实际运用时发现，转成 json文件后，文件大了很多倍，导致加载时间非常长
![json格式](https://user-gold-cdn.xitu.io/2020/6/11/172a1697410bce13?w=522&h=26&f=png&s=2902)
在尝试了压缩 json 文件，修改转换配置等方法无果后，我在 example 中看到了一种新的引入字体的方式，即利用 TTFLoader 直接加载 ttf 文件

首先在 index.html 引入所需文件
```html
<script src="lib/opentype.min.js"></script>
<script src="lib/TTFLoader.js"></script>
```
加载字体
```js
new THREE.TTFLoader().load("../font/simhei.ttf", function (data) {
  const font = new THREE.Font(data);
  const geometry = new THREE.TextBufferGeometry(text, {
    font,
    size: 3,
    height: 1,
    curveSegments: 64,
  });
  // ...
});
```
改用 TTFLoader 后，加载速度有了明显的提升
![ttf格式](https://user-gold-cdn.xitu.io/2020/6/11/172a169753fda30d?w=416&h=23&f=png&s=2236)
## 减少请求次数
由于需要引入额外的很多 js 文件，导致请求次数特别多，因此我们需要打包工具 webpack 帮助我们打包压缩（为了利用 webpack 打包，我们需要将原项目重构成 CommonJS 规范，详情见下文）

webpack 配置
```js
// webpack.config.js
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: "./main.js",
  output: {
    path: path.resolve(__dirname, "./dist")
  }
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      favicon: path.resolve("./public/favicon.ico"),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/',
          to: 'assets/'
        },
      ],
    })
  ],
  devServer: {
    open: true,
    port: "8080",
    hot: true,
    hotOnly: true,
  }
};
```

# 重构为 CommonJS 规范
目录结构：

├─ node_modules  
├─ public // 类似 vue 的 public 目录  
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ favicon.ico // 网站图标  
 &nbsp;|&nbsp;&nbsp;&nbsp;└─ index.html // 模板html  
├─ src // 源文件  
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ assets // 静态资源  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ font // 字体文件夹	  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp; | &nbsp;&nbsp;└─ ...   
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ img // 图片文件夹  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp; | &nbsp;&nbsp;└─ ...   
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ model // 模型文件夹  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp; | &nbsp;&nbsp;└─ ...   
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ composer  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;└─ composer.js // 后期处理 EffectComposer  
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ group  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ groupCommon.js // 分组间公用的内容  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ normalSceneGroup.js // 分组一  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ sceneGroup1.js // 分组二    
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;└─ sceneGroup2.js // 分组三   
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ js // 存放自己编写的 js 文件  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ common.js // 全局变量，注入在 Gvo 类的属性中  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ create.js  // 创建各种几何体物体  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;└─ util.js // 工具函数  
 &nbsp;|&nbsp;&nbsp;&nbsp;├─ lib // 存放各种需要的引入的文件  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ RenderPass.js  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ three.module.js  
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;├─ tween.cjs.js    
 &nbsp;| &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;└─ ...  
 &nbsp;|&nbsp;&nbsp;&nbsp;└─ gvo.js // Gvo 类  
 ├─ main.js // 入口文件  
 ├─ package.json  
 └─ webpack.config.js // webpack配置  

首先我们在 gvo.js 创建一个类 Gvo，将之前的 init_fn 中的方法写在 Gvo 中，并在 constructor 构造方法里执行初始化
```js
// gvo.js
class Gvo {
  constructor(selector, ThreeOption, lightOption) {
    this.initThree(selector, ThreeOption); // 默认自动初始化
    this.initLight(lightOption); // 默认自动初始化
    this.customInit(); // 用户自定义初始化
    this.initControls(); // 默认自动初始化
    this.initStats(); // 默认自动初始化
  }
  // 用户自定义初始化
  customInit() { ... }
  // 初始化三大件：场景、相机、渲染器
  initThree(selector, { cameraOption, rendererOption } = {}) { ... }
  // 设置灯光
  initLight(lightOption = 0xffffff) { ... }
  // 添加控制器
  initControls() { ... }
  // 添加fps
  initStats() { ... }
}
```
再将之前的 create_fn 中的一系列create方法绑定在 Gvo 类的方法上
```js
// create.js
function createClone() { ... }
function createImportModel() { ... }
function createEarth() { ... }
function createMachine() { ... }
...

Gvo.prototype.createClone = createClone;
Gvo.prototype.createImportModel = createImportModel;
Gvo.prototype.createEarth = createEarth;
Gvo.prototype.createMachine = createMachine;
...
```
然后将之前的 util_fn 中的方法 export 导出，在 composer_fn 中加入 darkenNonBloomed 和 restoreMaterial 方法（这两个方法是直接写在入口文件 index.html 中的），连同 createComposer 方法一并导出
```js
// composer.js
function createComposer() { ... }
...
function darkenNonBloomed() { ... }
function restoreMaterial() { ... }
module.exports = { createComposer, darkenNonBloomed, restoreMaterial };

// util.js
function mergeImage() { ... }
function computeUV() { ... }
module.exports = { mergeImage, computeUV }
```
接着新建一个group文件夹，在里面写上所有分组的逻辑，这里举例 groupCommon.js 和 sceneGroup1.js
```js
// groupCommon.js
// scene场景的公共内容
module.exports = (gvonte) => {
    const earth = gvonte.createEarth({ position: { x: -15, y: -1 } });
    const machine = gvonte.createMachine("./assets/img/move.png", { position: { x: 15, z: -20, y: -5 } });
    gvonte.groupCommon = { earth, machine };
};

// sceneGroup1.js
// scene场景的第一组内容
module.exports = async (gvonte) => {
    const { earth, machine } = gvonte.groupCommon;
    const earth1 = gvonte.createClone(earth, { position: { x: 15, y: -1 } });
    const machine1 = gvonte.createClone(machine, {
        position: { x: -15 },
    });
    const machine2 = gvonte.createClone(machine, {
        rotation: { x: Math.PI / 2 },
        position: { x: -15, y: -1, z: 15 },
    });
    // ...
    const group1 = gvonte.createGroup(
        machine,
        machine1,
        earth,
        earth1,
        machine2,
        // ...
    );
    group1.position.x = -60;

    const group1Animate = function () { ... };
    return { group1, group1Animate }
};
```
最后创建入口文件 main.js 
```js
// main.js
const gvonte = new Gvo("#canvas-frame", {
    rendererOption: {
        alpha: true,
        antialias: true
    }
}); // 新建 Gvo 类的实例

groupCommonFn(gvonte); // 初始化分组间公用的部分
(async function () {
    // 创建分组
    const { group1, group1Animate } = await sceneGroup1Fn(gvonte); // 新建第一个分组
    const { group2, group2Animate } = await sceneGroup2Fn(gvonte); // 新建第二个分组
    const { normalSceneGroup, normalSceneGroupAnimate } = await normalSceneGroupFn(gvonte); // 新建第三个分组
    gvonte.scene.add(group1);
    gvonte.scene.add(group2);
    gvonte.normalScene.add(normalSceneGroup);

    // 后期处理
    const { bloomComposer, finalComposer } = createComposer(gvonte);
    document.body.removeChild(document.querySelector("#label1"));
    document.body.removeChild(document.querySelector("#label2"));

    // 实现局部辉光的准备工作
    const bloomLayer = gvonte.createLayer(1);
    const materials = {};

    // 产生局部辉光的前三步，初始状态必须先调用 bloomComposer.render()
    function readyToBloom() {
        gvonte.scene.traverse(darkenNonBloomed(bloomLayer, materials, Gvo.BlackBasicMaterial));
        bloomComposer.render();
        gvonte.scene.traverse(restoreMaterial(materials));
    }
    readyToBloom();
    gvonte.controls.addEventListener("change", readyToBloom);

    function animate() {
        // 管道运动，路线循环流动效果
        group1Animate();
        group2Animate();
        normalSceneGroupAnimate();

        // fps监控
        gvonte.stats.update();

        // gvonte.renderer.render(gvonte.scene, gvonte.camera);
        finalComposer.render();
        requestAnimationFrame(animate);
    }
    animate();
})();
```