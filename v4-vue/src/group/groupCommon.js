// scene场景的公共内容
export default (gvonte) => {
  const earth = gvonte.createEarth({ position: { x: -15, y: -1 } });
  // 这里注意路径的填写：打包后是 main.js 和 assets 文件夹在同一目录下，所以引用时要用 './'
  // 这里用 '../' 也可以的原因是，ThreeJS内部加载路径时用了寻址的方法
  const machine = gvonte.createMachine('./images/3d/move.png', {
    position: { x: 15, z: -20, y: -5 },
  });
  gvonte.groupCommon = { earth, machine };
};
