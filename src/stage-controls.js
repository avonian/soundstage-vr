export class StageControls {
  constructor (displays, callback, userSettings, world) {
    this.displays = displays;
    this.callback = callback;
    this.videos = world.videos;
    this.userSettings = userSettings;
    this.world = world;
    this.userBeingCasted = false;
    this.videoBeingPlayed = false;
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
    this.colors = {
      black:  new BABYLON.Color3(0,0,0),
      white:  new BABYLON.Color3(1,1,1),
      purple: new BABYLON.Color3(0.5,0,0.5),
      navyBlue: new BABYLON.Color3(0,0,1),
      skyblue: new BABYLON.Color3(0, 0.45, 1),
      magenta: new BABYLON.Color3(1,0,1),
      green: new BABYLON.Color3(0, 1, 0.4),
      indigo: new BABYLON.Color3(0.35, 0, 1)
    }
    this.fogSettings = {
      none: {
        color: this.colors['black'],
        fogDensity: 0,
      },
      purple: {
        color: this.colors['purple'],
        fogDensity: 0.05
      },
      navyBlue: {
        color: this.colors['navyBlue'],
        fogDensity: 0.03
      },
      skyblue: {
        color: this.colors['skyblue'],
        fogDensity: 0.03
      },
      magenta: {
        color: this.colors['magenta'],
        fogDensity: 0.03
      },
      green: {
        color: this.colors['green'],
        fogDensity: 0.01
      },
      indigo: {
        color: this.colors['indigo'],
        fogDensity: 0.03
      }
    }
    this.moodSets = {
      'Dim Lights': {
        environmentIntensity: 0.14999999999999925,
        pedestalColor: [this.colors['skyblue'], this.colors['magenta'], this.colors['green'], this.colors['indigo']],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 800
      },
      'Purple Haze': {
        environmentIntensity: 0.14999999999999925,
        fogSettings: this.fogSettings['purple'],
        pedestalColor: [this.colors['skyblue'], this.colors['magenta'], this.colors['green'], this.colors['indigo']],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 600
      },
      'The Blues': {
        environmentIntensity: 0.14999999999999925,
        fogSettings: this.fogSettings['navyBlue'],
        pedestalColor: [this.colors['skyblue'], this.colors['magenta'], this.colors['green'], this.colors['indigo']],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 600
      }
    }
    this.activeCubeTexture = 'default';
    this.activeMood = false;
    this.saveInterval = false;
  }
  init () {
    if (this.callback) {
      this.callback(this);
    }
  }
  executeAndSend(event) {
    this.execute(event);
    this.world.worldManager.VRSPACE.sendMy('stageEvent', event);
  }
  changeCubeTexture(cubeTexture) {
    let hdrTexture = new BABYLON.CubeTexture(this.cubeTextures[cubeTexture].url, this.world.scene);
    this.world.scene.environmentTexture = hdrTexture;
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
  animateFog(fogSettings, duration) {
    this.world.scene.animations = [];

    let fogColorAnimation = new BABYLON.Animation("fogColorAnimation", "fogColor", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3);
    let colorKeys = [
      {
        frame: 0,
        value: this.world.scene.fogColor
      },
      {
        frame: duration,
        value: fogSettings.color
      },
    ];
    fogColorAnimation.setKeys(colorKeys);
    this.world.scene.animations.push(fogColorAnimation);

    let fogDensityAnimation = new BABYLON.Animation("fogDensityAnimation", "fogDensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let densityKeys = [
      {
        frame: 0,
        value: this.world.scene.fogDensity
      },
      {
        frame: duration,
        value:  fogSettings.fogDensity
      },
    ];
    fogDensityAnimation.setKeys(densityKeys);
    this.world.scene.animations.push(fogDensityAnimation);

    this.world.scene.beginAnimation(this.world.scene, 0, duration, false);
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
  animateDjSpotLight(intensity, transitionInterval, callback) {
    let DJSpotLightAnimation = new BABYLON.Animation("DJSpotLightAnimation", "intensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let keys = [
      {
        frame: 0,
        value: this.world.customizer.DJSpotLight.intensity
      },
      {
        frame: transitionInterval,
        value: intensity
      },
    ];
    DJSpotLightAnimation.setKeys(keys);
    let DJSpotLight = this.world.customizer.DJSpotLight;
    DJSpotLight.animations = [];
    DJSpotLight.animations.push(DJSpotLightAnimation);
    this.world.scene.beginAnimation(DJSpotLight, 0, transitionInterval, false, 1, callback);
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
      this.animateEnvironmentIntensity(moodSet.environmentIntensity, 300, () => {
        if(moodSet.fogSettings) {
          this.animateFog(moodSet.fogSettings, 300);
        }
      });
      this.world.scene.pedestalColor = moodSet.pedestalColor;

      // tempMesh.material.emissiveColor = this.world.scene.pedestalColor;
    } else {
      this.activeMood = false;
      this.animateEnvironmentIntensity(this.cubeTextures[this.activeCubeTexture]['environmentIntensity'], 300, () => {
        this.animateFog(this.fogSettings['none'], 300);
      });
      this.pedestalColorAnimation.stop();
      this.animatePedestalColor([this.pedestal.material.emissiveColor, BABYLON.Color3.White()], 600, 0);
      this.pedestal.material.emissiveColor = BABYLON.Color3.White();
      this.world.scene.pedestalColor = BABYLON.Color3.White();
    }
  }
  play( videoIndex ) {
    let playTableEvent = { action: 'playVideo', target: "WindowVideo", videoIndex: videoIndex };
    this.world.properties.WindowVideo = videoIndex;
    this.executeAndSend(playTableEvent);

    let playWindowEvent = { action: 'playVideo', target: "DJTableVideo", videoIndex: videoIndex };
    this.world.properties.DJTableVideo = videoIndex;
    this.executeAndSend(playWindowEvent);
    this.world.shareProperties();
  }
  cast( userId ) {
    let castUserEvent = { action: 'castUser', target: "WindowVideo", userId: userId };
    this.world.properties.castUser = userId;
    this.executeAndSend(castUserEvent);
    this.world.shareProperties();
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
        this.videoBeingPlayed = this.videos[event.videoIndex].url;
        if(!this.userSettings.enableVisuals) {
          return;
        }
        this.world.initializeDisplays(this.videos[event.videoIndex].url, [event.target]);
        /* If a user was being casted continue playing the video element since initializeDisplays will have paused it when disposing previous textures */
        resumeUserPlayback = this.userBeingCasted;
        this.userBeingCasted = false;
        break;
      case "castUser":
        this.videoBeingPlayed = false;
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
      case "changeFog":
        this.animateFog(this.fogSettings[event.fogSetting], 300);
        break;
      case "changeDjSpotLightIntensity":
        this.animateDjSpotLight(event.intensity, 50);
        break;
    }

    if(resumeUserPlayback) {
      let video = this.fetchPeerVideoElement(resumeUserPlayback);
      if(video) {
        video.play();
      } else {
        console.log("WARNING - can't stream video of "+userId);
      }
    }
  }
  playUserVideo(userId, target) {
    let video = this.fetchPeerVideoElement(userId);
    if(video) {
      this.world.initializeDisplays(video, [target]);
      this.userBeingCasted = userId;
      console.log("streaming video of "+userId);
    } else {
      console.log("WARNING - can't stream video of "+userId);
    }
  }
}

export default StageControls;