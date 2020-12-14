<template>
  <div id="app">
    <div id="canvas-frame" ref="canvasFrame"></div>
    <!-- 精灵文字模板 -->
    <div class="panel" id="label1">
      <div
        class="panel-heading"
        style="background-color: rgba(161, 89, 41, 0.8); color: white;"
      >
        专线网络接入区
      </div>
      <div
        class="panel-body"
        style="background-color: rgba(72, 58, 46, 0.8); color: white;"
      >
        <p>区域机器总数：100</p>
        <p>高风险漏洞机器总数：10</p>
        <p>高风险漏洞机器占比：10%</p>
      </div>
    </div>
    <div class="panel" id="label2">
      <div
        class="panel-heading"
        style="background-color: rgba(161, 89, 41, 0.8); color: white;"
      >
        移动网络接入区
      </div>
      <div
        class="panel-body"
        style="background-color: rgba(72, 58, 46, 0.8); color: white;"
      >
        <p>区域机器总数：59</p>
        <p>低风险漏洞机器总数：5</p>
        <p>低风险漏洞机器占比：8%</p>
      </div>
    </div>
    <!-- 着色器 -->
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
      void main() {
        gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
      }
    </script>
  </div>
</template>

<script>
import Gvo from "./gvo"; // 引入 Gvo 这个类
import commonFn from "./js/common"; // 扩展 Gvo 类的属性
import createFn from "./js/create"; // 扩展 Gvo 类的方法

import groupCommonFn from "./group/groupCommon"; // 分组间公用的部分
import sceneGroup1Fn from "./group/sceneGroup1"; // 第一个分组
import sceneGroup2Fn from "./group/sceneGroup2"; // 第二个分组
import normalSceneGroupFn from "./group/normalSceneGroup"; // 第三个分组，另一个场景 normalScene 的内容

import {
  createComposer,
  darkenNonBloomed,
  restoreMaterial,
} from "./composer/composer"; // 后期处理函数
import { log } from 'three';

export default {
  async mounted() {
    commonFn(Gvo);
    createFn(Gvo);

    const gvonte = new Gvo(this.$refs.canvasFrame, {
      rendererOption: {
        alpha: true,
        antialias: true,
      },
      cameraOption: [75, this.$refs.canvasFrame.clientWidth / this.$refs.canvasFrame.clientHeight, 0.1, 1000]
    }); // 新建 Gvo 类的实例

    groupCommonFn(gvonte); // 初始化分组间公用的部分
    
    const { sceneGroup1, sceneGroup1Animate } = await sceneGroup1Fn(gvonte); // 新建第一个分组
    const { sceneGroup2, sceneGroup2Animate } = await sceneGroup2Fn(gvonte); // 新建第二个分组
    const {
      normalSceneGroup,
      normalSceneGroupAnimate,
    } = await normalSceneGroupFn(gvonte); // 新建第三个分组
    gvonte.scene.add(sceneGroup1);
    gvonte.scene.add(sceneGroup2);
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
      gvonte.scene.traverse(
        darkenNonBloomed(bloomLayer, materials, Gvo.BlackBasicMaterial)
      );
      bloomComposer.render();
      gvonte.scene.traverse(restoreMaterial(materials));
    }
    // readyToBloom();
    // gvonte.controls.addEventListener("change", readyToBloom);

    function animate() {
      // 管道运动，路线循环流动效果
      sceneGroup1Animate();
      sceneGroup2Animate();
      normalSceneGroupAnimate();

      // fps监控
      gvonte.stats.update();

      // gvonte.renderer.render(gvonte.scene, gvonte.camera);
      readyToBloom();
      finalComposer.render();
      requestAnimationFrame(animate);
    }
    animate();

    // 模拟手势（接入手势控制）
    // 旋转模型
    setTimeout(() => {
      function mouseDrag(
        el,
        from = { x: 10, y: 10 },
        to = { x: 20, y: 10 },
        k = 4 // 速度系数k
      ) {
        // 鼠标点下事件
        const mousedownEvent = new MouseEvent("mousedown", {
          clientX: from.x,
          clientY: from.y,
        });
        // 鼠标抬起事件
        const mouseupEvent = new MouseEvent("mouseup", {
          clientX: to.x,
          clientY: to.y,
        });
        // 计算步长
        let stepX, stepY;
        if (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)) {
          stepX = k;
          stepY = ((to.y - from.y) * k) / (to.x - from.x);
        } else {
          stepX = ((to.x - from.x) * k) / (to.y - from.y);
          stepY = k;
        }
        let nowX = from.x;
        let nowY = from.y;
        function mouseMove() {
          nowX = nowX + stepX;
          nowY = nowY + stepY;
          const mouseEvent = new MouseEvent("mousemove", {
            clientX: nowX,
            clientY: nowY,
          });
          document.dispatchEvent(mouseEvent);
          if (nowX >= to.x && nowY >= to.y) {
            // 触发鼠标抬起事件
            document.dispatchEvent(mouseupEvent);
          } else {
            requestAnimationFrame(mouseMove);
          }
        }
        // 触发鼠标点下事件
        el.dispatchEvent(mousedownEvent);
        // 模仿鼠标移动
        requestAnimationFrame(mouseMove);
      }
      const from = { x: 10, y: 10 };
      const to = { x: 60, y: 160 };
      mouseDrag(document.getElementById("canvas-frame").firstChild, from, to);
    }, 2000);

    // 缩放模型
    setTimeout(() => {
      function scale(flag = true, k = 2) {
        // true缩小，false放大
        gvonte.camera.zoom += flag ? 0.001 * k : -0.001 * k;
        gvonte.camera.updateProjectionMatrix();
      }
      let flag = 100;
      function toBigger() {
        scale(false);
        flag--;
        if (flag) {
          requestAnimationFrame(toBigger);
        }
      }
      function toSmaller() {
        scale(true);
        flag--;
        if (flag) {
          requestAnimationFrame(toSmaller);
        }
      }
      requestAnimationFrame(toBigger);
      // requestAnimationFrame(toSmaller);
    }, 3000);
  },
};
</script>

<style scoped>
#app {
  margin: 0;
  font-family: "tencent";
}

#canvas-frame {
  border: none;
  /* background-color: #eeeeee; */
}

.panel {
  border: 0;
  width: 270px;
  text-indent: 20px;
}

@font-face {
  font-family: "tencent";
  src: url("~@/assets/fontFamily/simhei.ttf");
}
</style>
