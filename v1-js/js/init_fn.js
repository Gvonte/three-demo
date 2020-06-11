// init_fn.js
// 初始化三大件：场景、相机、渲染器
function initThree(selector) {
  // 设置两个场景 scene 和 normalScene，scene 用来渲染需要加入辉光然后抗锯齿的场景，而 normalScene 不作任何处理，例如精灵文字，如果被抗锯齿处理会变模糊，所以不能做任何处理
  const scene = new THREE.Scene();
  const normalScene = new THREE.Scene();

  // 设置背景图，三种类型：
  // 1. 普通背景图
  // 20, 37, 59
  scene.background = new THREE.Color("rgb(25, 35, 39)");
  // scene.background = new THREE.TextureLoader().load('img/back.jpg');

  // 2. 立方体背景图
  // scene.background = new THREE.CubeTextureLoader().setPath('img/').load(new Array(6).fill('back.jpg'));

  // 3. 球型全景(背景)图，通过建立球体，并放大100倍实现，其中x放大倍数为负数
  // var geometry = new THREE.SphereGeometry(5, 32, 32);
  // var material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("img/back.jfif") });
  // var sphere = new THREE.Mesh(geometry, material);
  // scene.add(sphere);
  // geometry.scale(- 100, 100, 100);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-20, 40, 90);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha：背景透明，antialias：抗锯齿
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false; // 要使用高级效果组合器MaskPass，必须设置为false
  document.querySelector(selector).appendChild(renderer.domElement);

  // renderer.shadowMap.enabled = true; // 同意产生阴影，必须要有这个前提
  /**
   * 产生阴影4步：
   *  1. render 的 .shadowMap.enabled 设为 true，表示同意渲染器能产生阴影
   *  2. light 的 castShadow 设为 true，表示光源能产生阴影
   *  3. mesh 的 castShadow 设为 true，表示该物体能产生阴影
   *  4. 平面（物体） 的 receiveShadow 设为 true，表示该物体（一般是平面）能接受阴影
   */

  return { scene, normalScene, camera, renderer };
}
// 设置灯光
function initLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff); // 自然光，每个几何体的每个面都有光
  const pointLight = new THREE.PointLight(0xff0000, 10); // 点光源
  pointLight.position.set(0, 50, 0);
  // pointLight.castShadow = true; // 使光源能产生阴影
  scene.add(ambientLight);
  scene.add(pointLight);
  return [ambientLight, pointLight];
}
// 添加控制器
function initControls() {
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', function () { });
  return controls;
}
function initStats() {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  return stats;
}
