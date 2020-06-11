// scene场景的第一组内容
module.exports = async (gvonte) => {
    const { earth, machine } = gvonte.groupCommon;
    const earth1 = gvonte.createClone(earth, { position: { x: 15, y: -1 } });
    const machine1 = gvonte.createClone(machine, {
        position: { x: -15 },
    });
    const machine2 = gvonte.createClone(machine, {
        rotation: { x: Math.PI / 2 },
        position: { x: -15, y: -1, z: 15 },
    });
    const machine3 = gvonte.createClone(machine, {
        rotation: { x: Math.PI / 2 },
        position: { x: 15, y: -1, z: 15 },
    });
    const face = gvonte.createFace(50, 60, 4, {
        rotation: { x: Math.PI / 2 },
        position: { x: -25, y: -6.1, z: -30 },
    });
    const { texture: tubeTexture1, mesh: tube1 } = await gvonte.createTube(
        [-15, -5, 0],
        [15, -5, 0]
    );
    const { texture: tubeTexture2, mesh: tube2 } = await gvonte.createTube(
        [-15, -5, 15],
        [15, -5, 15]
    );
    const { texture: tubeTexture3, mesh: tube3 } = await gvonte.createTube(
        [-15, -5, -20],
        [15, -5, -20]
    );
    const { texture: tubeTexture4, mesh: tube4 } = await gvonte.createTube(
        [-15, -5, 15],
        [-15, -5, -40],
        [40, -5, -40],
        [40, -5, -10],
        [60, -5, -10]
    );
    const { texture: tubeTexture5, mesh: tube5 } = await gvonte.createTube(
        [15, -5, 15],
        [15, -5, -35],
        [30, -5, -35],
        [30, -5, 10],
        [60, -5, 10]
    );
    const text = await gvonte.createText(
        "专线网络接入区",
        "rgb(210, 178, 124)",
        {
            position: { y: -3, z: 25 },
        }
    );
    const sceneGroup1 = gvonte.createGroup(
        machine,
        machine1,
        earth,
        earth1,
        machine2,
        machine3,
        face,
        tube1,
        tube2,
        tube3,
        tube4,
        tube5,
        text
    );
    sceneGroup1.position.x = -60;

    const sceneGroup1Animate = function () {
        tubeTexture1.offset.x -= 0.022;
        tubeTexture2.offset.x -= 0.02;
        tubeTexture3.offset.x -= 0.019;
        tubeTexture4.offset.x -= 0.022;
        tubeTexture5.offset.x -= 0.02;
    };
    gvonte.sceneGroup1 = sceneGroup1;
    gvonte.sceneGroup1Animate = sceneGroup1Animate;
    return { sceneGroup1, sceneGroup1Animate }
};

