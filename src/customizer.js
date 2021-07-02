import { VRSPACEUI } from './vrspace/index-min'
import Utilities from './utilities'

export class Customizer {
  constructor (world) {
    this.world = world;
    this.world.scene.highlightLayer1 = new BABYLON.HighlightLayer("highlightLayer1", this.world.scene);
    this.spaceConfig = world.spaceConfig;
    this.barLights = [];
    this.clearCoatMeshes = false;
    this.loadedAssets = [];
    this.initPosters();
  }
  initAfterLoad() {
    return;
    this.initVipEntrance();
    this.initVipExit();

    // Reposition some furniture
    this.world.scene.getMeshByName('Sofa.001_Sofa.001_Base_2_15346').position.x = 0.34;
    this.world.scene.getMeshByName('Sofa.001_Sofa.001_Emission_2_15348').position.x = 0.34;
    this.world.scene.getMeshByName('Table_Table.003_Base_2_15346').position.x = 0.37;
    this.world.scene.getMeshByName('Table_Table.003_Emission_2_15348').position.x = 0.37;
    this.world.scene.getMeshByName('Armchair_Armchair.006_Blue_15390').position.x = 0.3;
    this.world.scene.getMeshByName('Armchair_Armchair.006_Emission_15392').position.x = 0.3;
    this.world.scene.getMeshByName('Armchair_Armchair.006_Blue_15390').position.z = 2;
    this.world.scene.getMeshByName('Armchair_Armchair.006_Emission_15392').position.z = 2;
  }
  disposeVideoPosters() {
    let videoPosters = this.world.scene.meshes.filter(m => m.name.indexOf("videoPoster-") !== - 1);
    for(let videoPoster of videoPosters) {
      videoPoster.dispose();
    }
  }
  initPosters () {
    const posters = this.spaceConfig.posters;
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
                  if ( distance < 4 && !this.world.viewingMediaMesh ) {
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
                BABYLON.ActionManager.OnPickTrigger, async (event) => {
                  let pickedMesh = event.meshUnderPointer;
                  var dest = new BABYLON.Vector3(pickedMesh.position.x, pickedMesh.position.y, pickedMesh.position.z);
                  var pos = this.world.camera1.position.clone();
                  var distance = dest.subtract(pos).length();

                  // Only trigger poster viewing if user is close enough
                  if ( distance < 4 && !this.world.viewingMediaMesh ) {

                    var videoPosterName = "videoPoster-" + pickedMesh.name;
                    // Construct video mesh
                    let videoPoster = this.world.scene.getMeshByName(videoPosterName);
                    if(videoPoster) {
                      videoPoster.material.emissiveTexture.video.pause();
                      return;
                    }

                    videoPoster = pickedMesh.clone(videoPosterName);
                    videoPoster.renderOverlay = true;
                    videoPoster.overlayColor = new BABYLON.Color3(0,0,0);

                    // Switch user to camera1
                    let vue = document.querySelector("#app")._vnode.component;
                    let cameraMode = vue.data.cameraModes[0];
                    vue.data.cameraMode = cameraMode;
                    vue.data.world.activateCamera(cameraMode[0]);

                    // Save original camera position so we can return the user to it later
                    this.world.camera1.returnPosition = this.world.camera1.position.clone();
                    this.world.camera1.returnCameraTarget = pickedMesh;
                    if (!this.animateCamera) {
                      this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 1);
                    }
                    this.world.camera1.applyGravity = false;

                    // Construct 'loading' mesh
                    if(!this.loadingPoster) {
                      this.loadingPoster = BABYLON.MeshBuilder.CreatePlane("loadingPoster", {
                        width: 0.45,
                        height: 0.33
                      });
                      this.loadingPoster.material = new BABYLON.StandardMaterial("loadingPoster_mat", this.world.scene);
                      this.loadingPoster.material.emissiveTexture = new BABYLON.Texture('/assets/loadingPoster.png', this.world.scene);
                      this.loadingPoster.material.hasAlpha = true;
                      this.loadingPoster.material.emissiveTexture.name = "loadingPoster_image";
                      this.loadingPoster.material.disableLighting = true
                    } else {
                      this.loadingPoster.isVisible = true;
                    }

                    // Decide where to place the viewer and loading mesh
                    this.loadingPoster.position.x = pickedMesh.position.x;
                    this.loadingPoster.position.y = pickedMesh.position.y;
                    this.loadingPoster.position.z = pickedMesh.position.z + .01;
                    this.loadingPoster.rotation.y = pickedMesh.rotation.y;
                    if(pickedMesh.rotation._y === -1.5707963267948966) {
                      dest.x += pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                      this.loadingPoster.position.x += .01;
                    } else if(pickedMesh.rotation._y === 1.5707963267948966) {
                      dest.x -= pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                      this.loadingPoster.position.x -= .01;
                    } else if(pickedMesh.rotation._y === 3.141592653589793) {
                      dest.z += pickedMesh.viewerOffset ? pickedMesh.viewerOffset : 3;
                      this.loadingPoster.position.z += .01;
                    } else {
                      return;
                    }

                    // Lock target onto poster and animate the camera
                    VRSPACEUI.updateAnimation(this.animateCamera, pos, dest);
                    this.world.camera1LookAt = pickedMesh.position;
                    this.world.movement.disableKeys();
                    this.world.viewingMediaMesh = videoPoster;

                    setTimeout(() => {
                      // Start playing video
                      this.world.camera1LookAt = false;
                      this.toggleShowcasePanel(pickedMesh.id);
                      this.toggleShowcaseMessage(pickedMesh.id);
                      Utilities.showHideUI();
                      this.world.viewingMedia = true; // need this here so user can't "escape" prematurely which would break things

                      // Start loading/playing
                      this.loadAndPlay(pickedMesh, videoPoster);

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
  async loadAndPlay(pickedMesh, videoPoster) {
    // Preload the video
    var blob_url;

    var cachedVideo = this.loadedAssets.find(f => f.video_url === pickedMesh.video_url);
    if(!cachedVideo) {
      blob_url = await Utilities.preloadVideo({
        url: pickedMesh.video_url
      });
      this.loadedAssets.push({
        video_url: pickedMesh.video_url,
        blob_url: blob_url
      })
    } else {
      blob_url = cachedVideo.blob_url;
    }

    // If user canceled while waiting for preloading to complete, return
    if(this.world.viewingMedia === false) {
      return;
    }

    // Remove loading
    videoPoster.renderOverlay = false;
    this.loadingPoster.isVisible = false;

    videoPoster.material = new BABYLON.StandardMaterial(videoPoster.name + "_mat", this.world.scene);
    videoPoster.material.disableLighting = true;

    let videoTexture = new BABYLON.VideoTexture(videoPoster.name + "_texture",
      blob_url,
      this.world.scene, true, true, null, {
        autoUpdateTexture: true,
        autoPlay: true,
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
    videoTexture.video.addEventListener('pause', this.returnToStartingPosition.bind(this));
  }
  returnToStartingPosition(event) {
    document.getElementById('renderCanvas').focus();
    // Pause fires automatically on first play so if time = 0 don't do anything
    if (event && event.target.currentTime === 0) {
      debugger;
      return;
    }
    if(Utilities.preloadRequest) {
      Utilities.preloadRequest.abort();
    }
    if (this.world.camera1.returnPosition) {
      if (!this.animateCamera) {
        this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 1);
      }
      VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), this.world.camera1.returnPosition);
      this.world.camera1LookAt = this.world.camera1.returnCameraTarget.position;
      this.toggleShowcasePanel(this.world.viewingMediaMesh.id);
      this.toggleShowcaseMessage(this.world.viewingMediaMesh.id);
      setTimeout(() => {
        this.world.camera1.applyGravity = true;
        this.world.viewingMedia = false;
        this.world.viewingMediaMesh = false;
        this.world.camera1LookAt = false;
        this.world.movement.enableKeys();
        delete this.world.camera1.returnPosition;
        delete this.world.camera1.returnCameraTarget;
      }, 1500)
    }
    Utilities.showHideUI(false);
    this.loadingPoster.isVisible = false;
    this.disposeVideoPosters();
    document.querySelector('#audioOutput').volume = 1;
  }
  toggleShowcasePanel(pickedMeshId) {
    let open = !document.querySelector("#showcase-panel").classList.contains('translate-x-full');
    let poster = this.spaceConfig.posters.find(p => pickedMeshId === p.name);
    if(poster && poster.showcase && !open) {
      document.querySelector("#showcase-panel").classList.remove('translate-x-full');
      let data = poster.showcase;
      document.querySelector("#showcase-title").innerHTML = data.title;
      document.querySelector("#showcase-author").innerHTML = data.author;
      document.querySelector("#showcase-description").innerHTML = data.description;
      document.querySelector("#showcase-image").src = data.image;
      if(data.auction) {
        document.querySelector("#showcase-price").innerHTML = data.auction.price;
        document.querySelector("#showcase-cta").href = data.auction.href;
        document.querySelector(".showcase-auction").classList.remove('hidden');
      } else {
        document.querySelector(".showcase-auction").classList.add('hidden');
      }
    } else {
      document.querySelector("#showcase-panel").classList.add('translate-x-full');
    }
  }
  toggleShowcaseMessage(pickedMeshId) {
    let open = !document.querySelector("#showcase-message").classList.contains('translate-y-full');
    let poster = this.spaceConfig.posters.find(p => pickedMeshId === p.name);
    if(poster && !open) {
      document.querySelector("#showcase-message").classList.remove('translate-y-full');
    } else {
      document.querySelector("#showcase-message").classList.add('translate-y-full');
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
        'portal-door-top',
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
    this.world.scene.getMeshByName('Boole').material.clearCoat.isEnabled = true;
    this.world.scene.getMeshByName('door2-emiss').material.clearCoat.isEnabled = true;
  }
  initVipEntrance() {
    let vipEntrance = this.world.scene.getMeshByName('portal-door-top');
    let vipEntranceEmissive = this.world.scene.getMeshByName('portal-door-emissive');
    if(!this.spaceConfig.permissions.access_backstage) {
      //vipEntrance.dispose();
      //vipEntranceEmissive.dispose();
      //return;
    }
    var doorPosition = { "x": "8.598", "y": "0.756", "z": "-8.659"};
    vipEntrance._rotationQuaternion._w = 6.123233995736766e-17;
    vipEntrance._rotationQuaternion._y = 1;
    vipEntrance.position.x = 6.14;
    vipEntrance.position.y = -0.054;
    vipEntrance.position.z = 2.95;
    vipEntranceEmissive._rotationQuaternion._w = 6.123233995736766e-17;
    vipEntranceEmissive._rotationQuaternion._y = 1;
    vipEntranceEmissive.position.x = 6.205;
    vipEntranceEmissive.position.y = -0.057;
    vipEntranceEmissive.position.z = 2.950;

    vipEntrance.isPickable = true;
    vipEntrance.actionManager = new BABYLON.ActionManager(this.world.scene);
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.world.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if (distance < 4) {
              this.world.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
            }
          })
      )
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            this.world.scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
          })
      )
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (event) => {
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.world.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if (distance < 4) {
              this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 100);
              VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), new BABYLON.Vector3(5.00683956820889, -2.509445424079895, 34.47109323271263));
              setTimeout(() => {
                this.world.camera1.setTarget(new BABYLON.Vector3(-1.52,-1.69,36.54));
                this.animateCamera = false;
              }, 100);
            }
          })
      )
  }
  initVipExit() {
    let doorMesh = this.world.scene.getMeshByName('door2-emiss');
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
              this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 100);
              VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), new BABYLON.Vector3(11.434676717597117, 0.643570636510849, -7.233532864707575));
              setTimeout(() => {
                this.world.camera1.setTarget(new BABYLON.Vector3(0,1,-5));
                this.animateCamera = false;
              }, 100);
            }
          })
      )
  }
}

export default Customizer;