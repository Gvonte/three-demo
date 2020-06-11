# ThreeJS —— 机房Demo（三）

上一节我们重构了我们的代码，形成了两个区域，绘制出了一个大致的场景，这一节我们将在此基础上再添加一些实用的场景

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
# 创建文字
一个场景中一定少不了文字说明，用来描述该区域的特点、情况
## 创建3D文字
```js
// create_fn.js
function createText(text, color, conf) {
  // 为了解决回调地狱，同样引入Promise
  return new Promise((res) => {
    new THREE.FontLoader().load("../font/simhei.json", function (font) {
      const geometry = new THREE.TextBufferGeometry(text, {
        font,
        size: 3,
        height: 1,
        curveSegments: 64,
      });
      geometry.center(); // 将文字居中
      const material = new THREE.MeshBasicMaterial({
        color,
      });
      const mesh = new THREE.Mesh(geometry, material);
      initConfig(mesh, conf);
      res(mesh);
    });
  });
}

// index.html
// 引用
const text = await createText("移动网络接入区", "rgb(216, 120, 133)", {
  position: { x: 39, y: -3, z: 22 },
});
```
效果图：
![3D文字](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee7ef5b10?w=739&h=237&f=png&s=26173)
## 创建精灵文字Sprite
有的时候我们需要创建一个始终面向我们的一个平面，这个时候就要用的精灵几何体Sprite，精灵是一个总是面朝着摄像机的平面

