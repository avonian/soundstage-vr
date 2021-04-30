import { VRSPACEUI } from './vrspace-babylon'

export class Customizer {
  constructor (world) {
    this.world = world;
    this.eventConfig = world.eventConfig;
    this.barLights = [];
    this.initPosters();
  }
  disposeVideoPosters() {
    let videoPosters = this.world.scene.meshes.filter(m => m.name.indexOf("videoPoster-") !== - 1);
    for(let videoPoster of videoPosters) {
      videoPoster.material.emissiveTexture.dispose();
      videoPoster.material.dispose();
      videoPoster.dispose();
    }
  }
  initPosters () {
    const posters = this.eventConfig.posters;
    let posterGallery = new BABYLON.TransformNode("posterGallery");
    let posterMeshes = [];
    this.world.scene.highlightLayer1 = new BABYLON.HighlightLayer("highlightLayer1", this.world.scene);
    for (let i = 0; i < posters.length; i++) {
      if (!this.world.scene.getMeshByName(posters[i].name)) {
        let galleryPoster = BABYLON.MeshBuilder.CreatePlane(posters[i].name, { width: posters[i].width, height: posters[i].height });
        galleryPoster.position.x = posters[i].posX;
        galleryPoster.position.y = posters[i].posY;
        galleryPoster.position.z = posters[i].posZ;
        galleryPoster.rotation.y = BABYLON.Tools.ToRadians(posters[i].rotationY);
        galleryPoster.material = new BABYLON.StandardMaterial(posters[i].name + "_mat", this.world.scene);
        galleryPoster.material.emissiveTexture = new BABYLON.Texture(posters[i].photo_url, this.world.scene);
        galleryPoster.material.emissiveTexture.name = "PosterImage-" + posters[i].name;
        if(posters[i].video_url) {
          galleryPoster.video_url = posters[i].video_url;
          if(posters[i].viewerOffset) {
            galleryPoster.viewerOffset = posters[i].viewerOffset;
          }
          /* If video found make actionable */
          galleryPoster.isPickable = true;
          galleryPoster.actionManager = new BABYLON.ActionManager(this.world.scene);
          galleryPoster.actionManager
            .registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
                  let pickedMesh = event.meshUnderPointer;
                  this.world.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
                })
            )
          galleryPoster.actionManager
            .registerAction(
              new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
                  let pickedMesh = event.meshUnderPointer;
                  this.world.scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
                })
            )
          galleryPoster.actionManager
          .registerAction(
            new BABYLON.ExecuteCodeAction(
              BABYLON.ActionManager.OnPickTrigger, (event) => {
                let pickedMesh = event.meshUnderPointer;
                var dest = new BABYLON.Vector3(pickedMesh.position.x, pickedMesh.position.y, pickedMesh.position.z);
                var pos = this.world.camera1.position.clone();
                var distance = dest.subtract(pos).length();
                if ( distance < 5 ) {
                  /* Construct video mesh */
                  let videoPoster = this.world.scene.getMeshByName("videoPoster-" + pickedMesh.name);
                  if(videoPoster) {
                    videoPoster.material.emissiveTexture.video.pause();
                    return;
                  }
                  videoPoster = pickedMesh.clone("videoPoster-" + pickedMesh.name);
                  videoPoster.material = new BABYLON.StandardMaterial(videoPoster.name + "_mat", this.world.scene);
                  let videoTexture = new BABYLON.VideoTexture(videoPoster.name + "_texture",
                    pickedMesh.video_url,
                    this.world.scene, true, true, null, {
                      autoUpdateTexture: true,
                      autoPlay: true,
                      muted: false,
                      loop: false
                    });
                  videoTexture.vScale = -1;  // otherwise it is flipped vertically
                  videoPoster.material.emissiveTexture = videoTexture;
                  videoTexture.video.addEventListener('play', (event) => {
                    event.target.volume = 0.2;
                    document.querySelector('#audioOutput').volume = 0;
                  });
                  videoTexture.video.addEventListener('pause', (event) => {
                    if(this.world.camera1.prevPosition) {
                      this.world.camera1.position = this.world.camera1.prevPosition;
                      this.world.camera1.rotation = this.world.camera1.prevRotation;
                      delete this.world.camera1.prevPosition;
                      delete this.world.camera1.prevRotation;
                    }
                    this.world.camera1.applyGravity = true;
                    this.disposeVideoPosters();
                    document.querySelector('#audioOutput').volume = 1;
                  });

                  this.world.camera1.prevPosition = this.world.camera1.position.clone();
                  this.world.camera1.prevRotation = this.world.camera1.rotation.clone();
                  if (!this.animateCamera) {
                    this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 1);
                  }
                  this.world.camera1.applyGravity = false;
                  dest.x -= pickedMesh.viewerOffset ? pickedMesh.viewerOffset : -3;

                  this.world.scene.onAfterCameraRenderObservable.add((event) => {
                    if(event._diffPosition._x > 0.001 || event._diffPosition._y > 0.001 || event._diffPosition._z > 0.001) {
                      videoTexture.video.pause();
                      this.world.scene.onAfterCameraRenderObservable.clear();
                    }
                  })

                  this.world.camera1.position = dest;
                  this.world.camera1.setTarget(new BABYLON.Vector3(pickedMesh.position.x, pickedMesh.position.y, pickedMesh.position.z));
                }
              }
            )
          )
        }
        galleryPoster.parent = posterGallery;
        posterMeshes.push(galleryPoster);
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
    // since customizer loads before the model and its meshes, we cannot use here light.includedOnlyMeshes
    // Press '4' to see it in action at world.js
  }
}

export default Customizer;