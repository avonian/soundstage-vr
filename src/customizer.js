export class Customizer {
  constructor (world) {
    this.world = world;
    this.scene = world.scene;
    this.eventConfig = world.eventConfig;
    this.userSettings = world.userSettings;
  }
  init () {
    if(this.eventConfig.posters) {
      this.posters();
    }
    if(this.userSettings.graphicsQuality === 'high') {
      this.barLights();
    }
  }
  posters () {
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
  barLights() {
    if (this.scene.getLightByName("PointLight")) {
      this.scene.getLightByName("PointLight").dispose(); // dispose currently non-used light from world.js
      console.log("PointLight disposed");
    }
    let barLight = new BABYLON.SpotLight("barLight", new BABYLON.Vector3(1.2, 1.7, -6.13),
      new BABYLON.Vector3(0.1, -1, 0),BABYLON.Tools.ToRadians(45), 1, this.scene);
    barLight.intensity = 25;
    barLight.angle = BABYLON.Tools.ToRadians(120);
    barLight.diffuse = BABYLON.Color3.Purple();
    barLight.range = 10;

//  This part later may become a function with lights settings in JSON
    let tealLight = barLight.clone("tealLight");
    barLight.intensity = 40;
    tealLight.position.x = -0.6;
    tealLight.direction.x = 0.32;
    tealLight.direction.z = -0.1;
    tealLight.diffuse = BABYLON.Color3.Teal();

    let blueLight = barLight.clone("blueLight");
    blueLight.position.x = 3.25;
    blueLight.diffuse = BABYLON.Color3.Blue();

    let barBackLight = barLight.clone("barBackLight");
    barBackLight.position.x = 1;
    barBackLight.position.y = 2;
    barBackLight.position.z = -7;
    barBackLight.direction.x = 1;
    barBackLight.direction.z = -1;
    barBackLight.angle = BABYLON.Tools.ToRadians(72);
    barBackLight.diffuse = new BABYLON.Color3(91, 0, 255);
    barBackLight.intensity = 2;

    console.log("Lights: ", this.scene.lights);
    // since customizer loads before the model and its meshes, we cannot use here light.includedOnlyMeshes
    // Press '4' to see it in action at world.js
  }
}

export default Customizer;