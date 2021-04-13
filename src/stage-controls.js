export class StageControls {
  constructor (displays, position, callback, userSettings, world) {
    this.displays = displays;
    this.callback = callback;
    this.videos = world.videos;
    this.userSettings = userSettings;
    this.world = world;
    this.userBeingCasted = false;
    this.pedestal = this.world.scene.getMeshByName("Pedestal_Pedestal_Emission_2_15348");
    this.pedestalColorAnimation = false;
    this.cubeTextures = {
      default: { url: 'https://playground.babylonjs.com/textures/environment.env', environmentIntensity: 1 },
      runyon: { url: 'https://playground.babylonjs.com/textures/Runyon_Canyon_A_2k_cube_specular.env', environmentIntensity: 1.4 },
      night: { url: 'https://playground.babylonjs.com/textures/night.env', environmentIntensity: 1.5 },
      room: { url: 'https://playground.babylonjs.com/textures/room.env', environmentIntensity: 0.4 },
      parking: { url: 'https://playground.babylonjs.com/textures/parking.env', environmentIntensity: 0.4 },
      country: { url: 'https://playground.babylonjs.com/textures/country.env', environmentIntensity: 0.8 },
      studio: { url: 'https://playground.babylonjs.com/textures/Studio_Softbox_2Umbrellas_cube_specular.env', environmentIntensity: 0.4 }
    }
    this.moodSets = {
      'Purple Haze': {
        environmentIntensity: 0.14999999999999925,
        fogColor: new BABYLON.Color4(0.5,0,0.5,0.5),
        fogDensity: 0.04900000000000001,
        pedestalColor: [new BABYLON.Color3(0, 0.45, 1), new BABYLON.Color3(1,0,1), new BABYLON.Color3(0, 1, 0.4),  new BABYLON.Color3(0, 1, 0.2), new BABYLON.Color3(0.35, 0, 1)],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 600
      },
      'The Blues': {
        environmentIntensity: 0.14999999999999925,
        fogColor: new BABYLON.Color4(0,0,1,0.5),
        fogDensity: 0.03900000000000001,
        pedestalColor: [new BABYLON.Color3(0, 0.45, 1), new BABYLON.Color3(1,0,1), new BABYLON.Color3(0, 1, 0.4),  new BABYLON.Color3(0, 1, 0.2), new BABYLON.Color3(0.35, 0, 1)],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 600
      }
    }
    this.activeCubeTexture = 'default';
    this.activeMood = false;
  }
  init () {
    if (this.callback) {
      this.callback(this);
    }
  }
  executeAndSend(event) {
    this.execute(event);
    this.world.worldManager.VRSPACE.sendMy('properties', {stageEvent: event});
  }
  changeCubeTexture(cubeTexture) {
    let hdrTexture = new BABYLON.CubeTexture(this.cubeTextures[cubeTexture].url, this.world.scene);
    this.world.scene.environmentTexture = hdrTexture;
    this.world.scene.environmentIntensity = this.cubeTextures[cubeTexture].environmentIntensity;
    this.world.scene.fogDensity = 0;
    this.world.scene.pedestalColor = BABYLON.Color3.White();
    this.activeCubeTexture = cubeTexture;
  }
  animatePedestalColor(colors, transitionInterval, waitInterval, loop = false) {
    this.pedestalColorAnimation = new BABYLON.Animation("pedestalColorAnimation", "material.emissiveColor", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    // Animation keys
    let frame = 0;
    let keys = [];
    for(let color of colors) {
      keys.push({
        frame: frame,
        value: color
      })
      frame += waitInterval;
      keys.push({
        frame: frame,
        value: color
      })
      frame += transitionInterval;
    }
    if(loop) {
      keys.push({
        frame: frame,
        value: colors[0]
      })
      frame += waitInterval;
      keys.push({
        frame: frame,
        value: colors[0]
      })
      frame += transitionInterval;
    }
    this.pedestalColorAnimation.setKeys(keys);

    this.pedestal.animations = [];
    this.pedestal.animations.push(this.pedestalColorAnimation);
    this.world.scene.stopAnimation(this.pedestal);
    this.pedestalColorAnimation = this.world.scene.beginAnimation(this.pedestal, 0, frame, loop);
  }
  animateFogDensity(density, fogTransitionInterval) {
    let fogDensityAnimation = new BABYLON.Animation("fogDensityAnimation", "fogDensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let keys = [
      {
        frame: 0,
        value: this.world.scene.fogDensity
      },
      {
        frame: fogTransitionInterval,
        value: density
      },
    ];
    fogDensityAnimation.setKeys(keys);
    this.world.scene.animations = [];
    this.world.scene.animations.push(fogDensityAnimation);
    this.world.scene.beginAnimation(this.world.scene, 0, fogTransitionInterval);

  }
  animateEnvironmentIntensity(intensity, transitionInterval, callback) {
    let environmentIntensityAnimation = new BABYLON.Animation("environmentIntensityAnimation", "environmentIntensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let keys = [
      {
        frame: 0,
        value: this.world.scene.environmentIntensity
      },
      {
        frame: transitionInterval,
        value: intensity
      },
    ];
    environmentIntensityAnimation.setKeys(keys);
    this.world.scene.animations = [];
    this.world.scene.animations.push(environmentIntensityAnimation);
    this.world.scene.beginAnimation(this.world.scene, 0, transitionInterval, false, 1, callback);

  }
  changeMood(moodSetName) {
    if(moodSetName) {
      let moodSet = this.moodSets[moodSetName];

      this.animatePedestalColor([this.pedestal.material.emissiveColor, moodSet.pedestalColor[0]], moodSet.pedestalTransitionInterval * 2, 0);
      setTimeout(() => {
        if(this.activeMood) { // In case timeout gets called after we've switched the mood back to default
          this.animatePedestalColor(moodSet.pedestalColor, moodSet.pedestalTransitionInterval, moodSet.pedestalWaitInterval, true);
        }
      }, moodSet.pedestalTransitionInterval * 2 * 100)
      this.activeMood = moodSetName;
      this.world.scene.fogColor = moodSet.fogColor;
      this.animateEnvironmentIntensity(moodSet.environmentIntensity, 300, () => {
        this.animateFogDensity(moodSet.fogDensity, 300);
      });
      this.world.scene.pedestalColor = moodSet.pedestalColor;

      // tempMesh.material.emissiveColor = this.world.scene.pedestalColor;
    } else {
      this.activeMood = false;
      this.animateEnvironmentIntensity(this.cubeTextures[this.activeCubeTexture]['environmentIntensity'], 300, () => {
        this.animateFogDensity(0, 300)
      });

      this.pedestalColorAnimation.stop();
      this.pedestal.material.emissiveColor = BABYLON.Color3.White();
      this.world.scene.pedestalColor = BABYLON.Color3.White();
    }
  }
  play( videoIndex ) {
    let playTableEvent = { action: 'playVideo', target: "WindowVideo", videoIndex: videoIndex };
    this.executeAndSend(playTableEvent);

    let playWindowEvent = { action: 'playVideo', target: "DJTableVideo", videoIndex: videoIndex };
    this.executeAndSend(playWindowEvent);
  }
  cast( userId ) {
    let castUserEvent = { action: 'castUser', target: "WindowVideo", userId: userId };
    this.executeAndSend(castUserEvent);
  }
  fetchPeerVideoElement(peerid) {
    let videos = document.querySelectorAll('video')
    for(var video of videos) {
      if(video.getAttribute('peerid') === peerid) {
        return video;
      }
    }
    return false;
  }
  async execute( event ) {
    let resumeUserPlayback = false;
    switch(event.action) {
      case 'playVideo':
        if(!this.userSettings.enableVisuals) {
          return;
        }
        this.world.initializeDisplays(this.videos[event.videoIndex].url, [event.target]);
        /* If a user was being casted continue playing the video element since initializeDisplays will have paused it when disposing previous textures */
        resumeUserPlayback = this.userBeingCasted;
        this.userBeingCasted = false;
        break;
      case "castUser":
        if(!this.userSettings.enableVisuals) {
          return;
        }
        let video = this.fetchPeerVideoElement(event.userId);
        if(video) {
          this.world.initializeDisplays(video, [event.target]);
          /* If a user was being casted continue playing the video element since initializeDisplays will have paused it when disposing previous textures */
          resumeUserPlayback = this.userBeingCasted;
          this.userBeingCasted = event.userId;
        }
        break;
      case "changeCubeTexture":
        if(event.cubeTexture) {
          this.changeCubeTexture(event.cubeTexture);
        }
        break;
      case "changeMood":
        this.changeMood(event.moodSet);
        break;
    }

    if(resumeUserPlayback) {
      let video = this.fetchPeerVideoElement(resumeUserPlayback);
      if(video) {
        video.play();
      }
    }
  }
}

export default StageControls;