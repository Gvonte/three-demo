// composer_fn.js
// 后期处理，效果合成器
function createComposer() {
  const renderPass = new THREE.RenderPass(scene, camera);
  const renderNormalPass = new THREE.RenderPass(normalScene, camera);

  // 产生辉光，但是不渲染到屏幕上
  const bloomComposer = new THREE.EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  const bloomPass = createUnrealBloomPass();
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  // 利用 MaskPass 最终渲染到屏幕上
  const finalComposer = new THREE.EffectComposer(renderer);
  finalComposer.renderTarget1.stencilBuffer = true;
  finalComposer.renderTarget2.stencilBuffer = true; // 两个都设置为true
  renderPass.clear = false;
  renderNormalPass.clear = false; //非常重要，否则 renderNormalPass 会清除掉上一个 RenderPass —— renderPass 的颜色
  finalComposer.addPass(renderPass);
  finalComposer.addPass(renderNormalPass);

  const clearMaskPass = new THREE.ClearMaskPass();
  const maskPass1 = new THREE.MaskPass(scene, camera);
  const shaderPass = createShaderPass(bloomComposer);
  const FxaaPass = createFxaaPass();
  finalComposer.addPass(maskPass1);
  finalComposer.addPass(shaderPass);
  finalComposer.addPass(FxaaPass);
  finalComposer.addPass(clearMaskPass);

  const maskPass2 = new THREE.MaskPass(normalScene, camera);
  finalComposer.addPass(maskPass2);
  finalComposer.addPass(clearMaskPass);

  const effectCopy = new THREE.ShaderPass(THREE.CopyShader);
  finalComposer.addPass(effectCopy);
  return { bloomComposer, finalComposer };
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
    bloomStrength: 0.5, //5
    bloomRadius: 0,
  };
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;
  return bloomPass;
}
// ShaderPass，着色器pass
function createShaderPass(bloomComposer) {
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture },
    },
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
    defines: {},
  });
  const shaderPass = new THREE.ShaderPass(shaderMaterial, "baseTexture");
  shaderPass.needsSwap = true;
  return shaderPass;
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