效果图：
![精灵文字](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee60f7610?w=486&h=509&f=png&s=51100)
要创建一个Sprite几何体，必须传入SpriteMaMterial精灵材质，而该材质支持贴图，所以我们通常用图片或画布贴图实现Sprite，不过为了更自由的配置Sprite的内容（用图片太不方便，不同的Sprite还需要制作不同的图片），我们这里采用画布贴图CanvasTexture，并用到了一个DOM转canvas的插件[html2canvas](http://html2canvas.hertzen.com/)
```js
// create_fn.js
// 创建永远朝向自己这一面的文字
async function createSpriteText(selcetor, conf) {
  const elem = document.querySelector(selcetor); // selector是传入的选择器
  const canvas = await html2canvas(elem, {
    // 加入x、y配置，防止画布偏移，不加这两个配置，画布有可能偏移，产生空白区域
    x: elem.offsetLeft, 
    y: elem.offsetTop,
  });
  const texture = new THREE.CanvasTexture(canvas); 
  texture.magFilter = THREE.NearestFilter; // 提高清晰度，不加这两句画布会变模糊
  texture.minFilter = THREE.NearestFilter;
  const spriteMaterial = new THREE.SpriteMaMterial({
    map: texture,
    opacity: 0.8,
  }); // 创建精灵材质，map属性设置贴图，为了更高的可配置度，我们选择用canvas贴图
  const sprite = new THREE.Sprite(spriteMaterial); // 要创建精灵几何体必须要用精灵材质
  initConfig(sprite, conf);
  return sprite;
}
```
在入口文件index.html中使用createSpriteText
```html
<!DOCTYPE html>
<html>
  <head>
  	<!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css"
      integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
      crossorigin="anonymous"
    />
    <!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js"
      integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa"
      crossorigin="anonymous"
    ></script>
    <style type="text/css">
      /* ... */
      .panel {
        border: 0;
        width: 270px;
        text-indent: 20px;
        font-family: "tencent";
      }
    </style>
  </head>

  <body>
    <div id="canvas-frame"></div>

    <!-- 精灵文字模板，这里利用bootstrap快捷实现一个模板 -->
    <div class="panel" id="label">
      <div class="panel-heading" style="background-color: rgba(161, 89, 41, 0.8); color: white;">专线网络接入区</div>
      <div class="panel-body" style="background-color: rgba(72, 58, 46, 0.8); color: white;">
        <p>区域机器总数：100</p>
        <p>高风险漏洞机器总数：10</p>
        <p>高风险漏洞机器占比：10%</p>
      </div>
    </div>

	<!-- 引入的一些JS -->
    <script src="lib/three.js"></script>
    <script src="..."></script>
    
    <script>
      const { scene, camera, renderer } = initThree(
        "#canvas-frame"
      );
      // ...
      
      // 新添加的代码
      const sprite = await createSpriteText("#label", {
        position: { x: -65, y: 23 },
        scale: { x: 25, y: 15 },
      });
      group1.add(sprite);

	  // 最后要把精灵文字的模板从body元素中移除
	  document.body.removeChild(document.querySelector("#label"));
    </script>
  </body>
</html>
```
这样我们就实现了精灵文字，不过如果我们想实现带弧角的矩形怎么做呢？

相信很多人想，在dom元素中加一个border-radius不就行了，不过这是dom元素的border，然而sprite默认的geometry属性是一个正常的四四方方的矩形，这样会在背景留白，如图：
![改进精灵文字](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee661dd37?w=602&h=587&f=png&s=57713)
## 改进版精灵文字
这里就需要我们在创建好Sprite后，手动去修改Sprite下的geometry属性，用新的geometry去替换旧的
```js
// create_fn.js
async function createSpriteText(selcetor, conf) {
  const elem = document.querySelector(selcetor);
  const canvas = await html2canvas(elem, {
    x: elem.offsetLeft,
    y: elem.offsetTop,
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; // 提高清晰度
  texture.minFilter = THREE.NearestFilter;
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    opacity: 0.8,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const shape = createArcRect((15 * canvasW) / canvasH, 15, 2.5); // createArcRect是我们上一节封装的函数，用来创建一个弧角矩形的形状，三个参数分别代表长、宽、弧度，这里长宽按canvas比例缩小，不能用原有的长宽，否则过大
  const geometry = new THREE.ShapeBufferGeometry(shape, 64); // 创建一个自定义形状的平面
  sprite.geometry = geometry; // 用我们创建好的弧角矩形平面代替Sprite默认的geometry
  initConfig(sprite, conf);
  return sprite;
}
```
不过这里虽然是变成了弧角矩形，但并没有像我们想的那样，是为什么呢？
![改进精灵文字](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee8932186?w=463&h=521&f=png&s=35926)
这里就涉及到了图形学中非常重要的一个概念——UV坐标，在利用ShapeGeometry自定义形状贴图时，如果使用纯色贴图到不会产生预料之外的偏差，不过如果用纹理贴图就会产生一个问题：因为我们的模型是根据一个shape生成的ShapeGeometry，所以贴图会采用UV坐标进行贴图，UV坐标是一组在(0,1)范围内的坐标，更多有关UV坐标的解释可以参考[这篇文章](http://paulyg.f2s.com/uv.htm)，所以这里我们需要计算并更新uv坐标。
```js
// create_fn.js
async function createSpriteText(selcetor, conf) {
  // ...
  const shape = createArcRect((15 * canvasW) / canvasH, 15, 2.5); 
  const geometry = new THREE.ShapeBufferGeometry(shape, 64); 
  computeUV(geometry); // 计算并更新该几何体的UV
  sprite.geometry = geometry; 
  initConfig(sprite, conf);
  return sprite;
}

// util_fn.js
// 计算对应UV坐标
function computeUV(geometry) {
  geometry.computeBoundingBox(); // 计算外边界矩形，这样才能得到geometry的boundingBox属性值
  const max = geometry.boundingBox.max,
    min = geometry.boundingBox.min; // 获取最大、最小值
  const offset = new THREE.Vector2(0 - min.x, 0 - min.y); // 计算偏移量
  const range = new THREE.Vector2(max.x - min.x, max.y - min.y); // 计算范围
  const uvArr = geometry.getAttribute("uv");
  uvArr.array = uvArr.array.map((item, index) =>
    index % 2 ? item / range.y + offset.y : item / range.x + offset.x
  );
  geometry.setAttribute("uv", uvArr); // 将geometry的uv属性设置成我们刚刚计算出来的新uv值
  geometry.uvsNeedUpdate = true; // needUpdate必须为true才会更新
}
```
这样终于就满足了我们的需求
![精灵文字最终版](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee8a73708?w=583&h=624&f=png&s=59718)
# 创建光圈效果
在机房场景中，我们有的时候需要一圈光来表示这片区域的情况，例如绿色表示正常，红色表示告警
![在这里插入图片描述](https://user-gold-cdn.xitu.io/2020/6/6/1728a18ee900908c?w=759&h=346&f=png&s=72129)
原理：利用 ExtrudeGeometry（ExtrudeGeometry是将一个平面延伸后得到的一个几何体），并用一张渐变色的图片贴图，即可得到光圈效果

渐变素材图片：
![渐变色](https://user-gold-cdn.xitu.io/2020/6/6/1728a18f166c6278?w=8&h=75&f=png&s=2583)
```js
// create_fn.js
// 创建围绕物体的辉光效果
function createLightBeam(width, height, arc, color, conf) {
  const shape = createArcRect(width, height, arc); // createArcRect是我们上一节封装的函数，用来创建一个弧角矩形的形状
  const extrudeSettings = {
    steps: 64,
    depth: 1, // step设置为1，保证侧面只有一个平面，如果设置大于1，则延伸出去的侧面不止一个平面，导致贴图时会产生bug，如果想延伸的更深，可以通过scale放大
    bevelEnabled: false,
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const bottomMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  }); // 设置上下底面的材质不可见
  const texture = createTexture("img/gradient.png");
  const sideMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    color,
  }); // 给侧面进行贴图，贴图的图片为一张渐变色的图片
  const mesh = new THREE.Mesh(geometry, [bottomMaterial, sideMaterial]);
  initConfig(mesh, conf);
  return mesh;
}
```
## 为光圈添上动画
到这里，光圈效果就产生了，我们还可以给其加上动画，让其渐隐渐显
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
	...
    <script>
      // ...
      
      // 新添加的代码
   	  const beam = createLightBeam(100, 56, 2, "red", {
	    scale: { z: 10 },
	    rotation: { x: Math.PI / 2 },
	    position: { x: -13, y: 3.9, z: -28 },
	  });
	  scene.add(beam); // 这里是放在scene中，实际我放在了group2分组下
	
	  // 控制动画
	  let direction = true;
	  function animate() {
	    // ...
	
	    if (direction) {
	      beam.material[1].opacity -= 0.01;
	      if (beam.material[1].opacity <= 0.5) {
	        direction = false;
	      }
	    } else {
	      beam.material[1].opacity += 0.01;
	      if (beam.material[1].opacity >= 1) {
	        direction = true;
	      }
	    }
	  
	    renderer.render(scene, camera);
	    requestAnimationFrame(animate);
	  }		
	  animate();
    </script>
  </body>
</html>
```
## 利用Tween.js实现动画
手动实现动画始终是比较麻烦的，我们可以用 [tween.js](https://github.com/tweenjs/tween.js/) 这个补间动画库来快捷实现
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
	...
    <script>
      // ...
   	  const beam = ...;
	
	  // tween实现动画
	  const tween1 = new TWEEN.Tween(beam.material[1])
        .to({ opacity: 0 }, 1000)
        .onComplete(() => {
          tween2.start(); // 结束后调用tween2，开始显示
        }); // 渐隐动画
      const tween2 = new TWEEN.Tween(beam.material[1])
        .to({ opacity: 1 }, 1000)
        .onComplete(() => {
          tween1.start(); // 结束后调用tween1，开始隐藏
        }); // 渐显动画
      tween1.start();
      
	  function animate() {
	    // ...
	
	    TWEEN.update(); // 必须加上这一句
	  
	    renderer.render(scene, camera);
	    requestAnimationFrame(animate);
	  }		
	  animate();
    </script>
  </body>
</html>
```