import { VRSPACEUI } from './vrspace/index-min'
import Utilities from './utilities'

export class Gallery {
  constructor (world) {
    this.world = world;
    this.world.scene.highlightLayer1 = new BABYLON.HighlightLayer("highlightLayer1", this.world.scene);
    this.spaceConfig = world.spaceConfig;
    this.loadedAssets = [];
    this.initPosters();
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
        if(!posters[i].video_url) {
          galleryPoster.material.opacityTexture = new BABYLON.Texture(posters[i].photo_url, this.world.scene);
        }

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
}

export default Gallery;