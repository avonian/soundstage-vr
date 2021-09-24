export class StageControls {
  constructor (callback, userSettings, world) {
    this.callback = callback;
    this.videos = world.videos;
    this.userSettings = userSettings;
    this.world = world;
    this.pedestal = this.world.scene.getMeshByName("Pedestal_Pedestal_Emission_2_15348");
    this.pedestalColorAnimation = false;
    this.DJPlatformRaised = false;
    this.tunnelLightsOn = false;
    this.gridFloorOn = false;
    this.gridFloorInterval = false;
    this.moodParticlesOn = false;
    this.fogSetting = false;
    this.moodParticleSystems = [];
    this.particleSources = world.particleSources;
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
    this.fogSettingConfigs = {
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
        fogSetting: 'none',
        pedestalColor: [this.colors['skyblue'], this.colors['magenta'], this.colors['green'], this.colors['indigo']],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 800
      },
      'Purple Haze': {
        environmentIntensity: 0.14999999999999925,
        fogSetting: 'purple',
        pedestalColor: [this.colors['skyblue'], this.colors['magenta'], this.colors['green'], this.colors['indigo']],
        pedestalTransitionInterval: 150,
        pedestalWaitInterval: 600
      },
      'The Blues': {
        environmentIntensity: 0.14999999999999925,
        fogSetting: 'navyBlue',
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
  animateFog(fogSettingConfig, duration, callback) {
    this.world.scene.animations = [];

    if(duration === 0) {
      this.world.scene.fogColor = fogSettingConfig.color;
      this.world.scene.fogDensity = fogSettingConfig.fogDensity;
      return;
    }

    let fogColorAnimation = new BABYLON.Animation("fogColorAnimation", "fogColor", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3);
    let colorKeys = [
      {
        frame: 0,
        value: this.world.scene.fogColor
      },
      {
        frame: duration,
        value: fogSettingConfig.color
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
        value:  fogSettingConfig.fogDensity
      },
    ];
    fogDensityAnimation.setKeys(densityKeys);
    this.world.scene.animations.push(fogDensityAnimation);
    this.world.scene.beginAnimation(this.world.scene, 0, duration, false, 1, callback);
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
  animateDJSpotLight(intensity, transitionInterval, callback) {
    if(!this.world.DJSpotLight) {
      return;
    }
    let DJSpotLightAnimation = new BABYLON.Animation("DJSpotLightAnimation", "intensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let keys = [
      {
        frame: 0,
        value: this.world.DJSpotLight.intensity
      },
      {
        frame: transitionInterval,
        value: intensity
      },
    ];
    DJSpotLightAnimation.setKeys(keys);
    let DJSpotLight = this.world.DJSpotLight;
    DJSpotLight.animations = [];
    DJSpotLight.animations.push(DJSpotLightAnimation)
    this.world.scene.beginAnimation(DJSpotLight, 0, transitionInterval, false, 1, callback);
  }
  raiseDJPlatform(raise = true, transitionInterval = 150) {
    this.DJPlatformRaised = raise;
    let mesh = this.world.scene.getMeshByName("Pedestal.002_Pedestal.002_Blue_15390");

    // If transition duration = 0 jump to final state
    if(transitionInterval === 0) {
      mesh.position.y = raise ? -0.84 : -1.004;
      mesh._scaling.y = raise ? 1 : 1.4;
      return;
    }

    mesh.animations = [];

    let meshPositionAnimation = new BABYLON.Animation("meshPositionAnimation", `position.y`, 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let positionKeys = [
      {
        frame: 0,
        value: mesh.position.y
      },
      {
        frame: transitionInterval,
        value: raise ? -0.84 : -1.004
      },
    ];
    meshPositionAnimation.setKeys(positionKeys);
    mesh.animations.push(meshPositionAnimation);

    let meshScalingAnimation = new BABYLON.Animation("meshScalingAnimation", `_scaling.y`, 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let scaleKeys = [
      {
        frame: 0,
        value: mesh._scaling.y
      },
      {
        frame: transitionInterval / 1.5,
        value: raise ? 1 : 1.4
      },
    ];
    meshScalingAnimation.setKeys(scaleKeys);
    mesh.animations.push(meshScalingAnimation);

    this.world.scene.beginAnimation(mesh, 0, transitionInterval, false, 1);
  }
  animateStoreLight(intensity, transitionInterval, callback) {
    if(!this.world.storeLight) {
      return;
    }
    let StoreLightAnimation = new BABYLON.Animation("StoreLightAnimation", "intensity", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let keys = [
      {
        frame: 0,
        value: this.world.storeLight.intensity
      },
      {
        frame: transitionInterval,
        value: intensity
      },
    ];
    StoreLightAnimation.setKeys(keys);
    let StoreLight = this.world.storeLight;
    StoreLight.animations = [];
    StoreLight.animations.push(StoreLightAnimation)
    this.world.scene.beginAnimation(StoreLight, 0, transitionInterval, false, 1, callback);
  }
  toggleTunnelLights(on = true, transitionInterval = 100) {
    this.tunnelLightsOn = on;
    let meshes = this.world.scene.meshes.filter(mesh => (mesh.name.indexOf("Sweep") === 0 && mesh.name !== "Sweep.5" && mesh.parent.parent.name !== "logo") || (mesh.name === "Sweep.5" && mesh.parent.parent.name === "Null.1"))
    meshes.forEach(mesh => {
      if(transitionInterval === 0) {
        mesh.visibility = on ? 1 : 0.2;
      } else {
        mesh.animations = [];
        let meshVisibilityAnimation = new BABYLON.Animation("meshVisibilityAnimation", `visibility`, 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
        let positionKeys = [
          {
            frame: 0,
            value: mesh.visibility
          },
          {
            frame: transitionInterval,
            value: on ? 1 : 0.2
          },
        ];
        meshVisibilityAnimation.setKeys(positionKeys);
        mesh.animations.push(meshVisibilityAnimation);
        this.world.scene.beginAnimation(mesh, 0, transitionInterval, false, 1);
      }
    });
  }
  toggleGroundVisibility(on, transitionInterval, callback) {
    let mesh = this.world.scene.getMeshByName('Room_Room_Base_1_15402');
    if(!this.originalGroundVisibility) {
      this.originalGroundVisibility = mesh.visibility;
    }
    if(transitionInterval === 0) {
      transitionInterval = 1;
    }
    mesh.animations = [];
    let meshVisibilityAnimation = new BABYLON.Animation("meshVisibilityAnimation", `visibility`, 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    let positionKeys = [
      {
        frame: 0,
        value: mesh.visibility
      },
      {
        frame: transitionInterval,
        value: on ? this.originalGroundVisibility : 0
      },
    ];
    meshVisibilityAnimation.setKeys(positionKeys);
    mesh.animations.push(meshVisibilityAnimation);
    this.world.scene.beginAnimation(mesh, 0, transitionInterval, false, 1, callback);
  }
  toggleGridFloor(on = true, transitionInterval = 150, speed = 500) {
    this.gridFloorOn = on;
    let gridFloor = this.world.scene.getMeshByName("gridFloor");
    if(this.gridFloorOn) {

      if (!gridFloor) {
        // need to include materialsLibrary/babylonjs.materials.min.js in public/index.html
        let gridFloorMat = new BABYLON.GridMaterial("gridFloorMat", this.world.scene);
        gridFloorMat.gridRatio = 0.1;
        gridFloorMat.lineColor = BABYLON.Color3.Purple();
        gridFloor = BABYLON.MeshBuilder.CreateGround("gridFloor", { width: 22.5, height: 20 }, this.world.scene);
        gridFloor.material = gridFloorMat;
        gridFloor.position.x = 2; // in the center
        gridFloor.position.z = -4;
        gridFloor.position.y = -.003;
      }

      let gridFloorMat = this.world.scene.getMaterialByName("gridFloorMat");
      this.gridFloorInterval = setInterval(function () {
        gridFloorMat.lineColor = BABYLON.Color3.Random();
      }, speed);
      gridFloor.visibility = 1;
      this.toggleGroundVisibility(false, transitionInterval);
    } else {
      this.toggleGroundVisibility(true, transitionInterval, () => {
        if(gridFloor) {
          gridFloor.visibility = 0;
        }
        clearInterval(this.gridFloorInterval);
        this.gridFloorInterval = false;
      });
    }
    this.world.shareProperties();
  }
  toggleMoodParticles(on = true) {
    this.moodParticlesOn = on;

    if(this.userSettings.graphicsQuality === 'low' || this.userSettings.graphicsQuality === 'very-low' ) {
      for(let system of this.moodParticleSystems) {
        system.stop();
      }
      this.moodParticleSystems = [];
      return;
    }

    if(!this.moodParticlesOn) {
      for(let system of this.moodParticleSystems) {
        system.stop();
      }
      this.moodParticleSystems = [];
      return;
    }

    // Positions array to move particles emitter
    for(let particleSource of this.particleSources) {
      // For reliability it may be better to use json file for particles instead of snippet - later
      BABYLON.ParticleHelper.CreateFromSnippetAsync("HYB2FR#22", this.world.scene, false).then((system) => {
        //  console.log("partSystemPos moved ")
        system.minLifeTime = 5;
        system.maxLifeTime = 15;
        system.emitRate = 10;
        system.color1 = new BABYLON.Color3(0, 1, 0);
        system.color2 = new BABYLON.Color3(1, 0, 1);
        system.gravity = new BABYLON.Vector3(0, -0.2, 0);
        system.emitter = particleSource['position'];
        system.diretion1 = particleSource['rotation'];
        this.moodParticleSystems.push(system);
      });
    }
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
        if(moodSet.fogSetting) {
          this.fogSetting = moodSet.fogSetting;
          if(document.querySelector('#fogSetting')) {
            document.querySelector('#fogSetting').value = this.fogSetting;
          }
          this.animateStoreLight(15, 100, () => {
            this.animateFog(this.fogSettingConfigs[moodSet.fogSetting], 300);
          });
        } else {
          this.animateStoreLight(15, 100);
        }
      });
      this.world.scene.pedestalColor = moodSet.pedestalColor;

      // tempMesh.material.emissiveColor = this.world.scene.pedestalColor;
    } else {
      this.activeMood = false;
      this.fogSetting = 'none';
      if(document.querySelector('#fogSetting')) {
        document.querySelector('#fogSetting').value = this.fogSetting;
      }
      this.animateEnvironmentIntensity(this.cubeTextures[this.activeCubeTexture]['environmentIntensity'], 300, () => {
        this.animateStoreLight(0, 100, () => {
          this.animateFog(this.fogSettingConfigs['none'], 300);
        });
      });
      this.pedestalColorAnimation.stop();
      this.animatePedestalColor([this.pedestal.material.emissiveColor, BABYLON.Color3.White()], 600, 0);
      this.pedestal.material.emissiveColor = BABYLON.Color3.White();
      this.world.scene.pedestalColor = BABYLON.Color3.White();
    }
  }
  emitPlayVideo( videoId, customTargets ) {
    if(customTargets) {
      for(var display of customTargets) {
        this.world.properties.displayProperties[display].video_id = videoId;
        this.world.properties.displayProperties[display].user_id = null;
        this.executeAndSend({ action: 'playVideo', display: display, video_id: videoId });
      }
    } else {
      // Update global properties
      for (var display of Object.keys(this.world.displayConfig)) {
        if (this.world.displayConfig[display].target) {
          // Update locally so we can do a 'shareProperties' to update the server state
          this.world.properties.displayProperties[display].video_id = videoId;
          this.world.properties.displayProperties[display].user_id = null;
          this.executeAndSend({ action: 'playVideo', display: display, video_id: videoId });
        }
      }
    }
    this.world.shareProperties();
  }
  emitCastUser( userId ) {
    // Update global properties
    for(var display of Object.keys(this.world.displayConfig)) {
      if(this.world.displayConfig[display].target) {
        // Update locally so we can do a 'shareProperties' to update the server state
        this.world.properties.displayProperties[display].user_id = userId;
        this.executeAndSend({ action: 'castUser', display: display, user_id: userId });
      }
    }
    this.world.shareProperties();
  }
  emitResetWalls() {
    this.world.properties.displayProperties['skyBox'].video_id = null;
    this.world.properties.displayProperties['skyBox'].user_id = null;
    this.executeAndSend({ action: 'resetWalls' });
    this.world.shareProperties();
  }
  emitRescaleSkybox(scale) {
    this.world.properties.displayProperties['skyBox'].textureScale = scale;
    this.executeAndSend({ action: 'rescaleSkybox', scale: scale });
    this.world.shareProperties();
  }
  async execute( event ) {
    let video;
    switch(event.action) {
      case 'playVideo':
        this.world.properties.displayProperties[event.display].video_id = event.video_id;
        this.world.properties.displayProperties[event.display].user_id = null;
        this.world.updateDisplay(event.display, this.world.videos[event.video_id].url);
        break;
      case "castUser":
        this.world.properties.displayProperties[event.display].user_id = event.user_id;
        this.world.castUser(event.display, event.user_id);
        break;
      case "resetWalls":
        this.world.properties.displayProperties['skyBox'].video_id = null;
        this.world.properties.displayProperties['skyBox'].user_id = null;
        this.world.toggleSkybox(false);
        break;
      case "rescaleSkybox":
        this.world.properties.displayProperties['skyBox'].textureScale = event.scale;
        this.world.rescaleSkybox(event.scale);
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
        this.fogSetting = event.fogSetting;
        this.animateFog(this.fogSettingConfigs[event.fogSetting], 300);
        break;
      case "changeDJSpotLightIntensity":
        this.animateDJSpotLight(event.intensity, 50, () => {
          this.raiseDJPlatform(event.intensity > 0);
        });
        break;
      case "toggleTunnelLights":
        this.toggleTunnelLights(event.value);
        break;
      case "toggleGridFloor":
        this.toggleGridFloor(event.value, event.transitionInterval, event.speed);
        break;
      case "toggleMoodParticles":
        this.toggleMoodParticles(event.value, event.speed);
        break;
      case "switchSpace":
        await sessionStorage.setItem('skipWelcome', 'true');
        window.location.href = `${process.env.VUE_APP_API_URL}/spaces/${event.space}`;
        break;
      case "showTrackInfo":
        let vue = document.querySelector("#app")._vnode.component;
        if(event.track) {
          vue.data.currentTrack = event.track;
          document.querySelector('#track-panel').classList.remove('translate-y-full');
        } else {
          document.querySelector('#track-panel').classList.add('translate-y-full');
          setTimeout(() => vue.data.currentTrack = false, 700);
        }
        break;
    }
  }
}

export default StageControls;