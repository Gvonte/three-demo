# ThreeJS —— 机房Demo（一）

最近对3D可视化这一块比较感兴趣，通过了解ThreeJS是用来实现3D可视化的一种常用方法，于是在自学ThreeJS的基础上，打算写一个机房Demo来练手

[点这里预览项目](http://106.12.28.127:8080/)  
[GitHub](https://github.com/Gvonte/three-demo)
# 目录结构
├── font	// 字体文件  
 &nbsp;|├──── font.ttf // 字体源文件  
 &nbsp;|└──── font.json // 转换后的字体文件  
├── img	// 素材图片  
&nbsp;|├──── xx.png  
&nbsp;|├──── xxx.jpg  
&nbsp;|└──── ...  
├── js // 自己编写的js文件  
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
# 初始化Three三大件：场景、相机、渲染器
首先我们应该对Three进行初始化，准备好我们的相机和渲染器，搭建好场景
- 初始化场景
```js
const scene = new THREE.Scene();
// 设置场景背景图，三种类型：
// 1. 普通背景图，一个平面
scene.background = new THREE.Color("rgb(25, 35, 39)");
scene.background = new THREE.TextureLoader().load('img/back.jpg');

// 2. 立方体背景图
scene.background = new THREE.CubeTextureLoader().setPath('img/').load(new Array(6).fill('back.jpg'));

// 3. 球型全景(背景)图，通过建立球体，并反向放大100倍实现，其中x放大倍数为负数
const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("img/back.jpg") });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
geometry.scale(- 100, 100, 100);
```
- 初始化相机
```js
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-20, 40, 90); // 设置相机的初始位置
```
- 初始化渲染器
```js
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha：背景透明，antialias：抗锯齿
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // 加入body中，也可以加入任意元素里
```
- 最终在 init_fn.js 中合并成一个函数 initThree
```js
// init_fn.js
function initThree(selector) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(25, 35, 39)");
  
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-20, 40, 90);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector(selector).appendChild(renderer.domElement);
  
  return { scene, camera, renderer };
}
```
# 添加轨道控制器
为了增加用户交互性，我们需要添加控制器，添加后就可以通过滚轮缩放控制模型大小，鼠标左键旋转，鼠标右键平移
- 首先在 index.html 中引入所需文件
```html
<!-- index.html -->
<script src="lib/OrbitControls.js"></script>
```
- 然后创建轨道控制器 	
```js
// init_fn.js
function initControls() {
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', function () { ... }); // 添加事件
  return controls;
}
```
# 添加Stats
Stats能实时监听fps的变化，用来监测渲染场景的性能
- 首先在 index.html 中引入所需文件
```html
<!-- index.html -->
<script src="lib/stats.min.js"></script>
```
- 然后创建Stats
```js
// init_fn.js
function initStats() {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  return stats;
}
```
# 初始化灯光
灯光用来给物体上色，没有灯光的物体将一片漆黑，我们通常先加入一个自然光，确保每个物体都能呈现出来，然后再根据需求添加任意灯光
```js
// init_fn.js
function initLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff); // 自然光，每个几何体的每个面都有光
  const pointLight = new THREE.PointLight(0xff0000, 10); // 点光源
  pointLight.position.set(0, 50, 0); // 调整点光源位置
  scene.add(ambientLight);
  scene.add(pointLight);
  return [ambientLight, pointLight];
}
```
# 编写入口文件
编写 index.html，引入前面编写好的 init_fn.js 函数来初始化Three
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Three-Demo</title>
    <style type="text/css">
      body {
        margin: 0;
      }

      #canvas-frame {
        border: none;
        background-color: #eeeeee; /* 设置背景颜色 */
      }
    </style>
  </head>

  <body>
    <div id="canvas-frame"></div>
    
	<!-- 引入ThreeJS -->
    <script src="lib/three.js"></script>
    <!-- 引入控制器 -->
    <script src="lib/OrbitControls.js"></script>
    <!-- 引入fps -->
    <script src="lib/stats.min.js"></script>
    <!-- 自己封装好的函数 -->
    <script src="js/init_fn.js"></script>
    
    <script>
      // 初始化
      const { scene, camera, renderer } = initThree(
        "#canvas-frame"
      );
      const lights = initLight();
      const controls = initControls();
      const stats = initStats();
      // camera.lookAt(10, 10, 10);

	  function animate(time) {
        stats.update(); // 初始化stats后，需要在这里执行update方法才能实现fps实时监控
        renderer.render(scene, camera); // 最后需要将场景渲染出来，没有这句将什么都显示不了
        requestAnimationFrame(animate); // 这里利用浏览器API——requestAnimationFrame，每帧都进行渲染，执行renderer.render(...)方法
      }
      animate();
    </script>
  </body>
</html>
```
# 创建一台机器（一）—— 创建几何体
上面的步骤仅仅只是对Three的初始化，也就是前期准备，此时场景里还是空空如也，什么都没有，我们需要往场景里添加各种几何体并渲染出来，下面我们将添加我们的第一个几何体

效果图：
![机器一](https://user-gold-cdn.xitu.io/2020/6/5/17284004131f3dcc?w=91&h=89&f=png&s=9266)
通过创建一个球体，并进行贴图，模拟网络中的一台机器
```js
// create_fn.js
// 创建一台机器（球体）
function createEarth() {
  const geometry = new THREE.SphereBufferGeometry(5, 64, 64); // 构建一个球型几何体，BufferGeometry性能比Geometry好
  const texture = new THREE.TextureLoader().load("./img/earth.png"); // 创建一个纹理贴图，将其贴到一个表面
  const material = new THREE.MeshBasicMaterial({ map: texture }); // 创建一个材质，map属性传入刚刚创建好的纹理贴图
  const mesh = new THREE.Mesh(geometry, material); // 利用Mesh将几何体和材质联系在一起，形成最终的物体
  mesh.position.x = -15; 
  mesh.position.y = -1; // 修改几何体的位置
  return mesh;
}
```
将几何体添加至场景中，然后渲染
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
    <div id="canvas-frame"></div>
    
	<!-- 引入的一些JS -->
    <script src="lib/three.js"></script>
    <script src="lib/OrbitControls.js"></script>
    <script src="lib/stats.min.js"></script>
    
    <!-- 自己封装好的函数 -->
    <script src="js/init_fn.js"></script>
    <script src="js/create_fn.js"></script>
    
    <script>
      const { scene, camera, renderer } = initThree(
        "#canvas-frame"
      );
      const lights = initLight();
      const controls = initControls();
      const stats = initStats();
      
      // 新添加的代码
      const mesh = createEarth(); 
      scene.add(mesh); // 将物体添加到场景中

      function animate(time) {
         stats.update();
         renderer.render(scene, camera);
         requestAnimationFrame(animate);
       }
       animate();
    </script>
  </body>
</html>
```
# 创建一台机器（二）—— 创建多材质几何体
效果图：
![机器二](https://user-gold-cdn.xitu.io/2020/6/5/1728400415c1d334?w=77&h=58&f=png&s=3826)
通过创建一个圆柱体，并对不同面进行贴图（上下底面用贴图，侧面用纯色），模拟一台机器
```js
// create_fn.js
// 创建一台机器（圆柱），path为上下底面的贴图图片路径
function createMachine(path, conf) {
  const geometry = new THREE.CylinderBufferGeometry(5, 5, 2, 64); 
  const texture = createTexture(path); // 因为经常要用到贴图，所以摘出一个函数来创建纹理贴图
  const bottomMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const sideMaterial = new THREE.MeshBasicMaterial({ color: "#1296DB" });
  const materials = [sideMaterial, bottomMaterial, bottomMaterial]; /* 材质material可以为一个值，也可以为一个数组，若是数组则表示对每个面应用不同的材质 
  这里用数组，第一个元素是侧面的材质，第二个元素是上面那个面的材质，第三个元素是下面那个面的材质 */
  const mesh = new THREE.Mesh(geometry, materials);
  initConfig(mesh, conf); // 因为经常要对物体进行变形（改变位置、大小等），所以单独写一个函数
  return mesh;
}

// 创建一种纹理贴图，path为贴图图片路径
function createTexture(path, conf) {
  const texture = new THREE.TextureLoader().load(path);
  initConfig(texture, conf);
  return texture;
}

// 对传入的conf进行处理，因为大部分几何体都能对其position（位置）、rotation（渲染）、scale（缩放）等进行设置
// 应用举例：initConfig(mesh, { position: { x: -15, y: -1 } })
// 第一个参数不一定要传入mesh，也可以传入纹理Texture 
function initConfig(mesh, conf) {
  if (conf) {
    const { position, rotation, scale, repeat } = conf;
    if (position) {
      const { x, y, z } = position;
      x ? (mesh.position.x = x) : null;
      y ? (mesh.position.y = y) : null;
      z ? (mesh.position.z = z) : null;
    }
    if (rotation) {
      const { x, y, z } = rotation;
      x ? (mesh.rotation.x = x) : null;
      y ? (mesh.rotation.y = y) : null;
      z ? (mesh.rotation.z = z) : null;
    }
    if (scale) {
      const { x, y, z } = scale;
      x ? (mesh.scale.x = x) : null;
      y ? (mesh.scale.y = y) : null;
      z ? (mesh.scale.z = z) : null;
    }
    if (repeat) {
      const { x, y } = repeat;
      // 对Texture的repeat进行处理
      if (x) {
        // 设置x方向的重复数
        mesh.wrapS = THREE.RepeatWrapping;
        mesh.repeat.x = x;
      }
      if (y) {
        // 设置y方向的重复数
        mesh.wrapT = THREE.RepeatWrapping;
        mesh.repeat.y = y;
      }
    }
  }
}
```
# 创建一台机器（三）—— 导入模型

通常在实际项目中，仅仅靠ThreeJS自带的一些几何体创建出来的物体满足不了我们的需求，这个时候就要利用3DS MAX、blender等建模软件建模，然后在Three中引入
- 引入需要的加载器文件
```html
<!-- index.html -->
<!-- 导入gltf模型，需要这两个加载器 -->
<script src="lib/DRACOLoader.js"></script>
<script src="lib/GLTFLoader.js"></script>
```
- 导入模型
```js
// create_fn.js
// 创建一个导入的模型，path为模型路径
function createImportModel(path, conf) {
  // 因为GLTFLoader只能用回调函数的形式获取到几何体，所以加入Promise方便我们后面的获取
  return new Promise((res) => {
    const dracoLoader = new THREE.DRACOLoader().setDecoderPath("../js/draco/"); // ThreeJS源码中有一个example文件夹，其中js目录下有一个draco目录，同样要将这个目录引入进来
    const loader = new THREE.GLTFLoader().setDRACOLoader(dracoLoader);
    loader.load(path, function (gltf) {
      // gltf对象中有很多属性，gltf.scene就是我们需要的几何体
      initConfig(gltf.scene, conf);
      res(gltf.scene); // 将物体传出去
    });
  });
}
```
效果图：
![机器三初始](https://user-gold-cdn.xitu.io/2020/6/6/1728a13f65d7f4b0?w=230&h=227&f=png&s=4586)
通常引入的模型是由多个几何体组成的，这个时候组成模型的每个几何体都没有对应的材质，需要我们手动为每一个几何体添加材质
```js
// create_fn.js
// 创建一个导入的模型
function createImportModel(path, conf) {
  return new Promise((res) => {
    const dracoLoader = new THREE.DRACOLoader().setDecoderPath("../js/draco/");
    const loader = new THREE.GLTFLoader().setDRACOLoader(dracoLoader);
    loader.load(path, function (gltf) {
      const colorArr = [
        "#999",
        "rgb(110, 105, 112)",
        "#7fffd4",
        "#ffe4c4",
        "#faebd7",
        "#a9a9a9",
        "#5f9ea0",
        "#6495ed",
      ];
      // scene中有一个traverse方法，可以遍历其子元素，然后判断该子元素是不是属于Mesh类，如果是则表示该子元素是一个几何体，可以对其执行相应操作：添加材质
      gltf.scene.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          // 为该模型的不同部件（即不同几何体）添加不同颜色材质（上色）
          child.material = new THREE.MeshBasicMaterial({
            color: colorArr.pop(),
          });
        }
      });
      initConfig(gltf.scene, conf);
      res(gltf.scene); // 将物体传出去
    });
  });
}
```
新的模型：
![机器三（加入线框前）](https://user-gold-cdn.xitu.io/2020/6/5/17284004165d198e?w=141&h=143&f=png&s=3336)
不过这样看还是感觉少了什么……对！面与面之间没有明显的边界，融为了一体。所以我们需要进一步优化这个模型：
```js
// create_fn.js
// 创建一个导入的模型
function createImportModel(path, conf) {
  return new Promise((res) => {
    const dracoLoader = new THREE.DRACOLoader().setDecoderPath("../js/draco/");
    const loader = new THREE.GLTFLoader().setDRACOLoader(dracoLoader);
    loader.load(path, function (gltf) {
      const colorArr = [
        "#999",
        "rgb(110, 105, 112)",
        "#7fffd4",
        "#ffe4c4",
        "#faebd7",
        "#a9a9a9",
        "#5f9ea0",
        "#6495ed",
      ];
      gltf.scene.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshBasicMaterial({ color: colorArr.pop() });
          
          // 为该模型的不同部件（即不同几何体）添加线框，使每个部分棱角分明，显得更逼真
          const geometry = new THREE.EdgesGeometry(child.geometry); // 边缘几何体
          const material = new THREE.LineBasicMaterial({ color: "#dcdcdc" }); // 线框材质
          // material.depthTest = false; // 深度测试，若开启则是边框透明的效果
          const mesh = new THREE.LineSegments(geometry, material);
          child.add(mesh); // 必须在child（即该部件）中加入，不能在scene中加入，以确保和几何体的相对位置始终保持一致
        }
      });
      initConfig(gltf.scene, conf);
      res(gltf.scene); // 将物体传出去
    });
  });
}
```
到这一步，我们该做的工作就都做完了，大功告成！最终效果图：
![在这里插入图片描述](https://user-gold-cdn.xitu.io/2020/6/6/1728a13f683d3152?w=139&h=135&f=png&s=5484)
# 写在后面的话
这是本人第一次研究3D可视化，学习ThreeJS以及WebGL，如有纰漏或疑问，还望在评论区指出

本文所参考的文章：
- [https://codepen.io/rachsmith/post/beginning-with-3d-webgl-pt-1-the-scene](https://codepen.io/rachsmith/post/beginning-with-3d-webgl-pt-1-the-scene) 官方推荐入门教程
- [https://blog.csdn.net/qq_37540004/article/details/102862348](https://blog.csdn.net/qq_37540004/article/details/102862348) ThreeJs做智慧城市项目