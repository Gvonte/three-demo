const { MeshBasicMaterial, TextureLoader } = require('../lib/three.module');
module.exports = (Gvo) => {
    Gvo.BlackBasicMaterial = new MeshBasicMaterial({ color: "black" });
    Gvo.TextureLoader = new TextureLoader();
};