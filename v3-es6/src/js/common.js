import { MeshBasicMaterial, TextureLoader } from "../lib/three.module";

export default (Gvo) => {
  Gvo.BlackBasicMaterial = new MeshBasicMaterial({ color: "black" });
  Gvo.TextureLoader = new TextureLoader();
};
