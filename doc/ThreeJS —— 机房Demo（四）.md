# ThreeJS —— 机房Demo（四）

上一节我们提到了光圈效果，除了这种光效，还有一个光效是3D可视化常用的，那就是辉光效果

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

# 创建辉光效果
有的时候我们希望某个几何体能更附加一层辉光特效，这样物体将更生动
![局部辉光](https://user-gold-cdn.xitu.io/2020/6/6/1728a1a9ccaea45f?w=449&h=335&f=png&s=45732)
## 效果合成器 EffectComposer
要想实现辉光效果，就是实现后期处理效果，需要用到效果合成器 EffectComposer，所以我们新建一个 composer_fn.js 文件，专门用来写后期处理的函数，然后在 index.html 中引入该js文件	
```js
// composer_fn.js
function createComposer() {
  // 后期处理的通常步骤：
  //   1. 创建一个 EffectComposer，假设命名为composer
  //   2. 给composer加入(addPass)各种通道
  // 通常第一个加入的通道是RenderPass，后续可以看需求选择加入的通道类型和顺序，例如这里后续就用到了BloomPass
  const bloomComposer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass = createUnrealBloomPass(); // 我们封装好的 createUnrealBloomPass 函数，用来创建BloomPass（辉光效果）
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);
  return bloomComposer;
}

// UnrealBloomPass，辉光效果
function createUnrealBloomPass() {
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  const params = {
    exposure: 1,
    bloomThreshold: 0.2,
    bloomStrength: 0.5, // 辉光强度
    bloomRadius: 0,
  };
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
  return bloomPass;
}
```
除了在 index.html 引入该js文件，还需要引入效果合成器所需要的js文件（这些文件都能在ThreeJS的源码的example目录下找到），并且将render方法改用composer的render
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
    <script src="..."></script>
    
	<!-- 后期处理，效果合成器所需的一些js文件 -->
	<script src="lib/EffectComposer.js"></script>
	<script src="lib/ShaderPass.js"></script>
	<script src="lib/RenderPass.js"></script>
	<script src="lib/CopyShader.js"></script>
	<script src="lib/LuminosityHighPassShader.js"></script>
	<script src="lib/UnrealBloomPass.js"></script>
	
    <script>
      // ...
	  const composer = createComposer();
	  
	  function animate() {
	    // ...
	    
	    // renderer.render(scene, camera);
	    composer.render(); // 将以前的render方法注释，换成composer的render
	    
	    requestAnimationFrame(animate);
	  }		
	  animate();
    </script>
  </body>
</html>
```
效果图：
![后期处理一](https://user-gold-cdn.xitu.io/2020/6/6/1728a1a9cee8ff25?w=434&h=357&f=png&s=46998)
## 部分辉光效果
上面虽然实现了辉光效果，不过它将所有的物体，一切场景都添加了辉光，而我们的实际需求是只需要部分物体实现辉光

部分辉光效果原理：
1. 准备两个EffectComposer，一个 bloomComposer 用来产生辉光效果，另一个 finalComposer 用来正常渲染整个场景
2. 将除辉光物体外的其他物体的材质转成黑色
3. 在 bloomComposer 中利用 BloomPass 产生辉光，但这里需要设置 bloomComposer.renderToScreen = false; 表示不渲染到屏幕上
4. 将转成黑色材质的物体还原成初始材质
5. 用 finalComposer 开始渲染，其中 finalComposer 需要加入一个通道(addPass)，该通道利用了 bloomComposer 的渲染结果

Three中为所有的几何体分配 1个到 32 个图层，编号从 0 到 31，所有几何体默认存储在第 0 个图层上，为了更好的区分辉光物体和非辉光物体，我们需要利用 Layer 创建一个图层，把辉光物体额外添加在一个新的图层上
```js
// create_fn.js
// 创建一个 Layer，用于区分辉光物体
function createLayer(num) {
  const layer = new THREE.Layers();
  layer.set(num);
  return layer;
}

// 在 index.html 中使用
const bloomLayer = createLayer(1); // 创建一个新的图层，编号为1

// 然后往所有辉光物体中，添加一个新的图层，这里用我们之前写的机器为例
// create_fn.js
function createEarth(conf) {
  const geometry = new THREE.SphereBufferGeometry(5, 64, 64);
  const texture = new THREE.TextureLoader().load("./img/earth.png");
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  initConfig(mesh, conf);
  mesh.layers.enable(1); // 与编号为1的图层建立关系，并切换到该图层。一定不能用 mesh.layers.set(1); 因为 set 会删除已有关系的图层，如果0图层没有了，那用 finalComposer 渲染的时候将渲染不了这个物体
  return mesh;
}
```
编写效果处理器代码
```js
// composer_fn.js
function createComposer() {
  const renderPass = new THREE.RenderPass(scene, camera); // 两个composer都要用到这个renderPass，所以在前面公共部分声明

  // bloomComposer效果合成器 产生辉光，但是不渲染到屏幕上
  const bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false; // 不渲染到屏幕上
  const bloomPass = createUnrealBloomPass();
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  // 最终真正渲染到屏幕上的效果合成器 finalComposer 
  const finalComposer = new THREE.EffectComposer(renderer);
  const shaderPass = createShaderPass(bloomComposer); // 创建自定义的着色器Pass，详细见下
  finalComposer.addPass(renderPass);
  finalComposer.addPass(shaderPass);
  return { bloomComposer, finalComposer };
}

// ShaderPass，着色器pass，自定义程度高，需要编写OpenGL代码
// 传入bloomComposer
function createShaderPass(bloomComposer) {
  // 着色器材质，自定义shader渲染的材质
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture }, // 辉光贴图属性设置为传入的bloomComposer，这里就说明了为什么bloomComposer不要渲染到屏幕上
    },
    vertexShader: document.getElementById("vertexshader").textContent, // 顶点着色器
    fragmentShader: document.getElementById("fragmentshader").textContent, // 片元着色器
    defines: {},
  });
  const shaderPass = new THREE.ShaderPass(shaderMaterial, "baseTexture");
  shaderPass.needsSwap = true;
  return shaderPass;
}
```
在入口文件 index.html 中，运用效果处理器，实现部分辉光
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
  	<div>...</div>
  	
  	<!-- 着色器代码 -->
    <script type="x-shader/x-vertex" id="vertexshader">
      varying vec2 vUv;
      void main() {
      	vUv = uv;
      	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    </script>
    <script type="x-shader/x-fragment" id="fragmentshader">
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      vec4 getTexture( sampler2D texelToLinearTexture ) {
      	return mapTexelToLinear( texture2D( texelToLinearTexture , vUv ) );
      }
      void main() {
      	gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );
      }
    </script>
    
    <script src="..."></script>
    <script>
      // ...
      const bloomLayer = createLayer(1); // 创建一个新的图层，编号为1
      const materials = {};
      const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" }); // 提前创建好黑色普通材质，供后面使用
	  const { bloomComposer, finalComposer } = createComposer(); // 创建效果处理器

      function animate(time) {
        // ...

        // 实现局部辉光
        // 1. 利用 darkenNonBloomed 函数将除辉光物体外的其他物体的材质转成黑色
        scene.traverse(darkenNonBloomed);
        // 2. 用 bloomComposer 产生辉光
        bloomComposer.render();
        // 3. 将转成黑色材质的物体还原成初始材质
        scene.traverse(restoreMaterial);
        // 4. 用 finalComposer 作最后渲染
        finalComposer.render();

        requestAnimationFrame(animate);
      }
      // 将场景中除了辉光物体外的物体材质转成黑色
      function darkenNonBloomed(obj) {
        // layer的test方法是判断参数中的图层和自己的图层是否是同一个图层
        // 如果obj是几何体，且不在bloomLayer图层，说明不是辉光物体
        if ((obj.isMesh || obj.isSprite) && bloomLayer.test(obj.layers) === false) {
          // 如果是精灵几何体，需要转成黑色的精灵材质，做特殊处理
          if (obj.isSprite) {
            materimals[obj.uuid] = obj.material; // 在materimals变量中保存原先的材质信息
            obj.material = new THREE.SpriteMaterial({
              color: "#000",
            });
          // 其他几何体可以转成普通的黑色材质
          } else {
            materials[obj.uuid] = obj.material; // 在materimals变量中保存原先的材质信息
            obj.material = darkMaterial;
          }
        }
      }
      // 将场景中材质转成黑色的物体还原
      function restoreMaterial(obj) {
        if (materials[obj.uuid]) {
          obj.material = materials[obj.uuid]; // 还原材质
          delete materials[obj.uuid]; // 内存中删除
        }
      }
	  animate();
    </script>
  </body>
</html>
```
效果图：
![部分辉光](https://user-gold-cdn.xitu.io/2020/6/6/1728a1a9cf049545?w=567&h=679&f=png&s=67994)
## 加入抗锯齿
终于我们实现了部分辉光，不过细心的我们突然发现，加入BloomPass之后，物体的锯齿严重，即使我们在render中设置了antialias抗锯齿属性依然如此，所以这里我引入了另一个后期处理的通道FxaaPass
```js
// composer_fn.js
function createComposer() {
  const renderPass = new THREE.RenderPass(scene, camera); 

  const bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  const bloomPass = createUnrealBloomPass();
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  const finalComposer = new THREE.EffectComposer(renderer);
  const shaderPass = createShaderPass(bloomComposer);
  const FxaaPass = createFxaaPass(); // 我封装的创建 FxaaPass 的函数，详细见下
  finalComposer.addPass(renderPass);
  finalComposer.addPass(shaderPass);
  finalComposer.addPass(FxaaPass);
  
  return { bloomComposer, finalComposer };
}

// 抗锯齿，fxaa、smaa、ssaa都可以抗锯齿，抗锯齿效果依次减弱
function createFxaaPass() {
  let FxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  FxaaPass.material.uniforms["resolution"].value.x =
    1 / (window.innerWidth * pixelRatio);
  FxaaPass.material.uniforms["resolution"].value.y =
    1 / (window.innerHeight * pixelRatio);
  FxaaPass.renderToScreen = true;
  return FxaaPass;
}
```
在入口文件 index.html 引入新的依赖文件
```html
<!-- index.html -->
<script src="lib/FXAAShader.js"></script>
```
加了抗锯齿之后，整个画面平滑了很多
![抗锯齿](https://user-gold-cdn.xitu.io/2020/6/6/1728a1a9cf2c65b3?w=468&h=539&f=png&s=60407)
## 高级效果组合器 MaskPass
终于又解决了抗锯齿问题，总算可以歇口气了……等等，为什么精灵文字突然就变糊了，看来这样还不够，在我多番研究下，最终我想到了用 [高级效果组合器 MaskPass] 解决这个问题

MaskPass 是什么呢？简单来说，就是可以在**一个** EffectComposer 中进行Mask分组，每一组Mask使用**不同的通道**（也就是每一组 addPass 的内容不一样），并且每一组Mask可以渲染在**不同的Scene场景**上

实现原理：
1. 将没有糊掉的部分设为第一组Mask，采用原先的通道：加辉光、抗锯齿
2. 将糊掉的部分设为第二组Mask，采用新的通道：不做任何处理，直接渲染。这组中有精灵文字和辉光（辉光不需要加辉光和抗锯齿，相反如果放在上一组容易产生色差等意料外的bug，所以也放在不做任何处理这一组里）

下面是具体实现过程：
1. 创建好两个Scene，然后将不做任何处理、直接渲染的第二组Mask中的几何体，从Group分组中摘出来（之前每个Group分组都有一个精灵文字，辉光也放在第二组Group中），并加入到 normalScene 中，其余的保留在 scene 里
```js
// init_fn.js
function initThree(selector) {
  const scene = new THREE.Scene();
  const normalScene = new THREE.Scene(); // 创建两个scene
  const camera = ...;
  const renderer = ...;
  renderer.autoClear = false; // 这里注意！！需要手动清除，要使用高级效果组合器MaskPass，autoClear 必须设置为false
  document.querySelector(selector).appendChild(renderer.domElement);
  return { scene, normalScene, camera, renderer };
}
```
入口文件 index.html
```html
<!DOCTYPE html>
<html>
  <head>...</head>

  <body>
    <script src="..."></script>
    <script>
	  const { scene, normalScene, camera, renderer } = initThree("#canvas-frame");
	  // ...
	  let group1, group1Animate;
	  {
	    // ...
	  }
	  
	  let group2, group2Animate;
	  {
	    // ...
	  }

      // normalScene场景的内容
      let normalSceneAnimate;
      {
        const { sprite: spriteText1 } = await createSpriteText("#label1", {
          position: { x: -65, y: 23 },
        }); // 摘出来的原先 Group1 中的精灵文字
        const { sprite: spriteText2 } = await createSpriteText("#label2", {
          position: { x: 36, y: 23 },
        }); // 摘出来的原先Group2 中的精灵文字
        const beam = createLightBeam(100, 56, 2, "red", {
          scale: { z: 10 },
          rotation: { x: Math.PI / 2 },
          position: { x: -13, y: 3.9, z: -28 },
        }); // 摘出来的原先 Group2 中的光圈效果
       normalScene.add(spriteText1);
       normalScene.add(spriteText2);
       normalScene.add(beam); // 全部加入到 normalScene 中
       
       let direction = true;
       normalSceneAnimate = function () {
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
        };
      }
	  function animate() {
	    group1Animate();
        group2Animate();
        normalSceneAnimate();
         
        stats.update();
	    
	    // 渲染过程依然不变，变得只是 EffectComposer 的渲染分组 Mask
	    scene.traverse(darkenNonBloomed);
        bloomComposer.render();
        scene.traverse(restoreMaterial);
        finalComposer.render();
	    composer.render();
	    
	    requestAnimationFrame(animate);
	  }		
	  animate();
    </script>
  </body>
</html>
```
2. 修改 EffectComposer 的逻辑，利用 MaskPass 分组渲染
```js
// composer_fn.js
function createComposer() {
  const renderPass = new THREE.RenderPass(scene, camera); // 第一个分组的RenderPass
  const renderNormalPass = new THREE.RenderPass(normalScene, camera); // 第二个分组的RenderPass

  // 产生辉光，但是不渲染到屏幕上
  const bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  const bloomPass = createUnrealBloomPass();
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  // 利用 MaskPass 最终渲染到屏幕上
  const finalComposer = new THREE.EffectComposer(renderer);
  finalComposer.renderTarget1.stencilBuffer = true;
  finalComposer.renderTarget2.stencilBuffer = true; // 两个都设置为true，这一步不能省
  renderPass.clear = false;
  renderNormalPass.clear = false; // 这两句非常重要，RenderPass默认为false，如果这里是false，那么renderNormalPass 会清除掉上一个 RenderPass —— renderPass 的颜色
  finalComposer.addPass(renderPass);
  finalComposer.addPass(renderNormalPass);
  
  const clearMaskPass = new THREE.ClearMaskPass();
  // 第一组开始渲染
  const maskPass1 = new THREE.MaskPass(scene, camera);
  const shaderPass = createShaderPass(bloomComposer);
  const FxaaPass = createFxaaPass();
  finalComposer.addPass(maskPass1); // 添加第一组的maskPass
  finalComposer.addPass(shaderPass);
  finalComposer.addPass(FxaaPass);
  finalComposer.addPass(clearMaskPass); // 清除第一组的maskPass

  // 第二组开始渲染
  const maskPass2 = new THREE.MaskPass(normalScene, camera);
  finalComposer.addPass(maskPass2); // 添加第二组的maskPass
  finalComposer.addPass(clearMaskPass); // 添加第二组的maskPass

  const effectCopy = new THREE.ShaderPass(THREE.CopyShader);
  finalComposer.addPass(effectCopy); // 最后需要CopyShader，因为设置了手动清除
  return { bloomComposer, finalComposer };
}
```
最终效果：既有部分辉光效果，又有抗锯齿效果，还不会让部分物体变糊
![最终效果](https://user-gold-cdn.xitu.io/2020/6/6/1728a1a9cf3bc12f?w=985&h=341&f=png&s=74577)
需要特别注意的几点：
1. renderer 的 autoClear 设为 false
2. EffectComposer 的 renderTarget2.stencilBuffer 设为true
3. RenderPass 的 clear 设为 false
4. 因为设置了手动Clear，所以最后需要 addPass 一个 CopyShader