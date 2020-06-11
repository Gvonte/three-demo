// normalScene场景的内容
const TWEEN = require('../lib/tween.cjs')

module.exports = async (gvonte) => {
    const { sprite: spriteText1 } = await gvonte.createSpriteText("#label1", {
        position: { x: -65, y: 23 },
    });
    const { sprite: spriteText2 } = await gvonte.createSpriteText("#label2", {
        position: { x: 36, y: 23 },
    });
    const beam = gvonte.createLightBeam(100, 56, 2, "red", {
        scale: { z: 10 },
        rotation: { x: Math.PI / 2 },
        position: { x: -13, y: 3.9, z: -28 },
    });
    const normalSceneGroup = gvonte.createGroup(
        spriteText1,
        spriteText2,
        beam
    );

    const tween1 = new TWEEN.Tween(beam.material[1])
        .to({ opacity: 0 }, 1000)
        .onComplete(() => {
            tween2.start();
        });
    const tween2 = new TWEEN.Tween(beam.material[1])
        .to({ opacity: 1 }, 1000)
        .onComplete(() => {
            tween1.start();
        });
    tween1.start();
    const normalSceneGroupAnimate = function () {
        TWEEN.update();
    };
    gvonte.normalSceneGroup = normalSceneGroup;
    gvonte.normalSceneGroupAnimate = normalSceneGroupAnimate;
    return { normalSceneGroup, normalSceneGroupAnimate }
}