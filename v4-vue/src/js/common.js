import { MeshBasicMaterial, TextureLoader } from 'three';

export default (Gvo) => {
  Gvo.BlackBasicMaterial = new MeshBasicMaterial({ color: 'black' });
  Gvo.TextureLoader = new TextureLoader();
};
