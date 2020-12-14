// scene场景的第二组内容
export default async (gvonte) => {
  const { earth, machine } = gvonte.groupCommon;
  const earth1 = gvonte.createClone(earth, {
    position: { x: 0, z: -10, y: -1 },
  });
  const machine1 = gvonte.createClone(machine, {
    position: { x: 0, y: -5, z: 10 },
  });
  const machine2 = gvonte.createMachine('./images/3d/electronics.png', {
    position: { x: 26, y: -5 },
  });
  const machine3 = gvonte.createClone(machine2, {
    position: { x: 45, y: -5 },
  });
  const computer1 = await gvonte.createImportModel('./model/com/computer.gltf', {
    scale: { x: 150, y: 150, z: 150 },
    position: { x: 71, y: -6, z: 15 },
  });
  const computer2 = gvonte.createClone(computer1, {
    position: { z: -5 },
  });
  const { texture: tubeTexture1, mesh: tube1 } = await gvonte.createTube(
    [0, -5, 10],
    [15, -5, 0],
    [56, -5, 0],
    [71, -5, 10]
  );
  const { texture: tubeTexture2, mesh: tube2 } = await gvonte.createTube(
    [0, -5, -10],
    [15, -5, 0],
    [56, -5, 0],
    [71, -5, -10]
  );
  const face = gvonte.createFace(100, 56, 2, {
    rotation: { x: Math.PI / 2 },
    position: { x: -13, y: -6.1, z: -28 },
  });
  const text = await gvonte.createText('移动网络接入区', 'rgb(216, 120, 133)', {
    position: { x: 39, y: -3, z: 22 },
  });
  const sceneGroup2 = gvonte.createGroup(
    earth1,
    machine1,
    machine2,
    machine3,
    tube1,
    tube2,
    computer1,
    computer2,
    face,
    text
  );

  const sceneGroup2Animate = function () {
    tubeTexture1.offset.x -= 0.022;
    tubeTexture2.offset.x -= 0.02;
  };

  gvonte.sceneGroup2 = sceneGroup2;
  gvonte.sceneGroup2Animate = sceneGroup2Animate;
  return { sceneGroup2, sceneGroup2Animate };
};
