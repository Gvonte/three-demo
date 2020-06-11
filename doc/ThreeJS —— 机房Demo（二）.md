# ThreeJS —— 机房Demo（二）

Three世界中的物体都是大部分都是由一个个几何体Geometry构成的，上一节我们在场景中加入了一些几何体模拟机器，并渲染出来了画面，这一节我们将加入一些新的几何体，来模拟线路等  

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
# 模拟一条管线
机房中必不可少的当然是一条条类似管道的线路了，里面在不停的传输着数据源，那么这次我们将模拟出一条管线来
## 创建TubeGeometry几何体
首先我们利用TubeGeometry创建一条管道，第一个参数传入自定义好的路径
```js
// create_fn.js
// 传入一组三维坐标点，例如：([-15, -5, 15], [-15, -5, -40], [40, -5, -40])，按照这组点形成一条路径，在此路径基础上创建管道
function createTube(...pointsArr) {
  const path = createPath(pointsArr); // createPath是我们编写的创建路径的函数，详细如下
  const geometry = new THREE.TubeGeometry(path, 64, 0.3); // 第一个参数为路径，必须为Curve类，第二个参数为分段值（可理解为细粒度），第三个参数为管道横截面半径
  // curve是基类，表示曲线，子类有lineCurve二维直线，lineCurve3三维直线
  // curvePath是一组curve构成的路径，可以算是curve的子类，curvePath的子类path二维路径，shape是path的子类，所以第一个参数可以传入curvePath
  const material = new THREE.MeshBasicMaterial({ color: "#00ffff" });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// 创建一条路径，可以是三维或二维路径，传入一组点，例如：[[-15, -5, 15], [-15, -5, -40], [40, -5, -40]]
function createPath(pointsArr) {
  pointsArr = pointsArr.map((point) => new THREE.Vector3(...point)); // 将参数数组转换成点数组的形式

  // 方法一：自定义三维路径 curvePath
  const path = new THREE.CurvePath();
  for (let i = 0; i < pointsArr.length - 1; i++) {
    const lineCurve = new THREE.LineCurve3(pointsArr[i], pointsArr[i + 1]); // 每两个点之间形成一条三维直线
    path.curves.push(lineCurve); // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
  }
  // 方法二：利用CatmullRomCurve3创建三维路径，不过CatmullRomCurve3是平滑的三维样条曲线
  // const path = new THREE.CatmullRomCurve3(pointsArr);

  return path;
}
```
效果图：
![管线一](https://user-gold-cdn.xitu.io/2020/6/6/1728a174887f5bbd?w=586&h=344&f=png&s=68436)
到这里，管道已经创建完毕了，不过只有一条管道并不能很好的模拟除管线的效果，因为缺少了很重要的一个元素——“动画”
## 为管线添加动画
管道实现动画原理：
1. 对管道进行贴图，图片由两种相近的颜色组成，较亮的颜色可以模拟正在传输的数据元
![运动的管线](https://user-gold-cdn.xitu.io/2020/6/6/1728a17486301784?w=854&h=269&f=png&s=63743)
2. 在animate动画中，动态的改变贴图的偏移量offset，产生运动效果

运动素材贴图 tube.jpg ：
![运动素材贴图](https://user-gold-cdn.xitu.io/2020/6/5/172847f890b34d11?w=142&h=106&f=jpeg&s=10131)
创建管线：
```js
// create_fn.js
async function createTube(...pointsArr) {
  const path = createPath(pointsArr);
  const geometry = new THREE.TubeGeometry(path, 64, 0.3);

  // 模拟管线运动动画的贴图texture
  const texture = new THREE.TextureLoader().load('../img/tube.jpg');
  texture.wrapS = THREE.RepeatWrapping; // 设置x方向能够重复，这样才可以设置texture的偏移量offset
  texture.repeat.x = 1; // 设置x方向的重复数为1，也可设置为2，这样产生的动画效果代表管道内同时有两端数据元在传输
  
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return { texture, mesh };
}
```
给管线添加动画：
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="canvas-frame"></div>
    
	<!-- 引入的一些JS -->
    <script src="lib/three.js"></script>
    <script src="..."></script> 
    
    <script>
      // ...
      
      // 新添加的代码
      const { texture, mesh } = await createTube([-15, -5, 15], [-15, -5, -40], [40, -5, -40]); // 获取到管线mesh，以及管线贴图texture
      scene.add(mesh); // 将管线添加到场景中

      function animate(time) {
         // ...
         
         texture.offset.x -= 0.022; // 每次让贴图的x偏移量减少0.022，以产生动画效果
         renderer.render(scene, camera);
         requestAnimationFrame(animate);
       }
       animate();
    </script>
  </body>
</html>
```
## 自定义管线运动部分的长度
上面虽然实现了管线的动画效果，但是由于贴图素材中，运动部分和不运动部分的比例是固定的，导致如果管线很长的话，运动部分所占的长度也会相应变长，影响美观（例如：运动部分和不运动部分原本比例1：4，如果是10m长的管道，那么运动部分占了2m，但如果是100m长的管道，则运动部分就占了20m，显然过长），所以需要自定义运动部分所占的比例

实现原理：
1. 首先准备两张长宽相同的素材图片，一张用作运动部分，一张用作不运动部分
2. 根据传入的比例，在canvas中将两张图片按照比例合并成一张图片
3. 将合成后的图片作为管线的贴图

首先我们提前准备好一个函数 mergeImage，用来将两张图片按比例合并成为一张
```js
// util_fn.js
function mergeImage(imgSrc1, imgSrc2, a, b) {
  return new Promise((res, rej) => {
    const canvas = document.createElement("canvas"); // 创建canvas
    const ctx = canvas.getContext("2d");
    const img1 = new Image();
    img1.src = imgSrc1;
    img1.onload = function () {
      const img2 = new Image();
      img2.src = imgSrc2;
      img2.onload = function () {
        // 等两张图片都加载完毕后
        canvas.width = img1.width * a + img2.width * b; // 按两张图片的比例设置画布的大小
        canvas.height = img1.height;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fill();

        let width = 0;
        // 绘制img1
        for (let i = 0; i < a; i++) {
          ctx.drawImage(img1, width, 0, img1.width, img1.height);
          width += img1.width;
        }

        // 绘制img2
        for (let i = 0; i < b; i++) {
          ctx.drawImage(img2, width, 0, img2.width, img2.height);
          width += img2.width;
        }

        // 合并
        const base64 = canvas.toDataURL("image/png"); // "image/png" 这里注意一下
        res(base64); // 将得到的图片的base64传出去
      };
    };
  });
}
```
生成管道
```js
// create_fn.js
async function createTube(...pointsArr) {
  const path = createPath(pointsArr);
  const geometry = new THREE.TubeGeometry(path, 64, 0.3);

  // 模拟管线运动动画，将两个素材图按比例合并，然后生成贴图texture，这里比例为1：7
  const base64 = await mergeImage("../img/2.png", "../img/1.png", 1, 7);

  const texture = createTexture(base64, { repeat: { x: 1 } }); // textureLoader支持加载Data URI，这里的createTexture为上一节我们封装的函数
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return { texture, mesh };
}
```
到这一步，整条管线就算制作完毕了


# 创建一个平面
可能细心的朋友已经发现了，前面很多效果图中的几何体都是在一个平面上的，那么这里我们将学习创建一个平面
## 创建PlaneBufferGeometry几何体
```js
// create_fn.js
function createFace(width, height, arc, conf) {
  const geometry = new THREE.PlaneBufferGeometry(50, 40, 64); // 创建一个平面几何体，前两个参数设置长和宽，第三个参数设置细粒度
  const material = new THREE.MeshBasicMaterial({
    color: "rgb(159, 161, 162)",
    side: THREE.DoubleSide, // 保证两面都渲染，这样从正反两面看这个平面都是存在的
    transparent: true,
    opacity: 1 // 透明度
  });
  const mesh = new THREE.Mesh(geometry, material);
  initConfig(mesh, conf);
  return mesh;
}
```
效果图：
![平面](https://user-gold-cdn.xitu.io/2020/6/6/1728a174865ae30a?w=443&h=395&f=png&s=11049)
通过调整平面和物体的位置、旋转，可以实现物体恰好放在平面上的感觉。不过这里有个美中不足的地方就是，平面是一个矩形，如果我想实现弧角怎么办呢？
## 创建一个自定义形状的平面
原理：利用ShapeBufferGeometry实现自定义形状的平面

这里我们先提前准备一个函数 createArcRect，用来创建出一个弧角矩形的形状
```js
// create_fn.js
// 利用Three中的Shape创建一个带弧角的矩形的形状，三个参数分别代表长、宽、弧度
function createArcRect(width, height, arc) {
  const shape = new THREE.Shape();
  const w = width - arc;
  const h = height - arc;
  // 下面是一系列的计算
  shape.moveTo(w, height);
  shape.arc(0, -1 * arc, arc, Math.PI / 2, 0, true);
  shape.lineTo(width, arc);
  shape.arc(-1 * arc, 0, arc, 0, (3 * Math.PI) / 2, true);
  shape.lineTo(arc, 0);
  shape.arc(0, arc, arc, (3 * Math.PI) / 2, Math.PI, true);
  shape.lineTo(0, h);
  shape.arc(arc, 0, arc, Math.PI, Math.PI / 2, true);
  shape.lineTo(w, height);
  return shape;
}
```
利用创建弧角矩形的函数，通过 ShapeBufferGeometry 来创建出我们需要的弧角矩形平面
```js
// create_fn.js
// 创建一个弧角矩形平面，前两个参数代表长宽，arc代表弧角角度
function createFace(width, height, arc, conf) {
  const shape = createArcRect(width, height, arc);
  const geometry = new THREE.ShapeBufferGeometry(shape, 64); // 传入我们刚刚定义的形状shape
  const material = new THREE.MeshBasicMaterial({
    color: "rgb(159, 161, 162)",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  initConfig(mesh, conf);
  return mesh;
}
```
最终效果：
![在这里插入图片描述](https://user-gold-cdn.xitu.io/2020/6/6/1728a1748678a968?w=370&h=386&f=png&s=33013)
# 创建分组Group
既然我们建立了一个平面，以及将物体放置在了平面上，那么这一块就代表一个区域，通常一个项目中会有多个区域，那么这个时候我们就需要Group分组了，这样逻辑清晰，在处理交互的时候也会更加明了，就像模块拆分一样
```js
// create_fn.js
// 传入的参数为一个个的几何体
function createGroup(...arr) {
  const group = new THREE.Group();
  arr.forEach((item) => group.add(item)); // 通过group.add向该分组中添加几何体
  scene.add(group); // 将分组加入到场景中
  return group;
}
```
在 index.html 中使用
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
    <div id="canvas-frame"></div>
    
	<!-- 引入的一些JS -->
    <script src="lib/three.js"></script>
    <script src="..."></script>
    
    <script>
      // 上节的代码
      const { scene, camera, renderer } = initThree(
        "#canvas-frame"
      );
      // ...
      
      // 新添加的代码
      const earth = createEarth({ position: { x: -15, y: -1 } });
      const machine = createMachine("./img/move.png", { rotation: { x: Math.PI / 2 } });
      const face = createFace(50, 60, 4);
      const { texture: tubeTexture, mesh: tube } = await createTube([-15, -5, 0], [15, -5, 0]);
      group = createGroup(earth, machine, face, tube); // 直接将几何体一个个传进去
      group.position.x = -60; // 修改group的位置
    </script>
  </body>
</html>
```
# 重构代码
效果图：
![最终效果](https://user-gold-cdn.xitu.io/2020/6/6/1728a1748886c600?w=1017&h=287&f=png&s=45333)
这里我将整个场景划分为左右两个区域，所以设置两个分组，代码如下：
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
        /* background-color: #eeeeee; */
      }
    </style>
  </head>

  <body>
    <div id="canvas-frame"></div>

    <script src="lib/three.js"></script>
    <!-- 控制器 -->
    <script src="lib/OrbitControls.js"></script>
    <!-- fps -->
    <script src="lib/stats.min.js"></script>
    <!-- 加载模型 -->
    <script src="lib/DRACOLoader.js"></script>
    <script src="lib/GLTFLoader.js"></script>

    <!-- 引入自己封装好的函数 -->
    <script src="js/util_fn.js"></script>
    <script src="js/init_fn.js"></script>
    <script src="js/create_fn.js"></script>

    <script>
      // 初始化
      const { scene, camera, renderer } = initThree("#canvas-frame");
      const lights = initLight();
      const controls = initControls();
      const stats = initStats();

      // 构建场景
      // 合并图片需要等图片加载，这里有回调地狱，所以用 async 解决
      (async function () {
        // 为了使每一组的命名不冲突，将每组的代码用块级作用域隔开
        // scene场景的第一组内容
        let group1, group1Animate;
        {
          const earth1 = createEarth({ position: { x: -15, y: -1 } });
          const earth2 = createEarth({ position: { x: 15, y: -1 } });
          const machine1 = createMachine("./img/move.png", {
            rotation: { x: Math.PI / 2 },
            position: { x: 15, y: -1, z: 15 },
          });
          const machine2 = createMachine("./img/move.png", {
            rotation: { x: Math.PI / 2 },
            position: { x: -15, y: -1, z: 15 },
          });
          const machine3 = createMachine("./img/move.png", {
            position: { x: 15, z: -20, y: -5 },
          });
          const machine4 = createMachine("./img/move.png", {
            position: { x: -15, z: -20, y: -5 },
          });
          const face = createFace(50, 60, 4, {
            rotation: { x: Math.PI / 2 },
            position: { x: -25, y: -6.1, z: -30 },
          });
          const { texture: tubeTexture1, mesh: tube1 } = await createTube(
            [-15, -5, 0],
            [15, -5, 0]
          );
          const { texture: tubeTexture2, mesh: tube2 } = await createTube(
            [-15, -5, 15],
            [15, -5, 15]
          );
          const { texture: tubeTexture3, mesh: tube3 } = await createTube(
            [-15, -5, -20],
            [15, -5, -20]
          );
          const { texture: tubeTexture4, mesh: tube4 } = await createTube(
            [-15, -5, 15],
            [-15, -5, -40],
            [40, -5, -40],
            [40, -5, -10],
            [60, -5, -10]
          );
          const { texture: tubeTexture5, mesh: tube5 } = await createTube(
            [15, -5, 15],
            [15, -5, -35],
            [30, -5, -35],
            [30, -5, 10],
            [60, -5, 10]
          );
          group1 = createGroup(
            machine1,
            machine2,
            earth1,
            earth2,
            machine3,
            machine4,
            face,
            tube1,
            tube2,
            tube3,
            tube4,
            tube5
          );
          group1.position.x = -60;

          // 每一组的运动函数
          group1Animate = function () {
            tubeTexture1.offset.x -= 0.022;
            tubeTexture2.offset.x -= 0.02;
            tubeTexture3.offset.x -= 0.019;
            tubeTexture4.offset.x -= 0.022;
            tubeTexture5.offset.x -= 0.02;
          };
        }

        // scene场景的第二组内容
        let group2, group2Animate;
        {
          const earth = createEarth({ position: { z: -10, y: -1.1 } });
          const machine1 = createMachine("./img/move.png", {
            position: { y: -5, z: 10 },
          });
          const machine2 = createMachine("./img/electronics.png", {
            position: { x: 26, y: -5 },
          });
          const machine3 = createMachine("./img/electronics.png", {
            position: { x: 45, y: -5 },
          });
          const computer1 = await createImportModel(
            "./model/com/computer.gltf",
            {
              scale: { x: 150, y: 150, z: 150 },
              position: { x: 71, y: -6, z: 15 },
            }
          );
          const computer2 = await createImportModel(
            "./model/com/computer.gltf",
            {
              scale: { x: 150, y: 150, z: 150 },
              position: { x: 71, y: -6, z: -5 },
            }
          );
          const { texture: tubeTexture1, mesh: tube1 } = await createTube(
            [0, -5, 10],
            [15, -5, 0],
            [56, -5, 0],
            [71, -5, 10]
          );
          const { texture: tubeTexture2, mesh: tube2 } = await createTube(
            [0, -5, -10],
            [15, -5, 0],
            [56, -5, 0],
            [71, -5, -10]
          );
          const face = createFace(100, 56, 2, {
            rotation: { x: Math.PI / 2 },
            position: { x: -13, y: -6.1, z: -28 },
          });
          group2 = createGroup(
            earth,
            machine1,
            machine2,
            machine3,
            tube1,
            tube2,
            computer1,
            computer2,
            face
          );

          // 第二组的运动函数
          group2Animate = function () {
            tubeTexture1.offset.x -= 0.022;
            tubeTexture2.offset.x -= 0.02;
          };
        }

        // animate
        animate();
        function animate(time) {
          // 载入两个分组的动画函数
          // 管道运动，路线循环流动效果
          group1Animate();
          group2Animate();

          // fps监控
          stats.update();

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        }
      })();
    </script>
  </body>
</html>
```