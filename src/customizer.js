export class Customizer {
  constructor (world) {
    this.world = world;
    this.eventConfig = world.eventConfig;
    this.barLights = [];
    this.initPosters();
  }
  initPosters () {
    const posters = this.eventConfig.posters;
    let posterGallery = new BABYLON.TransformNode("posterGallery");
    for (let i = 0; i < posters.length; i++) {
      if (!this.world.scene.getMeshByName(posters[i].name)) {
        let galleryPosterFileExtension = posters[i].url.slice((posters[i].url.lastIndexOf(".") - 1 >>> 0) + 2);
        let galleryPoster = BABYLON.MeshBuilder.CreatePlane(posters[i].name, { width: posters[i].width, height: posters[i].height });
        galleryPoster.position.x = posters[i].posX;
        galleryPoster.position.y = posters[i].posY;
        galleryPoster.position.z = posters[i].posZ;
        galleryPoster.rotation.y = BABYLON.Tools.ToRadians(posters[i].rotationY);
        galleryPoster.material = new BABYLON.StandardMaterial(posters[i].name + "_mat", this.world.scene);
        // Check for images
        if (galleryPosterFileExtension === 'png' || galleryPosterFileExtension === 'jpg') {
          galleryPoster.material.emissiveTexture = new BABYLON.Texture(posters[i].url, this.world.scene);
          galleryPoster.material.emissiveTexture.name = "PosterImage-" + posters[i].name;
        } 
        // Check for videos
        if (galleryPosterFileExtension === 'mp4') {
          console.log("VIDEO POSTER!");
          let videoTexture = new BABYLON.VideoTexture("posterVideoTexture-"+i,
            posters[i].url,
            this.scene, true, true, null, {
            autoUpdateTexture: true,
            autoPlay: true,
            muted: true,
            loop: true
          });
          videoTexture.vScale = -1;  // otherwise it is flipped vertically
          galleryPoster.material.emissiveTexture = videoTexture;
        } 
        galleryPoster.parent = posterGallery;
      }
    }
  }
  initDJSpotLight() {
    if(this.DJSpotLight) {
      this.DJSpotLight.dispose();
    }
    if(this.world.userSettings.graphicsQuality !== 'medium' && this.world.userSettings.graphicsQuality !== 'high') {
      return;
    }
    // Making the light over DJ table
    this.DJSpotLight = new BABYLON.SpotLight("DJSpotLight", new BABYLON.Vector3(2, 2, 4.2),
      new BABYLON.Vector3(0.1, -1, 0), BABYLON.Tools.ToRadians(300), 1, this.scene);
    this.DJSpotLight.intensity = 0;
    this.DJSpotLight.angle = BABYLON.Tools.ToRadians(300);
    this.DJSpotLight.diffuse = new BABYLON.Color3(80,30, 50)
    this.DJSpotLight.range = 20;
  }
  initBarLights () {
    if(this.barLights) {
      this.barLights.forEach((light) => {
        light.dispose()
      });
    }
    if(this.world.userSettings.graphicsQuality !== 'high') {
      return;
    }
    if (this.world.scene.getLightByName("PointLight")) {
      this.world.scene.getLightByName("PointLight").dispose(); // dispose currently non-used light from world.js
      console.log("PointLight disposed");
    }
    let barLight = new BABYLON.SpotLight("barLight", new BABYLON.Vector3(1.2, 1.7, -6.13),
      new BABYLON.Vector3(0.1, -1, 0),BABYLON.Tools.ToRadians(45), 1, this.world.scene);
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

    this.barLights = [barLight, tealLight, blueLight, barBackLight];

    console.log("Lights: ", this.world.scene.lights);

  }
}

export default Customizer;