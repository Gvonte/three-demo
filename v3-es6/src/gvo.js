// 引用文件
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  AmbientLight,
  PointLight,
} from "./lib/three.module";
import { OrbitControls } from "./lib/OrbitControls";
import Stats from "./lib/stats.module";

class Gvo {
  constructor(selector, ThreeOption, lightOption) {
    this.initThree(selector, ThreeOption); // 默认自动初始化
    this.initLight(lightOption); // 默认自动初始化
    this.customInit(); // 用户自定义初始化
    this.initControls(); // 默认自动初始化
    this.initStats(); // 默认自动初始化
  }
  customInit() {
    this.normalScene = new Scene(); // 增添一个新的场景用来做部分辉光效果
    this.scene.background = new Color("rgb(25, 35,  39)");
    // this.scene.background = new Color("rgb(255, 255,  255)");
    this.camera.position.set(-20, 40, 90);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false; // 要使用高级效果组合器MaskPass，必须设置为false
    // this.pointLight = new PointLight(0xff0000, 10); // 点光源
    // this.pointLight.position.set(0, 50, 0);
    // this.scene.add(this.pointLight);
  }
  // 初始化三大件：场景、相机、渲染器
  initThree(selector, { cameraOption, rendererOption } = {}) {
    this.scene = new Scene();
    if (cameraOption && Array.isArray(cameraOption)) {
      this.camera = new PerspectiveCamera(...cameraOption);
    } else {
      this.camera = new PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
    }
    this.renderer = new WebGLRenderer(rendererOption);
    document.querySelector(selector).appendChild(this.renderer.domElement);
  }
  // 设置灯光
  initLight(lightOption = 0xffffff) {
    this.ambientLight = new AmbientLight(lightOption); // 自然光，每个几何体的每个面都有光
    this.scene.add(this.ambientLight);
  }
  // 添加控制器
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  // 添加fps
  initStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }
}

export default Gvo;
