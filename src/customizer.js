export class Customizer {
  constructor (world) {
    this.world = world;
    this.scene = world.scene;
    this.eventConfig = world.eventConfig;
    this.userSettings = world.userSettings;
  }
  init () {
    const posters = this.eventConfig.posters;
    let posterGallery = new BABYLON.TransformNode("posterGallery");
    for (let i = 0; i < posters.length; i++) {
      if (!this.scene.getMeshByName(posters[i].name)) {
        let galleryPoster = BABYLON.MeshBuilder.CreatePlane(posters[i].name, { width: posters[i].width, height: posters[i].height });
        galleryPoster.position.x = posters[i].posX;
        galleryPoster.position.y = posters[i].posY;
        galleryPoster.position.z = posters[i].posZ;
        galleryPoster.rotation.y = BABYLON.Tools.ToRadians(posters[i].rotationY);
        galleryPoster.material = new BABYLON.StandardMaterial(posters[i].name + "_mat", this.scene);
        galleryPoster.material.emissiveTexture = new BABYLON.Texture(posters[i].url, this.scene);
        galleryPoster.parent = posterGallery;
      }
    }
  }
}

export default Customizer;