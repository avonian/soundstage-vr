import { VRSPACEUI } from './vrspace-babylon'

export class Customizer {
  constructor (world) {
    this.world = world;
    this.world.scene.highlightLayer1 = new BABYLON.HighlightLayer("highlightLayer1", this.world.scene);
    this.eventConfig = world.eventConfig;
    this.barLights = [];
    this.clearCoatMeshes = false;
    this.initPosters();
  }
  initAfterLoad() {
    this.initVipDoor();
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
    if(!posters) {
      return;
    }
    let posterGallery = new BABYLON.TransformNode("posterGallery");
    let posterMeshes = [];
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
        galleryPoster.material.disableLighting = true
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
                  var dest = new BABYLON.Vector3(pickedMesh.position.x, pickedMesh.position.y, pickedMesh.position.z);
                  var pos = this.world.camera1.position.clone();
                  var distance = dest.subtract(pos).length();
                  if ( distance < 4 ) {
                    this.world.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
                  }
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

                // Only trigger poster viewing if user is close enough
                if ( distance < 4 ) {
                  // Construct video mesh
                  let videoPoster = this.world.scene.getMeshByName("videoPoster-" + pickedMesh.name);
                  if(videoPoster) {
                    videoPoster.material.emissiveTexture.video.pause();
                    return;
                  }
                  // Switch user to camera1
                  let vue = document.querySelector("#app")._vnode.component;
                  let cameraMode = vue.data.cameraModes[0];
                  vue.data.cameraMode = cameraMode;
                  vue.data.world.activateCamera(cameraMode[0]);

                  videoPoster = pickedMesh.clone("videoPoster-" + pickedMesh.name);
                  videoPoster.material = new BABYLON.StandardMaterial(videoPoster.name + "_mat", this.world.scene);
                  videoPoster.material.disableLighting = true;
                  let videoTexture = new BABYLON.VideoTexture(videoPoster.name + "_texture",
                    pickedMesh.video_url,
                    this.world.scene, true, true, null, {
                      autoUpdateTexture: true,
                      autoPlay: false,
                      muted: false,
                      loop: false
                    });
                  videoTexture.vScale = -1;  // otherwise it is flipped vertically
                  videoPoster.material.emissiveTexture = videoTexture;

                  // Play listener
                  videoTexture.video.addEventListener('play', (event) => {
                    event.target.volume = 0.2;
                    document.querySelector('#audioOutput').volume = 0.2;
                  });

                  // Pause listener
                  videoTexture.video.addEventListener('pause', (event) => {
                    // Pause fires automatically on first play so if time = 0 don't do anything
                    if (event.target.currentTime === 0) {
                      return;
                    }
                    if (this.world.camera1.returnPosition) {
                      if (!this.animateCamera) {
                        this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 1);
                      }
                      VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), this.world.camera1.returnPosition);
                      this.world.camera1LookAt = this.world.camera1.returnCameraTarget.position;
                      setTimeout(() => {
                        this.world.viewingMedia = false;
                        this.world.viewingMediaMesh = false;
                        this.world.camera1LookAt = false;
                        delete this.world.camera1.returnPosition;
                        delete this.world.camera1.returnCameraTarget;
                      }, 1500)
                    }
                    this.world.camera1.applyGravity = true;
                    this.disposeVideoPosters();
                    document.querySelector('#audioOutput').volume = 1;
                  });

                  // Save original camera position so we can return the user to it later
                  this.world.camera1.returnPosition = this.world.camera1.position.clone();
                  this.world.camera1.returnCameraTarget = pickedMesh;
                  if (!this.animateCamera) {
                    this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 1);
                  }
                  this.world.camera1.applyGravity = false;

                  // Decide where to 'place' the viewer
                  if(pickedMesh.rotation._y === -1.5707963267948966) {
                    dest.x += pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                  } else if(pickedMesh.rotation._y === 1.5707963267948966) {
                    dest.x -= pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                  } else if(pickedMesh.rotation._y === 3.141592653589793) {
                    dest.z += pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                  } else {
                    return;
                  }

                  // Lock target onto poster and aAnimate the camera
                  VRSPACEUI.updateAnimation(this.animateCamera, pos, dest);
                  this.world.viewingMedia = true;
                  this.world.viewingMediaMesh = videoPoster;
                  this.world.camera1LookAt = pickedMesh.position;

                  setTimeout(() => {
                    // Start playing video
                    this.world.camera1LookAt = false;
                    videoTexture.video.play();
                  }, 1500)
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
    if(this.world.userSettings.graphicsQuality === 'very-low' || this.world.userSettings.graphicsQuality === 'low' ) {
      return;
    }
    // Making the light over DJ table
    this.DJSpotLight = new BABYLON.SpotLight("DJSpotLight", new BABYLON.Vector3(2, 2, 4.2),
      new BABYLON.Vector3(0.1, -1, 0), BABYLON.Tools.ToRadians(300), 1, this.scene);
    this.DJSpotLight.intensity = 0;
    let DJSpotLightMeshestoInclude = this.world.scene.meshes.filter(m => {
      if(m.name.indexOf("Cube") !== -1 || m.name.indexOf("Pedestal.002") !== -1 || m.name.indexOf("DJ_Table") !== -1 || m.name.indexOf("Sampler_") !== -1 || m.name.indexOf("Mixer800") !== -1 || m.name.indexOf("Player.") !== -1) {
        return m;
      }
      return false;
    });
    this.DJSpotLight.includedOnlyMeshes = DJSpotLightMeshestoInclude;
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
    if(this.world.userSettings.graphicsQuality !== 'medium' &&   this.world.userSettings.graphicsQuality !== 'high' && this.world.userSettings.graphicsQuality !== 'ultra-high') {
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
  initClearCoat() {
    if(!this.clearCoatMeshes) {
      this.clearCoatMeshes = [
        'Bar_counter.001_Bar_counter.001_Base_2_15346',
        'Chair_Chair_Red_15380',
        'Chair_(1)_Chair.001_Red_15380',
        'Chair_(2)_Chair.003_Red_15380',
        'Chair_(3)_Chair.002_Red_15380',
        'Chair_(2)_Chair.003_Red_15380.2',
        'Chair_(2)_Chair.003_Red_15380.1',
        'Lamp_Lamp.001_Base_2_15346',
        'Lamp_(1)_Lamp_Base_2_15346',
        'Lamp_(3)_Lamp.004_Base_2_15346',
        'Lamp_(2)_Lamp.008_Base_2_15346',
        'Pedestal_Pedestal_Blue_15390',
        'Pedestal_Pedestal_Blue_15390',
        'Fencing_Fencing_Base_15926',
        'Room_Room_Base_15926',
        'Room_Room_Base_15926.1',
        'DJ_Table_DJ_Table_table_15810',
        'Cube',
        'Cube.1',
        'Cube.3',
        'Cube.4',
        'PosterVIPR'
      ].map(m => this.world.scene.getMeshByName(m));
    }
    this.clearCoatMeshes.forEach(mesh => { if(mesh) { mesh.material.clearCoat.isEnabled = this.world.userSettings.graphicsQuality === 'ultra-high' } })
    // Always clear coat VIP room
    this.world.scene.getMeshByName('Cube.5').material.clearCoat.isEnabled = true;
    this.world.scene.getMeshByName('Cube.6').material.clearCoat.isEnabled = true;
  }
  initVipDoor() {
    let doorMesh = this.world.scene.getMeshByName('Cube.5');
    var doorPosition = {"x":"5.91","y":"-1.92","z":"34.69"}
    doorMesh.isPickable = true;
    doorMesh.actionManager = new BABYLON.ActionManager(this.world.scene);
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.world.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if ( distance < 4 ) {
              this.world.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
            }
          })
      )
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            this.world.scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
          })
      )
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (event) => {
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.world.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if ( distance < 4 ) {
              document.querySelector("#app")._vnode.component.data.modal = {
                title: "Exit VIP room?",
                body: "<p class='mb-4'>You are about to exit the VIP room.</p><p class='mb-4'>To return here later you will need reload the web page.</p><p class='mb-4'>Do you want to continue?</p>",
                confirmCallback: () => {
                  this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 100);
                  VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), new BABYLON.Vector3(11, this.world.videoAvatarSize*2+this.world.avatarHeight, -7));
                  setTimeout(() => {
                    this.world.camera1.setTarget(new BABYLON.Vector3(0,3,0));
                    this.animateCamera = false;
                  }, 100);
                  document.querySelector("#app")._vnode.component.data.modal = false;
                }
              }
            }
          })
      )
  }
}

export default Customizer;