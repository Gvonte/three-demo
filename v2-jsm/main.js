const Gvo = require('./src/gvo'); // 引入 Gvo 这个类
require('./src/js/common')(Gvo); // 扩展 Gvo 类的属性
require('./src/js/create')(Gvo); // 扩展 Gvo 类的方法 

const groupCommonFn = require('./src/group/groupCommon'); // 分组间公用的部分
const sceneGroup1Fn = require('./src/group/sceneGroup1'); // 第一个分组
const sceneGroup2Fn = require('./src/group/sceneGroup2'); // 第二个分组
const normalSceneGroupFn = require('./src/group/normalSceneGroup'); // 第三个分组，另一个场景 normalScene 的内容

const { createComposer, darkenNonBloomed, restoreMaterial } = require('./src/composer/composer'); // 后期处理函数

const gvonte = new Gvo("#canvas-frame", {
    rendererOption: {
        alpha: true,
        antialias: true
    }
}); // 新建 Gvo 类的实例

groupCommonFn(gvonte); // 初始化分组间公用的部分
(async function () {
    const { sceneGroup1, sceneGroup1Animate } = await sceneGroup1Fn(gvonte); // 新建第一个分组
    const { sceneGroup2, sceneGroup2Animate } = await sceneGroup2Fn(gvonte); // 新建第二个分组
    const { normalSceneGroup, normalSceneGroupAnimate } = await normalSceneGroupFn(gvonte); // 新建第三个分组
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
        gvonte.scene.traverse(darkenNonBloomed(bloomLayer, materials, Gvo.BlackBasicMaterial));
        bloomComposer.render();
        gvonte.scene.traverse(restoreMaterial(materials));
    }
    readyToBloom();
    gvonte.controls.addEventListener("change", readyToBloom);

    function animate() {
        // 管道运动，路线循环流动效果
        sceneGroup1Animate();
        sceneGroup2Animate();
        normalSceneGroupAnimate();

        // fps监控
        gvonte.stats.update();

        // gvonte.renderer.render(gvonte.scene, gvonte.camera);
        finalComposer.render();
        requestAnimationFrame(animate);
    }
    animate();
})();