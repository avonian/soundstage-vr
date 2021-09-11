import { WorldManager, VRSPACEUI, VRSPACE } from '../vrspace/index-min';
import SoundWorld from '../sound-world'
import CinemaCamera from '../cinema-camera';
import AdminControls from '../admin-controls';
import StageControls from '../stage-controls';
import Emojis from '../emojis';
import MediaSoup from '../media-streams';
import DummyAvatar from '../dummy-avatar';
import HoloAvatar from '../holo-avatar';
import Movement from '../movement';
import Gallery from '../gallery';
import Chat from '../chat'
import Utilities from '../utilities'

// deals with everything inside 3D world
export default class extends SoundWorld {
  constructor(spaceConfig, userSettings) {
    super();
    this.file = spaceConfig.mode === 'soundclub' ? 'Night_Club-1009.glb' : 'Night_Club-14may.glb';
    this.displays = [];
    this.freeCamSpatialAudio = false;
    this.userSettings = userSettings;
    this.spaceConfig = spaceConfig;
    this.videos = spaceConfig.videos;
    this.displayConfig = {
      'WindowVideo': {
        'label': 'Main Panel',
        'target': true,
        'diffuseTexture': {
          'vScale': 0.65,
          'uScale': -1,
          'vOffset': 0.17
        },
        'canShowMusicVideo': true
      },
      'DJTableVideo': {
        'label': 'DJ Table',
        'target': true,
        'diffuseTexture': {
          'vScale': 0.50,
          'vOffset': -0.75
        },
        'canShowMusicVideo': true
      },
      'skyBox': {
        'label': 'Skybox',
        'target': false,
        'diffuseTexture': {
          'vScale': 5,
          'uScale': 3,
          'vOffset': 0
        }
      }
    }
    this.defaultDisplayProperties = {
      'DJTableVideo': {
        'video_id': 0,
        'user_id': null
      },
      'WindowVideo': {
        'video_id': 0,
        'user_id': null
      },
      'skyBox': {
        'video_id': null,
        'user_id': null,
        'textureScale': 1
      }
    };
    this.role = spaceConfig.role;
    this.permissions = spaceConfig.permissions;
    // cameras
    this.camera1 = null;
    this.camera3 = null;
    this.viewingMedia = null;
    this.viewingMediaMesh = null;
    this.camera1LookAt = null; // used in render loop to decide if we keep focus on a position
    this.activeCameraType = '1p'; // initial camera - 1st person
    // in this space, 0.5 is minimum size that phisically makes sense
    this.videoAvatarSize = 0.25;
    // distance from the floor
    this.avatarHeight = 0.25;
    // movement implementation
    this.movement = new Movement(this);
    // world manager
    this.worldManager = null;
    // mesh to share movement
    this.movementTracker = null;
    // avatar rotation/billboard mode
    this.trackAvatarRotation = true;
    // network stuff
    this.publishing = false;
    this.connected = false;
    // position of video preview in FPS mode
    // null defaults relative to eyes, 30cm front, 5cm below
    this.fpsWebcamPreviewPos = new BABYLON.Vector3(0,0,0); // invisible
    // shared world properties
    this.properties = {
      displayProperties: this.defaultDisplayProperties,
    };
    this.worldState = null;
    // things to dispose of
    this.tableMaterial = null;
    this.tableTexture = null;
    this.tableMesh = null;
    this.windowMaterial = null;
    this.windowTexture = null;
    this.windowMesh = null;
    this.dummies = [];
    this.barLights = [];
    this.clearCoatMeshes = false;
    this.gallery = null;
    this.skyboxManifest = {
      meshesToHide: ["Room_Room_Base_15926", "Ceiling.001_Ceiling.001_Base_1_15402.1", "Ceiling.001_Ceiling.001_Emission_2_15348", "Sphere", "Sphere.1", "Sphere.2", "LogoExtrude.2", "windowSweep", "LogoExtrude", "Room_Room_Base_15926.1", "Room_Room_Base_15926.2", "Room_Room_Emission_2_15348", "Stairs_Stairs_Emission_2_15348"],
      barMeshes: ["Bar_counter_Bar_counter_Base_2_15346", "Lamp.001_(1)_Lamp.003_Base_2_15346", "Lamp.001_(1)_Lamp.003_Emission_5_15456", "Lamp.004_Lamp.005_Base_1_15402", "Lamp.001_Lamp.009_Base_2_15346", "Lamp.001_Lamp.009_Emission_2_15348", "Lamp.002_Lamp.010_Blue_15390", "Lamp.002_Lamp.010_Emission_4_15378", "Lamp.003_Lamp.006_Blue_15390", "Lamp.003_Lamp.006_Emission_15392", "Lamp.004_Lamp.005_Emission_15392", "Lamp.003_(1)_Lamp.007_Blue_15390", "Lamp.003_(1)_Lamp.007_Emission_15392"],
      halfOpacityMeshes: ["Cube.3", "Cube.4", "Boole", "Room_Room_Base_1_15402.1", "Sweep.5", "Pedestal.001_Pedestal.001_Blue_15390", "Pedestal_Pedestal_Blue_15390", "Pedestal.002_Pedestal.002_Blue_15390"],
      oneThirdOpacityMeshes: ["Room_Room_Base_1_15402"],
      quarterOpacityMeshes: ["Fencing_Fencing_Base_15926", "Stairs_Stairs_Base_15926"]
    }
  }
  initAfterLoad() {
    this.scene.getNodeByName('skyBox').applyFog = false;
    this.scene.getMeshByName('ground').isVisible = false;
    this.chat = new Chat(this);
    this.createMaterials();
    this.initVipEntrance();
    this.initVipExit();
    this.gallery = new Gallery(this);
    if(this.spaceConfig.mode === 'soundclub') {
      this.initStore();
      this.initKiosk();
      this.initInbox();
    }
    // Reposition some furniture
    if(this.spaceConfig.mode !== 'soundclub') {
      this.scene.getMeshByName('Sofa.001_Sofa.001_Base_2_15346').position.x = 0.34;
      this.scene.getMeshByName('Sofa.001_Sofa.001_Emission_2_15348').position.x = 0.34;
      this.scene.getMeshByName('Table_Table.003_Base_2_15346').position.x = 0.37;
      this.scene.getMeshByName('Table_Table.003_Emission_2_15348').position.x = 0.37;
      this.scene.getMeshByName('Armchair_Armchair.006_Blue_15390').position.x = 0.3;
      this.scene.getMeshByName('Armchair_Armchair.006_Emission_15392').position.x = 0.3;
      this.scene.getMeshByName('Armchair_Armchair.006_Blue_15390').position.z = 2;
      this.scene.getMeshByName('Armchair_Armchair.006_Emission_15392').position.z = 2;
    }
    // Fix alpha index on walls
    this.scene.getMeshByName('Room_Room_Base_15926').alphaIndex = 0.5;
  }
  createMaterials() {
    this.transparentMaterial = new BABYLON.StandardMaterial("transparentMaterial", this.scene);
    this.transparentMaterial.diffuseColor = BABYLON.Color3.Teal();
    this.transparentMaterial.specularColor = BABYLON.Color3.Teal();
    this.transparentMaterial.emissiveColor = BABYLON.Color3.Teal();
    this.transparentMaterial.alpha = 0;
  }
  initVipEntrance() {
    let vipEntrance = this.scene.getMeshByName('portal-door-top');
    let vipEntranceEmissive = this.scene.getMeshByName('portal-door-emissive');

    var doorPosition;
    if(this.spaceConfig.mode === 'soundclub') {
      doorPosition = {"x":"9.17","y":"0.89","z":"3.55"};
    } else {
      doorPosition = { "x": "8.598", "y": "0.756", "z": "-8.659" };
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
    }

    if(!this.spaceConfig.permissions.access_backstage) {
      Utilities.bindMeshAction(
        this.scene,
        this.camera1,
        vipEntrance,
        () => {},
        () => {},
        () => {
          document.querySelector("#app")._vnode.component.data.modal = {
            title: "Restricted area.",
            body: "<p class='mb-4'>Sorry, you are not allowed access to this area.</p>"
          }
        },
        doorPosition
      );
      return;
      //vipEntrance.dispose();
      //vipEntranceEmissive.dispose();
      //return;
    }

    vipEntrance.isPickable = true;
    vipEntrance.actionManager = new BABYLON.ActionManager(this.scene);
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if (distance < 4) {
              this.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
            }
          })
      )
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            this.scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
          })
      )
    vipEntrance.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (event) => {
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if (distance < 4) {
              this.animateCamera = VRSPACEUI.createAnimation(this.camera1, "position", 100);
              VRSPACEUI.updateAnimation(this.animateCamera, this.camera1.position.clone(), new BABYLON.Vector3(5.00683956820889, -2.509445424079895, 34.47109323271263));
              setTimeout(() => {
                this.camera1.setTarget(new BABYLON.Vector3(-1.52,-1.69,36.54));
                this.animateCamera = false;
              }, 100);
            }
          })
      )
  }
  initVipExit() {
    let doorMesh = this.scene.getMeshByName('door2-emiss');
    var doorPosition = {"x":"5.91","y":"-1.92","z":"34.69"}
    doorMesh.isPickable = true;
    doorMesh.actionManager = new BABYLON.ActionManager(this.scene);
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if ( distance < 4 ) {
              this.scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
            }
          })
      )
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            this.scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
          })
      )
    doorMesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (event) => {
            var dest = new BABYLON.Vector3(doorPosition.x, doorPosition.y, doorPosition.z);
            var pos = this.camera1.position.clone();
            var distance = dest.subtract(pos).length();

            if ( distance < 4 ) {
              this.animateCamera = VRSPACEUI.createAnimation(this.camera1, "position", 100);
              var dropOffPosition = this.spaceConfig.mode === 'soundclub' ? new BABYLON.Vector3(8.54, 0.83570636510849, 3.39) : new BABYLON.Vector3(11.434676717597117, 0.643570636510849, -7.233532864707575);
              var cameraTarget = this.spaceConfig.mode === 'soundclub' ? new BABYLON.Vector3(0, 1, 1) : new BABYLON.Vector3(0, 1, -5);
              VRSPACEUI.updateAnimation(this.animateCamera, this.camera1.position.clone(), dropOffPosition);
              setTimeout(() => {
                this.camera1.setTarget(cameraTarget);
                this.animateCamera = false;
              }, 100);
            }
          })
      )
  }
  initStore() {
    if(!this.spaceConfig.storeUrl) {
      return;
    }
    let storeClickPlane = BABYLON.MeshBuilder.CreatePlane("storeClickPlane", { width: 2.26, height: 1.68 });
    storeClickPlane.material = this.transparentMaterial;
    storeClickPlane.position.x = 7.418;
    storeClickPlane.position.y = 1.113;
    storeClickPlane.position.z = 5.686;
    storeClickPlane.checkCollisions = true;

    Utilities.bindMeshAction(
      this.scene,
      this.camera1,
      storeClickPlane,
      () => {
        storeClickPlane.material.alpha = 0.1;
      },
      () => {
        storeClickPlane.material.alpha = 0;
      },
      () => {
        storeClickPlane.material.alpha = 0;
        document.querySelector("#app")._vnode.component.data.modalIframe = {
          url: this.spaceConfig.storeUrl,
          closeLabel: 'Exit Store',
          withOverlay: true
        }
      }
    );
  }
  initInbox() {
    this.scene.getNodeByName('tickets.1').dispose();
    /*
    let inboxMesh = this.scene.getNodeByName('tickets.1').getChildren().find(m => m.name === 'Cube.5');
    Utilities.bindMeshAction(
      this.scene,
      this.camera1,
      inboxMesh,
      () => {},
      () => {},
      () => {
        document.querySelector("#app")._vnode.component.data.modal = {
          title: "Under construction.",
          body: "<p class='mb-4'>This should be operational soon, we apologize for the inconvenience.</p>"
        }
      }
    );
    */
  }
  initKiosk() {
    let kioskPlane = BABYLON.MeshBuilder.CreatePlane("kioskPlane", { width: 0.75, height: 0.75 });    kioskPlane.rotation.y = BABYLON.Tools.ToRadians(90);
    kioskPlane.position.x = 9.189;
    kioskPlane.position.y = 1.144;
    kioskPlane.position.z = 4.686;
    if(!this.spaceConfig.kiosk) {
      kioskPlane.material = new BABYLON.StandardMaterial("ticketKioskMaterial", this.scene);
      return;
    }
    kioskPlane.material = new BABYLON.StandardMaterial("kioskPlane_mat", this.scene);
    kioskPlane.material.emissiveTexture = new BABYLON.Texture(this.spaceConfig.kiosk.poster, this.scene);
    kioskPlane.material.emissiveTexture.name = "PosterImage-kioskPlane";
    kioskPlane.material.disableLighting = true

    let kioskMesh = this.scene.getMeshByName('transplane');
    Utilities.bindMeshAction(
      this.scene,
      this.camera1,
      kioskMesh,
      () => {},
      () => {},
      () => {
        document.querySelector("#app")._vnode.component.data.modalIframe = {
          url: this.spaceConfig.kiosk.url,
          closeLabel: 'Exit Kiosk',
          withOverlay: true,
          size: 'max-w-3xl'
        }
      },
      { x: 9.306034156979866, y: 1.1935390253577307, z: 4.646997355447423}
    );
  }
  initDJSpotLight() {
    if(this.DJSpotLight) {
      this.DJSpotLight.dispose();
    }
    if(this.userSettings.graphicsQuality === 'very-low' || this.userSettings.graphicsQuality === 'low' ) {
      return;
    }
    // Making the light over DJ table
    this.DJSpotLight = new BABYLON.SpotLight("DJSpotLight", new BABYLON.Vector3(2, 2, 4.2),
      new BABYLON.Vector3(0.1, -1, 0), BABYLON.Tools.ToRadians(300), 1, this.scene);
    this.DJSpotLight.intensity = 0;
    let DJSpotLightMeshestoInclude = this.scene.meshes.filter(m => {
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
  initStoreLight() {
    if(this.storeLight) {
      this.storeLight.dispose();
    }
    if(this.userSettings.graphicsQuality === 'very-low' || this.userSettings.graphicsQuality === 'low' ) {
      return;
    }
    this.storeLight = new BABYLON.SpotLight("storeLight", new BABYLON.Vector3(7, 1.7, 4.5), new BABYLON.Vector3(0.5, -1, 3), BABYLON.Tools.ToRadians(120), 1, this.scene);
    this.storeLight.intensity = 0;
    this.storeLight.angle = BABYLON.Tools.ToRadians(120);
    this.storeLight.diffuse = BABYLON.Color3.White();
  }
  initBarLights () {
    if(this.barLights) {
      this.barLights.forEach((light) => {
        light.dispose()
      });
    }
    if(this.userSettings.graphicsQuality !== 'medium' &&   this.userSettings.graphicsQuality !== 'high' && this.userSettings.graphicsQuality !== 'ultra-high') {
      return;
    }
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

    console.log("Lights: ", this.scene.lights);
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
      ].map(m => this.scene.getMeshByName(m));
    }
    this.clearCoatMeshes.forEach(mesh => { if(mesh) { mesh.material.clearCoat.isEnabled = this.userSettings.graphicsQuality === 'ultra-high' } })
    // Always clear coat VIP room
    this.scene.getMeshByName('Boole').material.clearCoat.isEnabled = true;
    this.scene.getMeshByName('door2-emiss').material.clearCoat.isEnabled = true;
  }
  // intialization methods override defaults that do nothing
  // superclass ensures everything is called in order, from world init() method
  async createSkyBox() {
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000, this.scene);
    skybox.infiniteDistance = true;
    return skybox;
  }
  async createGround() {
    //Ground
    this.ground = BABYLON.Mesh.CreatePlane("ground", 10000.0, this.scene);
    this.ground.material = new BABYLON.StandardMaterial("groundMat", this.scene);
    this.ground.material.diffuseColor = BABYLON.Color3.FromHexString("#EC4DEC");
    this.ground.material.specularColor = BABYLON.Color3.FromHexString("#E330D0");
    //this.ground.material.backFaceCulling = false;
    this.ground.material.alpha = 0.8;
    this.ground.position = new BABYLON.Vector3(0, -4, 0);
    this.ground.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
    this.ground.checkCollisions = true;
  }
  async createLights() {
    var light = new BABYLON.PointLight("PointLight", new BABYLON.Vector3(20, 20, 100), this.scene);
    light.intensity = 0; // anyway it is too far
// Seems that we don't need it in a way as it was used to.
// We should have at least one light for Babylon createScene() to work
// TODO: find the best position and settings for this light

    return light;
  }

  async createEffects() {
    var hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/environment.env", this.scene);
    hdrTexture.gammaSpace = false;
    this.scene.environmentTexture = hdrTexture;
    this.scene.fogEnabled = true;
    this.scene.fogDensity = 0;
    this.scene.fogColor = new BABYLON.Color3(0,0,0);
    this.scene.fogMode = 2;
    this.scene.autoClearDepthAndStencil = false; // Perf optimization; works if the scene is inside skybox (non-transparent)

    let defaultPipeline = new BABYLON.DefaultRenderingPipeline(
      "Soundstage",
      false, // breaks particles displaying when set to true
      this.scene,
      this.scene.cameras
    );
    defaultPipeline.samples = 8;
    // Bloom
    defaultPipeline.bloomEnabled = true;
    if (defaultPipeline.bloomEnabled) {
      defaultPipeline.bloomKernel = 64; // 64 by default
      defaultPipeline.bloomScale = 0.5; // 0.5 by default
      defaultPipeline.bloomThreshold = 0.6; // 0.9 by default
      defaultPipeline.bloomWeight = 0.4; // 0.15 by default
    }
    // glowLayer
    defaultPipeline.glowLayerEnabled = true;
    if (defaultPipeline.glowLayerEnabled) {
      defaultPipeline.glowLayer.blurKernelSize = 64; // 16 by default
      defaultPipeline.glowLayer.intensity = 0.5; // 1 by default
    }

    defaultPipeline.imageProcessingEnabled = false;
    console.log("Render Pipeline: " + defaultPipeline.name);
  }

  async createPhysics() {
    this.scene.gravity = new BABYLON.Vector3(0, -0.01, 0);
  }
  // most important one - setup of cameras/navigation:
  async createCamera() {
    this.gravityEnabled = true;
    this.collisionsEnabled = true;

    // First person camera:

    this.spawnPosition = this.role === 'artist' || this.permissions.spawn_backstage === true ? new BABYLON.Vector3(5.00683956820889, -2.509445424079895, 34.47109323271263) : new BABYLON.Vector3(11.434676717597117, 0.643570636510849, -7.233532864707575);
    this.spawnTarget = this.role === 'artist' || this.permissions.spawn_backstage === true ? new BABYLON.Vector3(-1.52,-1.69,36.54) : new BABYLON.Vector3(0,1,-5);

    this.camera1 = new BABYLON.UniversalCamera("First Person Camera", this.spawnPosition, this.scene); // If needed in the future DJ starts at 0, 3, 7

    this.camera1.maxZ = 100000;
    this.camera1.minZ = 0;

    this.camera1.setTarget(this.spawnTarget);
    this.camera1.applyGravity = true;
    this.camera1.speed = 0.07;
    //in this space, 0.5 is minimum size that phisically makes sense, thus avatarSize*2:
    this.camera1.ellipsoid = new BABYLON.Vector3(this.videoAvatarSize, this.videoAvatarSize*2, this.videoAvatarSize);
    this.camera1.ellipsoidOffset = new BABYLON.Vector3(0, this.videoAvatarSize + this.avatarHeight, 0);
    this.camera1.checkCollisions = true;

    this.movement.enableKeys();
    console.log("1st Person Camera:")
    console.log(this.camera1);

    // Third person camera:
    // always looks at 1st person camera (avatar) - target is 1st ps camera position
    // alpha rotation depends on 1st ps camera rotation
    this.camera3 = new BABYLON.ArcRotateCamera("Third Person Camera", 0, 1.5*Math.PI-this.camera1.rotation.y, 1, this.camera1.position, this.scene);
    this.camera3.maxZ = 10000;
    this.camera3.minZ = 0;
    this.camera3.wheelPrecision = 100;
    this.camera3.checkCollisions = true; //CHECKME: check or not?

    // disable keys, movement with mouse only
    this.camera3.keysDown = [];
    this.camera3.keysLeft = [];
    this.camera3.keysRight = [];
    this.camera3.keysUp = [];
    this.camera3.keysUpward = [32]; // space

    // this disables looking at own avatar from below:
    //this.camera3.upperBetaLimit = 1.5; // little less than Math.PI/2;
    // allows for about 45 deg angle from below:
    // this.camera3.upperBetaLimit = 2.2;
    this.camera3.lowerRadiusLimit = 0.5; // at least 0.5 m behind avatar
    this.camera3.upperRadiusLimit = 5; // a maximum of 5 m behind avatar
    this.camera3.speed = 0.3;

    // disable panning, as it moves avatar/camera1:
    this.camera3.panningSensibility = 0;
    this.camera3.inputs.attached.pointers.buttons = [1,2]; // disable LMB(0)

    console.log("3rd Person Camera:")
    console.log(this.camera3);

    // Free person camera:
    this.cameraFree = new BABYLON.UniversalCamera("Free Camera", new BABYLON.Vector3(11, 1.3, -7), this.scene);
    this.cameraFree.maxZ = 100000;
    this.cameraFree.minZ = 0;
    this.cameraFree.setTarget(new BABYLON.Vector3(-10,1.3,6));
    this.cameraFree.applyGravity = false;
    this.cameraFree.speed = 0.025;
    this.cameraFree.angularSensibility = 8000;
    this.cameraFree.checkCollisions = false;

    this.cameraFree.keysDown = [40, 83]; // down, S
    this.cameraFree.keysLeft = [37, 65]; // left, A
    this.cameraFree.keysRight = [39, 68]; // right, D
    this.cameraFree.keysUp = [38, 87]; // up, W
    this.cameraFree.keysUpward = [16]; // shift
    this.cameraFree.keysDownward = [32] // space
    console.log("Free Camera:")
    console.log(this.cameraFree);

    // default controlling camera:
    this.camera = this.camera1;
  }
  // end world init methods

  stopTrackingRotation() {
    if ( this.applyRotationToMesh ) {
      this.scene.unregisterBeforeRender( this.applyRotationToMesh );
      this.applyRotationToMesh = null;
    }
  }

  startTrackingRotation() {
    this.applyRotationToMesh = () => {
      var rotY = 1.5*Math.PI-this.camera3.alpha;
      if ( this.trackAvatarRotation ) {
        // convert alpha and beta to mesh rotation.y and rotation.x
        this.video.mesh.rotation.y = rotY;
        // possible but looks weird:
        //this.video.mesh.rotation.x = 0.5*Math.PI - this.camera3.beta;
      }
      this.movementTracker.rotation.y = rotY;
      // and now also apply rotation to 1st person camera
      this.camera1.rotation.z = 0;
      this.camera1.rotation.y = rotY;
      this.camera1.rotation.x = 0;
    }
    this.scene.registerBeforeRender( this.applyRotationToMesh );
  }

  // changing camera types, utilized from HTML UI
  activateCamera(cameraType) {
    if ( cameraType == this.activeCameraType ) {
      return;
    }
    this.camera.detachControl();
    if ( this.video ) {
      this.video.detachFromCamera();
    }
    this.stopTrackingRotation();

    this.video.mesh.isVisible = true;
    this.video.back.isVisible = true;
    if(this.video.particleSystem) {
      this.video.particleSystem.start();
    }
    if ( '1p' === cameraType ) {
      // set position/target from current camera/avatar
      this.camera1.rotation.y = 1.5*Math.PI-this.camera3.alpha;
      //this.camera1.position.y += this.camera1.ellipsoid.y*2 - this.video.radius - this.camera1.ellipsoidOffset.y;
      this.camera1.position.y += this.camera1.ellipsoid.y*2 - this.video.radius - this.camera1.ellipsoidOffset.y-this.avatarHeight;
      this.camera = this.camera1;
      if ( this.worldManager ) {
        this.worldManager.trackMesh(null);
      }
    } else if ( '3p' === cameraType ) {
      this.camera1.position.y += this.video.radius-this.camera1.ellipsoid.y*2+this.camera1.ellipsoidOffset.y+this.avatarHeight;
      // set position/target from current camera/avatar
      this.camera3.alpha = 1.5*Math.PI-this.camera1.rotation.y;
      this.camera = this.camera3;
      if ( this.worldManager && this.video ) {
        this.worldManager.trackMesh(this.movementTracker);
        this.startTrackingRotation();
      }

    } else if ( 'free' === cameraType ) {
      if ( this.trackAvatarRotation ) {
        this.video.mesh.rotation.y = .5*Math.PI-this.camera3.alpha;
        this.video.back.position = new BABYLON.Vector3( 0, 0, 0.001);
      }
      this.video.mesh.isVisible = false;
      this.video.back.isVisible = false;
      this.video.particleSystem.stop();

      this.camera = this.cameraFree;
      if ( this.worldManager && this.video ) {
        this.worldManager.trackMesh(this.movementTracker);
      }
    } else {
      console.log('Unsupported camera type: '+cameraType);
      return;
    }
    this.scene.activeCamera = this.camera;
    this.camera.attachControl(this.canvas);

    if ( '1p' === cameraType && this.video ) {
      // hide video avatar by attaching it to the camera at an invisible position
      this.video.attachToCamera(this.fpsWebcamPreviewPos);
    }

    console.log("Active camera:");
    console.log(this.camera);
    this.activeCameraType = cameraType;
  }

  load(callback) {
    BABYLON.SceneLoader.LoadAssetContainer(process.env.NODE_ENV === 'production' ? 'https://assets.soundstage.fm/vr/models/' : '/models/',
      this.file,
      this.scene,
      // onSuccess:
      (container) => {
        this.sceneMeshes = container.meshes;
        this.container = container;

        // Adds all elements to the scene
        var mesh = container.createRootMesh();
        mesh.name = this.name;
        container.addAllToScene();

        this.loaded( this.file, mesh );

        // do something with the scene
        VRSPACEUI.log("World loaded");
        this.collisions(this.collisionsEnabled);
        if ( callback ) {
          callback(this);
        }
      },
      // onProgress:
      (evt) => {
        if ( this.onProgress ) {
          this.onProgress( evt );
        }
      }
    );
  }
  // called once the world is loaded
  loaded(file, mesh) {
    // rescale and reposition as needed:
    mesh.scaling = new BABYLON.Vector3(0.5,0.5,0.5);
    mesh.position = new BABYLON.Vector3(2,0.4,-1);
    console.log("Loaded "+file);
    // WORLD NOTES:
    // screen is Cube.024_20 TransformNode, node43 mesh
    // its material is Material.001 - can be replaced with video texture

    /* Initialize video loop on DJ table */
    // this is async now as shared state loads
    //this.initializeDisplays();

    this.movement.start();
    this.scene.registerBeforeRender(() => this.spatializeAudio());

    // media streaming stuff
    this.mediaStreams = new MediaSoup(this, 'videos', this.userSettings, this.spaceConfig);

    // stop movement when focus is lost
    this.canvas.onblur = () => {
      if ( this.movingDirections > 0 && ! this.movingToTarget ) {
        this.stopMovement();
      }
    }

    // handle click on barstools
    this.scene.onPointerObservable.add((pointerInfo) => this.handleClick(pointerInfo));

    // DJShield for dj platform
    let DJShield = BABYLON.Mesh.CreateSphere("DJShield");
    DJShield.position.x = 2.083;
    DJShield.position.y = 0.910;
    DJShield.position.z = 4.4;
    DJShield._scaling.x = 3.3;
    DJShield._scaling.y = 3.3;
    DJShield._scaling.z = 3.3;
    DJShield.checkCollisions = this.permissions.stage_controls !== true && this.permissions['access_tunnel'] !== true;
    DJShield.visibility = 0;
    if ( this.afterLoad ) {
      this.afterLoad();
    }

    // Block tunnel entrance
    let tunnelShield = BABYLON.MeshBuilder.CreateBox("TunnelShield", {height:2, width: 3});
    tunnelShield.position.x = 2;
    tunnelShield.position.y = -2;
    tunnelShield.position.z = 33.207;
    tunnelShield.checkCollisions = this.permissions.stage_controls === false && this.permissions['access_tunnel'] !== true;
    tunnelShield.visibility = 0

    let tunnelSegment1 = this.scene.getMeshByName("Cube.3")
    let tunnelSegment2 = this.scene.getMeshByName("Cube.4")
    tunnelSegment1.material.environmentIntensity = 0.3;
    tunnelSegment2.material.environmentIntensity = 0.3;

    if(this.spaceConfig.mode !== 'soundclub') {
      let meshesToDispose = ['PosterClubR', 'PosterClubS2', 'PosterClubS1', 'PosterVIPS', 'PosterVIPR'].map(name => this.scene.getMeshByName(name));
      meshesToDispose.forEach(m => {
        m.material.emissiveTexture.dispose();
        m.material.dispose();
        m.dispose();
      })
    }

    // Render loop logic for whenever first person cam is being automatically panned (e.g. to look at posters)
    this.engine.runRenderLoop(() => {
      if(this.camera1LookAt) {
        this.camera1.setTarget(new BABYLON.Vector3(this.camera1LookAt.x, this.camera1LookAt.y, this.camera1LookAt.z));
      }
    });

    // Initialize admin controls
    this.adminControls = new AdminControls( this );
  }

  /**
  Overridden, called for every mesh when safe. World starts with collisions turned off.
   */
  setMeshCollisions(mesh, state) {
    if ( !mesh.name.startsWith('Lamp')) {
      mesh.checkCollisions = state;
    }
  }

  handleClick(pointerInfo) {
    if ( this.activeCameraType === 'free' ) {
      return;
    }
    if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP
      && pointerInfo.event.button == 0 // LMB
      // regex to match red bar stool top mesh name:
      && /Chair_.*_Red_15380.*/.test(pointerInfo.pickInfo.pickedMesh.name)
    ) {
      var dest = new BABYLON.Vector3(pointerInfo.pickInfo.pickedPoint.x, pointerInfo.pickInfo.pickedPoint.y+.5, pointerInfo.pickInfo.pickedPoint.z);
      var pos = this.camera1.position.clone();
      var distance = dest.subtract(pos).length();
      //console.log( distance, pos, dest);
      if ( distance < 2 ) {
        if ( ! this.animateCamera ) {
          this.animateCamera = VRSPACEUI.createAnimation(this.camera1, "position", 1);
        }
        VRSPACEUI.updateAnimation(this.animateCamera, pos, dest);
      }
    }
  }

  trackAvatarRotations(enable) {
    if ( this.trackAvatarRotation == enable ) {
      return;
    }
    this.trackAvatarRotation = enable;
    this.worldManager.customOptions.trackAvatarRotation = enable;
    this.worldManager.mediaStreams.clients.forEach( (client) => {
      client.video.applyRotation(this.trackAvatarRotation);
    });

    this.video.applyRotation(this.trackAvatarRotation);
    if ( this.trackAvatarRotation ) {
      this.video.back.position = new BABYLON.Vector3( 0, 0, -0.001);
    } else {
      this.video.back.position = new BABYLON.Vector3( 0, 0, 0.001);
    }
    if ( '3p' === this.activeCameraType ) {
      this.stopTrackingRotation();
      this.startTrackingRotation();
    }
  }

  updateDisplay(display, video) {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    var mesh = this.scene.getMeshByName(display);
    // Dispose meshes since we can't update videos and need to recreate them
    if(mesh.material && mesh.material.diffuseTexture) {
      mesh.material.diffuseTexture.dispose();
    }
    if(mesh.material && mesh.material.emissiveTexture) {
      mesh.material.emissiveTexture.dispose();
    }
    if(mesh.material) {
      mesh.material.dispose();
    }
    var material = new BABYLON.StandardMaterial(display + "Material", this.scene);
    material.backFaceCulling = false;
    var texture = new BABYLON.VideoTexture(display + "Texture",
      video,
      this.scene, true, true, null,
      {
        autoUpdateTexture: true,
        autoPlay: true,
        muted: true,
        loop: true
      });
    material.diffuseTexture = texture;
    for(var property of Object.keys(this.displayConfig[display].diffuseTexture)) {
      var textureScale = this.properties.displayProperties[display].textureScale ? this.properties.displayProperties[display].textureScale : 1;
      material.diffuseTexture[property] = this.displayConfig[display].diffuseTexture[property] * textureScale;
    }
    material.emissiveTexture = texture;
    mesh.material = material;
    if(display === 'skyBox') {
      this.toggleSkybox(true);
    }
  }

  async castUser(display, userId) {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    return new Promise((resolve, reject) => {
      var attempt = () => {
        var video = this.mediaStreams.fetchPeerVideoElement(userId);
        if (video) {
          this.updateDisplay(display, video);
          clearInterval(interval);
          resolve();
        }
      }
      attempt();
      var interval = setInterval(() => attempt(), 500);
    })
  }

  // Initialize the displays using current displayProperties
  async initializeDisplays() {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    // Remove these guys once video playing starts
    this.scene.getMeshByName("LogoText").visibility = 0;
    this.scene.getMeshByName("LogoSign").visibility = 0;

    var displayProperties = this.properties.displayProperties;
    for(var display of Object.keys(displayProperties)) {
      if(displayProperties[display].video_id !== null) {
        var video_url = this.videos[displayProperties[display].video_id].url;
        this.updateDisplay(display, video_url);
      }
      if(displayProperties[display].user_id !== null) {
        this.castUser(display, displayProperties[display].user_id);
      }
    }
  }

  // custom video/audio streaming support methods
  async showVideo(altImage) {
    let avatarOptions = {
      radius: this.videoAvatarSize,
      avatarHeight: this.avatarHeight,
      videoAvatarSize: this.videoAvatarSize,
      trackAvatarRotation: this.trackAvatarRotation
    };
    if ( altImage ) {
      avatarOptions.altImage = altImage;
    }
    if ( ! this.video ) {
      this.video = new HoloAvatar( this.scene, null, avatarOptions);
      this.video.autoAttach = false;
      this.video.camera = this.camera1;
      this.video.autoStart = false;
      this.video.show(false);
      if ( this.trackAvatarRotation ) {
        this.video.back.position = new BABYLON.Vector3( 0, 0, -0.001);
      }

      // tracking movement of this mesh allows to send different position and/or orientation
      this.movementTracker = BABYLON.MeshBuilder.CreateDisc("MovementTracker", {radius:this.radius}, this.scene);
      this.movementTracker.setEnabled(false); // never displayed
      this.movementTracker.ellipsoid = this.video.mesh.ellipsoid;
      this.video.movementTracker = this.movementTracker;

      this.video.attachToCamera(this.fpsWebcamPreviewPos);
      if ( '1p' !== this.activeCameraType ) {
        this.video.detachFromCamera();
      }
    }
  }

  startVideo(device) {
    this.video.device = device;
    this.video.displayVideo(device);
    this.publishing = true;
    this.mediaStreams.videoSource = device;
    this.mediaStreams.startVideo = true;
    if ( this.connected ) {
      this.mediaStreams.publishVideo(true);
    }
  }

  stopVideo() {
    if ( this.video ) {
      this.video.displayAlt();
    }
    this.publishing = false;
    this.mediaStreams.videoSource = false;
    this.mediaStreams.startVideo = false;
    if ( this.connected ) {
      this.mediaStreams.publishVideo(false);
    }
  }

  startAudio(device) {
    this.mediaStreams.audioSource = device;
    this.mediaStreams.startAudio = true;
    if ( this.connected ) {
      this.mediaStreams.publishAudio(true);
    }
  }

  stopAudio() {
    this.mediaStreams.audioSource = false;
    this.mediaStreams.startAudio = false;
    if ( this.connected ) {
      this.mediaStreams.publishAudio(false);
    }
  }

  connect(name, fps, audioDeviceId, playbackDeviceId, callback) {
    // change text on video avatar:
    this.video.altText = name;
    if ( ! this.publishing ) {
      this.video.displayAlt();
    }

    this.connectHiFi(audioDeviceId, false, playbackDeviceId);

    this.worldManager = new WorldManager(this, fps);
    this.worldManager.customOptions = {
      radius: this.videoAvatarSize,
      avatarHeight: this.avatarHeight,
      videoAvatarSize: this.videoAvatarSize,
      trackAvatarRotation: this.trackAvatarRotation,
      emojiEvent: (obj) => this.animateAvatar(obj),
      chatEvent: (obj) => this.chat.execute(obj.chatEvent),
      stageEvent: (obj) => this.stageControls.execute(obj.stageEvent),
      adminEvent: (obj) => this.adminControls.execute(obj.adminEvent),
      properties: (obj) => {
        console.log("Properties:", obj.properties);
      }
    };
    this.worldManager.avatarFactory = (obj) => this.createAvatar(obj);
    // Use this for testing purposes, to randomize avatar movement:
    //this.worldManager.avatarFactory = this.randomizeAvatar;
    this.worldManager.mediaStreams = this.mediaStreams;
    this.mediaStreams.worldManager = this.worldManager;

    //this.worldManager.trackRotation = this.trackAvatarRotation; // track rotation to show avatar's direction

    this.worldManager.debug = false; // client debug
    this.worldManager.VRSPACE.debug = false; // network debug

    this.worldManager.VRSPACE.addErrorListener( (error) => {
      console.log("SERVER ERROR: "+error );
    });

    // TODO refactor this into WorldManager promisses
    var enter = (welcome) => {
      // first remove welcome listner, to prevent responding to 2nd welcome
      this.worldManager.VRSPACE.removeWelcomeListener(enter);
      // name MUST be unique, using own ID ensures it
      if ( ! name || "N/A" === name ) {
        name = "u"+this.worldManager.VRSPACE.me.id;
        // also write it to own avatar
        this.video.altText = name;
        // force displayText again if web cams are off since otherwise it shows 'N/A'
        if(this.userSettings.enableWebcamFeeds === false) {
          this.video.displayAlt();
        }
      }

      // set own properties
      this.worldManager.VRSPACE.sendMy("name", name );
      this.worldManager.VRSPACE.sendMy("mesh", "video");
      if ( this.video.altImage ) {
        this.worldManager.VRSPACE.sendMy("properties", {altImage:this.video.altImage, soundStageUserId: this.spaceConfig.user_id, soundStageUserAlias: this.spaceConfig.alias, soundStageUserRole: this.spaceConfig.role});
      }
      this.worldManager.VRSPACE.sendMy("position:", {x:this.camera1.position.x, y:0, z:this.camera1.position.z});
      // enter a world
      this.worldManager.VRSPACE.sendCommand("Enter", {world: this.spaceConfig.space_slug});
      // start session
      this.worldManager.VRSPACE.sendCommand("Session");

      // Initialize displays with default videos
      this.initializeDisplays();

      // SHARED STATE MANGLING
      // custom scene listener, listening for shared state object
      VRSPACE.addSceneListener((e) => this.findSharedState(e));

      // add chatroom id to the client, and start streaming
      welcome.client.token = this.spaceConfig.space_slug;
      this.worldManager.pubSub(welcome.client);

      this.connected = true;
      if ( callback ) {
        callback(welcome);
      }
    }
    this.worldManager.VRSPACE.addWelcomeListener(enter);

    // Override VRSpace connect function so it uses url from process.env
    this.worldManager.VRSPACE.connect = function (url) {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        this.connectionListeners.forEach((listener)=>listener(true));
      }
      this.ws.close = () => {
        this.connectionListeners.forEach((listener)=>listener(false));
      }
      this.ws.onmessage = (data) => {
        this.receive(data.data);
        this.dataListeners.forEach((listener)=>listener(data.data));
      }
      this.log("Connected!")
    }
    this.worldManager.VRSPACE.connect(process.env.VUE_APP_SERVER_URL);
  }

  findSharedState(e) {
    if ( e.added && e.added.properties && e.added.properties.name == 'worldState') {
      this.worldState = e.added;
      console.log('Shared world properties:', e.added.properties);
      this.properties = e.added.properties;
      this.applyState();
      // CHECKME add listener here to track changes to state
    }
  }
  // create shared state object if not exists
  async createSharedState() {
    var o = {
        //permanent:true,
        properties: {
          name:'worldState',
          displayProperties: this.defaultDisplayProperties,
          activeMood: this.stageControls.activeMood,
          fogSetting: this.stageControls.fogSetting,
          environmentIntensity: this.scene.environmentIntensity,
          environmentTexture: this.stageControls.activeCubeTexture,
          pedestalColor: this.stageControls.pedestal.material.emissiveColor,
          DJSpotLightIntensity: this.DJSpotLightIntensity,
          DJPlatformRaised: this.stageControls.DJPlatformRaised,
          tunnelLightsOn: this.stageControls.tunnelLightsOn,
          gridFloorOn: this.stageControls.gridFloorOn,
          moodParticlesOn: this.stageControls.moodParticlesOn,
        }
    };
    o.temporary=false;
    return new Promise((resolve,reject) => {
      VRSPACE.createSharedObject(o, (obj)=>{
        console.log("Created shared object", obj);
        this.worldState = obj;
        resolve(obj);
      });
    });
  }

  async shareProperties() {
    if ( ! this.worldState ) {
      await this.createSharedState();
      // CHECKME: do it here?
      //this.startSavingState();
    }
    this.worldState.properties = this.properties;
    this.worldState.publish();
  }

  createAvatar(obj) {
    if(this.spaceConfig.blocklist.indexOf(obj.properties.soundStageUserId) !== -1) {
      return false;
    }
    let avatar = new HoloAvatar( this.worldManager.scene, null, this.worldManager.customOptions );
    // obj is the client object sent by the server

    if ( obj.properties ) {
      // apply avatar alt image
      if ( obj.properties.altImage ) {
        avatar.altImage = obj.properties.altImage;
      }
    }
    return avatar;
  }
  randomizeAvatar(obj) {
    var avatar = this.createAvatar();
    var randomizer = new Worker('/babylon/randomizer.js');
    randomizer.addEventListener('message', (e) => {
      var changes = {position: e.data};
      this.worldManager.VRSPACE.processEvent( {Client:obj.id}, changes );
      // OR this:
      //Object.assign(obj,changes);
      //obj.notifyListeners(changes);
    }, false);
    randomizer.postMessage(
      {
        interval: {min: 200, max:1000},
        min:{x:-3,y:0,z:-5},
        max:{x:7,y:2,z:2},
        distance: {min: 0, max: 1}
      }
    );
    return avatar;
  }

  loadEmojis( callback ) {
    // emojis
    this.emojis = new Emojis(this, this.camera1.position, callback );
    this.emojis.init();
  }

  initStageControls( callback ) {
    // stage controls
    this.stageControls = new StageControls(callback, this.userSettings, this );
    this.stageControls.init();
    this.cineCam = new CinemaCamera(this.cameraFree, this.scene)
    document.addEventListener('keydown', (event) => {
      if(event.key === '/') {
        this.cineCam.showHideUI(!document.body.querySelector(".ui-hide").classList.contains('hidden'));
        return;
      }
      if(event.key === '*') {
        this.cineCam.pauseOnOff();
        return;
      }
      if(!event.altKey && !event.ctrlKey) {
        return;
      }
      if(this.cineCam.animations[event.key]) {
        this.activateCamera('free');
        this.cineCam.play(event.key, event.altKey ? 50 : null);
      }
    });
  }

  animateAvatar(obj) {
    console.log(obj);
    if ( ! obj.emojis ) {
      obj.emojis = this.emojis.copy();
    }
    obj.emojis.position = obj.position;
    obj.emojis.avatar = obj;
    obj.emojis.execute(obj.emojiEvent.emoji);
  }

  async getAudioStreamSettings(audioDeviceId, computerAudioStream) {
    window.audioStream = null;
    window.primaryAudioSourceNode = null;
    window.audioGainNode = null;
    let stereo;
    let audioConstraints;

    if(this.userSettings && (this.userSettings.enableStereo || computerAudioStream)) {

      window.audioContext = new AudioContext({
        sampleRate: 48000
      });

      let audioStreamDestination = await window.audioContext.createMediaStreamDestination();

      /* Primary audio source */
      window.primaryAudioSourceNode = window.audioContext.createMediaStreamSource(
        await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: audioDeviceId,
            autoGainControl: false,
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 48000,
            sampleSize: 16
          }
        })
      );

      /* Gain node */
      window.audioGainNode = window.audioContext.createGain();

      // Add computer audio node if sharing computer audio
      if(computerAudioStream && this.userSettings.sendingMusic) {
        /* Computer audio source */
        window.computerAudioSourceNode = window.audioContext.createMediaStreamSource(computerAudioStream);
        window.computerAudioSourceNode.connect(window.audioGainNode);
      }

      // Add external audio node
      if(!computerAudioStream) { // Include  if it's our primary audio source
        window.primaryAudioSourceNode.connect(window.audioGainNode);
      } else if(computerAudioStream && !this.userSettings.sendingMusic) { // Include if sharing computer audio but we're not sending music
        window.primaryAudioSourceNode.connect(window.audioGainNode);
      } else if(computerAudioStream && this.userSettings.sendingMusic && this.userSettings.includeAudioInputInMix) { // Include if sharing computer audio, sending music, and mixing in audio device
        window.primaryAudioSourceNode.connect(window.audioGainNode);
      }

      /* Connect to destination */
      window.audioGainNode.connect(audioStreamDestination);

      /* Apply custom value */
      // window.audioGainNode.gain.setValueAtTime(1 + (this.userSettings.stereoGainBoost / 100), window.audioContext.currentTime);

      window.audioStream = audioStreamDestination.stream;

      stereo = true;
    } else {
      audioConstraints = {
        deviceId: audioDeviceId,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      }
      stereo = false;
      window.audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
    }
    return { audioStream: window.audioStream, stereo }
  }

  async connectHiFi(audioDeviceId, computerAudioStream, playbackDeviceId, forceMute) {
    var interval = null;
    if(!this.hifi) {
      this.hifi = new HighFidelityAudio.HiFiCommunicator({
        userDataStreamingScope: HighFidelityAudio.HiFiUserDataStreamingScopes.Peers,
        onConnectionStateChanged: (state) => {
          console.log("HiFi state", state);
          this.state = state;
          if ( "Disconnected" === state && !interval) {
            console.log("Reconnecting to audio server");
            interval = setInterval(() => this.connectHiFi(audioDeviceId, computerAudioStream, playbackDeviceId), 5000);
          } else if ("Connected" === state && interval) {
            clearInterval(interval);
            interval = null;
          }
        },
        onUsersDisconnected: (peers) => {
          for(let peer of peers) {
            delete this.hifi.peers[peer.hashedVisitID];
          }
        }
      });
      if(!this.hifi.peers) {
        this.hifi.peers = {};
      }
      this.hifi.updatePeerVolume = (peer) => {
        let peerVolume = peer.isStereo ? parseInt(this.userSettings.musicVolume) / 100 * 3: parseInt(this.userSettings.voiceVolume) / 100;
        if(this.spaceConfig.mutelist.indexOf(parseInt(peer.providedUserID)) !== -1 || this.spaceConfig.blocklist.indexOf(parseInt(peer.providedUserID)) !== -1) {
          peerVolume = 0;
        }
        this.hifi.setOtherUserGainForThisConnection(peer.hashedVisitID, peerVolume);
      }
    }
    if ( this.mediaStreams.audioSource && this.mediaStreams.startAudio ) {
      let { audioStream, stereo } = await this.getAudioStreamSettings(audioDeviceId, computerAudioStream);
      await this.hifi.setInputAudioMediaStream(audioStream, stereo);

      let voiceSettings = {
        isStereo: false,
        hiFiGain: 1,
        userAttenuation: 0
      };
      let stereoSettings = {
        isStereo: true,
        hiFiGain: 0.2 + (this.userSettings.stereoGainBoost / 100),
        userAttenuation: 0.0000001,
        userRolloff: 999999,
        volumeThreshold: -96
      };
      let settings = stereo ? stereoSettings : voiceSettings;
      this.hifi.updateUserDataAndTransmit(settings)
      this.hifi._inputAudioMediaStream.isStereo = stereo; // even though this isn't needed for hifi we do it because spatializeAudio looks for this (will revisit)
    }

    let isStereoSubscription = new HighFidelityAudio.UserDataSubscription({
      components: [HighFidelityAudio.AvailableUserDataSubscriptionComponents.IsStereo],
      callback: (data) => {
        for(let peer of data) {
          this.hifi.peers[peer.hashedVisitID] = peer;
          this.hifi.updatePeerVolume(peer);
        }
      }
    });

    var volumeHighlightLayer = new BABYLON.HighlightLayer("volumeHighlightLayer", this.scene);
    var alpha = 0;
    this.scene.registerBeforeRender(() => {
      alpha += 0.06;
      volumeHighlightLayer.blurHorizontalSize = 1 + Math.cos(alpha) * 0.6 + 0.6;
      volumeHighlightLayer.blurVerticalSize = 1 + Math.sin(alpha / 3) * 0.6 + 0.6;
    });
    volumeHighlightLayer.outerGlow = false;
    let volumeDecibelsSubscription = new HighFidelityAudio.UserDataSubscription({
      components: [HighFidelityAudio.AvailableUserDataSubscriptionComponents.VolumeDecibels],
      callback: (data) => {
        for(let peer of data) {
          this.worldManager.VRSPACE.scene.forEach(c => {
            if(c.className === "Client") {
              let clientMesh = this.scene.getMeshByID(`Client ${c.id}`);
              if(clientMesh) {
                if (this.spaceConfig.mutelist.indexOf(c.properties.soundStageUserId) !== -1) {
                  clientMesh.renderOverlay = true;
                  clientMesh.overlayAlpha = 0.2;
                  clientMesh.overlayColor = new BABYLON.Color3(50, 0, 50);
                  volumeHighlightLayer.addMesh(clientMesh, new BABYLON.Color3(0, 0, 0));
                } else if (this.spaceConfig.mutelist.indexOf(c.properties.soundStageUserId) === -1 && c.properties.soundStageUserId === parseInt(peer.providedUserID) && this.hifi.peers[peer.hashedVisitID].isStereo === false && peer.volumeDecibels > -30) {
                  clientMesh.renderOverlay = false;
                  let color = peer.volumeDecibels > -5 ? new BABYLON.Color4(0.5, 0, 0, 0.7) : new BABYLON.Color4(0.35, 0, 1, 0.7);
                  volumeHighlightLayer.addMesh(clientMesh, color);
                } else {
                  clientMesh.renderOverlay = false;
                  volumeHighlightLayer.removeMesh(clientMesh);
                }
              }
            }
          })
        }
      }
    });

    this.hifi.addUserDataSubscription(isStereoSubscription);
    this.hifi.addUserDataSubscription(volumeDecibelsSubscription);

    this.changePlaybackDevice(playbackDeviceId);
    if(forceMute) {
      this.hifi.setInputAudioMuted(true)
    }

    if(this.state === 'Connected') {
      return;
    }

    this.hifi.connectToHiFiAudioAPIServer(this.spaceConfig.highFidelity.token, this.spaceConfig.highFidelity.url).then(() => {
      console.log('HiFi connected');
      var outputStream = this.hifi.getOutputAudioMediaStream();
      var outputElement = document.getElementById('audioOutput');
      // and now bind that output somewhere
      outputElement.srcObject = outputStream;
      outputElement.play();
    });
  }

  async changePlaybackDevice(playbackDeviceId) {
    if(!playbackDeviceId) {
      return;
    }
    console.log('playbackDeviceSet to', playbackDeviceId);
    document.getElementById('audioOutput').setSinkId(playbackDeviceId);
  }

  // see https://experiments.highfidelity.com/space-inspector/
  spatializeAudio() {
    if ( ! this.connected ) {
      return;
    }
    //console.log(changes);
    var pos = {};
    var stagePos = {
      orientationEuler: {
        pitchDegrees: -7.646941233545094,
        rollDegrees: 0,
        yawDegrees: 0
      },
      position: {
        x: -2.1,
        y: 1.2,
        z: 4.8
      }
    }
    if(this.hifi && this.hifi._inputAudioMediaStream && this.hifi._inputAudioMediaStream.isStereo) {
      pos = stagePos;
    } else if ( this.activeCameraType === '1p' ) {
      this.audioData( pos, this.camera1 );
    } else if ( this.activeCameraType === '3p' ) {
      var rotY = 1.5*Math.PI-this.camera3.alpha;
      // we can track position of either cam1 or cam3
      // tracking cam1 because that's where avatar is
      this.audioData( pos, this.camera1, {x:0, y:rotY, z:0});
    } else if ( this.activeCameraType === 'free' ) {
      if(!document.querySelector('#freeCamSpatialAudio') || document.querySelector('#freeCamSpatialAudio').value === "freecam") {
        this.audioData( pos, this.cameraFree );
      } else if(document.querySelector('#freeCamSpatialAudio').value === "avatar") {
        this.audioData( pos, this.camera1 );
      } else {
        pos = stagePos;
      }
    } else {
      console.log("ERROR: no active camera, can't spatialize audio");
    }
    if ( Object.keys(pos).length > 0 ) {
      var data = new HighFidelityAudio.HiFiAudioAPIData( pos );
      this.hifi.updateUserDataAndTransmit(data);
    }
  }

  audioData( pos, camera, rotation ) {
    if ( ! rotation ) {
      rotation = camera.rotation;
    }
    pos.position = {x:-camera.position.x, y:camera.position.y*2, z:camera.position.z};
    pos.orientationEuler = {
      pitchDegrees:this.degrees(0),
      yawDegrees:this.degrees(Math.PI-rotation.y),
      rollDegrees:this.degrees(0)
    };
  }
  degrees( radians ) {
    return radians * 180/Math.PI;
  }

  createDummies(dummiesToCreate, resolution) {
    this.dummies.forEach((d) => {
      d.dispose();
    });
    this.dummies = [];
    for(var i = 0; i < dummiesToCreate; i ++) {
      this.dummies.push(this.createDummy(i, resolution));
    }
  }

  createDummy(number, quality ) {
    let positions = [
      {"_x":5.431473387209395,"_y":0.5020392882823944,"_z":-5.379895471447654},
      {"_x":3.3235838153452697,"_y":0.5020392882823944,"_z":-3.830576919646698},
      {"_x":1.2595007160994276,"_y":0.5020392882823944,"_z":-5.1334413361500255},
      {"_x":-1.5881198566465093,"_y":0.6329896050691606,"_z":-1.2021913729740887},
      {"_x":5.162093555837903,"_y":0.5020392882823944,"_z":-0.42446105020153335},
      {"_x":5.051873055058412,"_y":0.6329896050691605,"_z":2.042682870518125},
      {"_x":3.352004892532538,"_y":1.3393885695204033,"_z":3.8801678358589085},
      {"_x":1.393176067234968,"_y":1.2254167024833897,"_z":3.9309678017287584},
      {"_x":-2.191082690269314,"_y":0.7770091640949249,"_z":1.3946084986112277},
      {"_x":-4.270700864586993,"_y":0.5020392882823944,"_z":-1.713672772760245},
      {"_x":0.8964818847758403,"_y":3.3229227411746978,"_z":-4.298324330174525},
      {"_x":3.470550831206224,"_y":3.3229227411746978,"_z":-4.164816288998033},
      {"_x":5.89041647722795,"_y":2.995744887228546,"_z":-2.3368800041086937},
      {"_x":4.0819664037074395,"_y":2.1217238056659697,"_z":5.140607416945104},
      {"_x":2.235303563470356,"_y":3.1557497284075087,"_z":3.4052582763762054},
      {"_x":1.3711427861898955,"_y":3.546687897946941,"_z":0.7876047108635504},
      {"_x":-0.20218481979116307,"_y":1.4116190421581267,"_z":-6.227786819017921},
      {"_x":0.828867822310814,"_y":1.2243401493132113,"_z":-5.5320242087012526},
      {"_x":2.6232275099385274,"_y":0.5020392882823944,"_z":-4.914173842288647},
      {"_x":8.109559771755414,"_y":1.4930522810631008,"_z":-1.4371147204249968},
      {"_x":2.4168876186861725,"_y":1.9688320344361705,"_z":-0.46268751358159976},
      {"_x":-0.05159295557449093,"_y":3.615399218240563,"_z":0.03285726818975975},
      {"_x":1.7835875133065917,"_y":1.0714961487054824,"_z":4.369689563862487},
      {"_x":0.6480836065478226,"_y":2.568219899790182,"_z":-0.1699217262229682},
      {"_x":4.231955974264574,"_y":0.5020392882823944,"_z":0.017005001353289036},
      {"_x":-1.7194037453857578,"_y":0.7770091640949249,"_z":-0.8632915693674342},
      {"_x":-0.19120177742184197,"_y":4.10115071860869,"_z":5.439225920669849},
      {"_x":8.080251695952205,"_y":1.0645160429861407,"_z":-2.27031636858793},
      {"_x":8.472989485689123,"_y":3.0106141912937163,"_z":1.7547324889436016},
      {"_x":2.88880261095007,"_y":5.0753859922002595,"_z":-1.2068022883260847},
      {"_x":1.0582747485632122,"_y":0.5020392882823944,"_z":1.3245961054324362},
      {"_x":-4.1997014394575585,"_y":1.2257839815025804,"_z":2.8141881968840297},
      {"_x":-3.9589822131325,"_y":1.0917528617382048,"_z":4.741924775033939},
      {"_x":-1.810621042022851,"_y":1.1634340929985045,"_z":3.3114265029519605},
      {"_x":5.921978747490941,"_y":1.1580462724115423,"_z":4.943747938548314},
      {"_x":6.955342512004644,"_y":1.2743175971508025,"_z":4.410383852153069},
      {"_x":8.674166301124101,"_y":1.0891495692729949,"_z":5.120037739257379},
      {"_x":4.7412671753889635,"_y":3.848582282584671,"_z":-0.5359687160095843},
      {"_x":-1.7933221692824717,"_y":3.4265336360469827,"_z":-1.7183760046815826},
      {"_x":-0.9318402267356171,"_y":1.557477130473056,"_z":-2.8948274460088275},
      {"_x":-0.1892548597299717,"_y":2.1217238056659697,"_z":5.185895405028419}
    ]

    let videos = {
      'qvga-15': ['https://assets.soundstage.fm/vr/Ara-QVGA-15FPS.mp4'],
      'vga-15': ['https://assets.soundstage.fm/vr/Ara-VGA-15FPS.mp4','https://assets.soundstage.fm/vr/Purple-Tunnel-VGA-15FPS.mp4',],
      'hd-15': ['https://assets.soundstage.fm/vr/Ara-HD-15FPS.mp4'],
      'hd-30': ['https://assets.soundstage.fm/vr/Ara-HD-30FPS.mp4']
    }
    let randomVideoIndex = Math.floor(Math.random() * (videos[quality].length)) + 0;
    let randomVideo = videos[quality][randomVideoIndex];

    let video = new DummyAvatar( this.worldManager.scene, null, { ...this.worldManager.customOptions, ...{ videoUrl: randomVideo } } );
    video.show();
    video.mesh.name = 'dummy-' + number;
    video.mesh.id = "DummyAvatar-" + number;

    var parent = new BABYLON.TransformNode("Root of "+video.mesh.id, this.scene);
    video.mesh.parent = parent;

    var position = positions[number];
    parent.position = new BABYLON.Vector3(position._x, (position._y - 0.5020392882823944), position._z);
    return video;
  }

  async togglePosters(show) {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    var spaceConfig = this.spaceConfig;
    return new Promise((resolve, reject) => {
      var attempt = () => {
        var posterGallery = this.scene.getTransformNodeByName("posterGallery");
        if(!posterGallery) {
          return;
        }
        var posters = posterGallery.getChildren();
        if(posters && posters.length === spaceConfig.posters.length) {
          for (var poster of posters) {
            if (poster._position.y > 3) {
              this.fadeMesh(poster, show ? 1 : 0)
            }
          }
          clearInterval(interval);
          resolve();
        }
      }
      attempt();
      var interval = setInterval(() => attempt(), 500);
    })
  }

  async toggleSkybox(show) {
    // If we're already showing the skybox, return
    if(show === this.skyboxVisible) {
      return;
    }
    this.skyboxVisible = show;

    if(!show) {
      var skybox = this.scene.getMeshByName('skyBox');
      setTimeout(() => {
        skybox.material.emissiveTexture.dispose();
        skybox.material.diffuseTexture.dispose();
        skybox.material.dispose();
      }, 3000);
    }

    // Fully transparent
    for(meshName of this.skyboxManifest.meshesToHide) {
      this.fadeMesh(this.scene.getMeshByName(meshName), show ? 0 : 1)
    }
    for(meshName of this.skyboxManifest.barMeshes) {
      this.fadeMesh(this.scene.getMeshByName(meshName), show ? 0 : 1)
    }
    var rootMeshes = this.scene.getMeshByName("__root__").getChildren();
    for(var mesh of rootMeshes) {
      if(mesh.name === "Cube") {
        this.fadeMesh(mesh, show ? 0 : 1)
      }
    }

    if(this.spaceConfig.posters) {
      this.togglePosters(!show); // Flip value since we want to hide posters when showing skybox
    }

    // Half opacity
    for(var meshName of this.skyboxManifest.halfOpacityMeshes) {
      this.fadeMesh(this.scene.getMeshByName(meshName), show ? 0.5 : 1)
    }

    // 1/3rd opacity
    for(var meshName of this.skyboxManifest.oneThirdOpacityMeshes) {
      this.fadeMesh(this.scene.getMeshByName(meshName), show ? 0.35 : 1)
    }

    // 1/4th opacity
    for(var meshName of this.skyboxManifest.quarterOpacityMeshes) {
      this.fadeMesh(this.scene.getMeshByName(meshName), show ? 0.25 : 1)
    }
  }

  fadeMesh(mesh, opacity) {
    var fadeInterval;
    var fadeStep = function(mesh, targetOpacity) {
      if(mesh.visibility < targetOpacity) {
        mesh.visibility = parseFloat((mesh.visibility += .005).toFixed(3));
      } else if(mesh.visibility > targetOpacity) {
        mesh.visibility = parseFloat((mesh.visibility -= .005).toFixed(3));
      } else {
        clearInterval(fadeInterval);
      }
    }
    fadeInterval = setInterval(() => fadeStep(mesh, opacity), 10);
  }

  rescaleSkybox(scale) {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    var targetVscale = 5 * scale;
    var targetUscale = 3 * scale;
    var uScaleStepSize = .01;
    var vScaleStepSize = .02;

    var rescaleStep = (texture, targetVscale, targetUscale) => {
      if(texture.vScale < targetVscale) {
        texture.vScale = parseFloat((texture.vScale += vScaleStepSize).toFixed(2));
      } else if(texture.vScale > targetVscale) {
        texture.vScale = parseFloat((texture.vScale -= vScaleStepSize).toFixed(2));
      }
      if(texture.uScale < targetUscale) {
        texture.uScale = parseFloat((texture.uScale += uScaleStepSize).toFixed(2));
      } else if(texture.uScale > targetUscale) {
        texture.uScale = parseFloat((texture.uScale -= uScaleStepSize).toFixed(2));
      }
      if(texture.uScale === targetUscale && texture.vScale === targetVscale) {
        clearInterval(rescaleInterval);
      }
    }
    var material = this.scene.getMeshByName('skyBox').material;
    if(material) {
      var rescaleInterval = setInterval(() => rescaleStep(material.diffuseTexture, targetVscale, targetUscale), 1);
    }
  }

  adjustGraphicsQuality(setting, callback) {

    this.stageControls.userSettings.graphicsQuality = setting;

    var setVisibility = (meshes, isVisible) => {
      this.scene.meshes.forEach(mesh => {
        for(let name of meshes) {
          if (mesh.name.includes(name)) {
            mesh.visibility = isVisible;
          }
        }
      });
    }

    var aa_samples;
    var hardware_scaling_level = 1;
    var meshList = ["Sampler", "Mixer", "Player", "Display"];
    switch(setting) {
      case "very-low":
        hardware_scaling_level = 2;
        setVisibility(meshList, false);
        aa_samples = 1;
        break;
      case "low":
        setVisibility(meshList, false);
        hardware_scaling_level = 1.375;
        aa_samples = 2;
        break;
      case "medium":
        setVisibility(meshList, false);
        aa_samples = 4;
        break;
      case "high":
      case "ultra-high":
        setVisibility(meshList, true);
        aa_samples = 8;
        break;
    }
    this.engine.setHardwareScalingLevel(hardware_scaling_level);
    let pipeline = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
    pipeline.samples = aa_samples;
    this.initBarLights();
    this.initDJSpotLight();
    this.initClearCoat();
    if(this.spaceConfig.mode === 'soundclub') {
      this.initStoreLight();
    }

    // Lights optimization
      if (this.scene.getTransformNodeByName("allBarLights")) {
        this.scene.getTransformNodeByName("allBarLights").dispose();
      }
    if (setting === "high" || setting === "ultra-high") {
      let maxLights = 8; // Sets max lights for material
      let allBarLights = new BABYLON.TransformNode("allBarLights");
      //TODO: Add includedOnlyMeshes to DJ Spotlight too - after model remake
      this.barLights.forEach(light => {
        this.scene.meshes.forEach(mesh => {
          // TODO: Rewrite function and mesh name after model remake
          if (mesh.name.includes("Chair_") || mesh.name.includes("Bar_counter") || mesh.name.includes("Lamp") || mesh.name.includes("Room")) {
            if (!light.includedOnlyMeshes.includes(mesh))
              light.includedOnlyMeshes.push(mesh); // Array of only needed meshes to minimize computations
          }
          // TODO: Rewrite function after model remake
          if (mesh.name.includes("Room") || mesh.name.includes("Bar_counter"))  {
            mesh.material.maxSimultaneousLights = maxLights; // Adding more lights to the room materials
            console.log("maxSimultaneousLights = " + maxLights + " for Material ", mesh.material.name);
          }
        });
        console.log(light.includedOnlyMeshes.length + " Meshes pushed to ", light.name);
        light.parent = allBarLights;
      });
    }
    console.log("BarLights ", this.barLights);
    console.log("Graphics quality: " + setting);
    this.scene.getMeshByName("Sweep.1").isVisible = false; // Tunnel threshold for collisions

    // Mood Particles
    this.stageControls.toggleMoodParticles(this.stageControls.moodParticlesOn);

    if(callback) {
      callback();
    }
  }

// FOR TESTING, WILL BE REMOVED
  HDRControl(event) {
    // environmentIntensity Control
    if(event.key === "-") {
      this.scene.environmentIntensity -= 0.01;
      console.log("this.scene.environmentIntensity: " + this.scene.environmentIntensity);
    }
    if(event.key === "=") {
      this.scene.environmentIntensity += 0.01;
      console.log("this.scene.environmentIntensity: " + this.scene.environmentIntensity);
    }
    // Pipeline AA samples Control
    if (event.key === "1") {
      let tempPipe = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
      if (tempPipe.samples > 1) {
        tempPipe.samples -= 1;
        console.log("AA Samples: " + tempPipe.samples);
      }
    }
    if (event.key === "2") {
      let tempPipe = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
      if (tempPipe.samples < 8) {
        tempPipe.samples += 1;
        console.log("AA Samples: " + tempPipe.samples);
      }
    }

    // Temporary Controls
    if (event.key === "3") {     // Mixer disposal, until the model remake
      this.scene.meshes.forEach(mesh => {
        if (mesh.name.includes("Sampler") || mesh.name.includes("Mixer") || mesh.name.includes("Player") || mesh.name.includes("Display") ) {
          if (mesh.material) {
            if (mesh.material.albedoTexture) {
              console.log("albedoTexture: " + mesh.material.albedoTexture.name + " disposed");
              mesh.material.albedoTexture.dispose();
            }
            if (mesh.material.emissiveTexture) {
              console.log("emissiveTexture: " + mesh.material.emissiveTexture.name + " disposed");
              mesh.material.emissiveTexture.dispose();
            }
            if (mesh.material.bumpTexture) {
              console.log("bumpTexture: " + mesh.material.bumpTexture.name + " disposed");
              mesh.material.bumpTexture.dispose();
            }
            if (mesh.material.ambientTexture) {
              console.log("ambientTexture: " + mesh.material.ambientTexture.name + " disposed");
              mesh.material.ambientTexture.dispose();
            }

            console.log("MATERIAL: " + mesh.material.name + " disposed");
            mesh.material.dispose();
          }
          console.log("MESH: " + mesh.name + " disposed")
          mesh.dispose();
        }
      });
      console.log("NO MIXER ANYMORE :)");
    }
    // for future noise textures
    if(event.key === "k") {
      let mat = new BABYLON.StandardMaterial("mat", this.scene);
      mat.disableLighting = true;
      mat.backFaceCulling = false;
      let noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 512, this.scene);
      noiseTexture.octaves = 3;
      noiseTexture.persistence = 0.9;
      mat.emissiveTexture = noiseTexture;
      mat.emissiveColor = BABYLON.Color3.Black();
      let tempMesh= this.scene.getMeshByName("Pedestal_Pedestal_Blue_15390");
      tempMesh.material = mat;
      console.log("FLOOR");
    }
    // for future Slideshow
    if(event.key === "h") {
      let tempMesh = this.scene.getMeshByName("PosterClubS1");
      console.log("Slide Show! ");
      this.scene.registerBeforeRender(function () {
        tempMesh.material.albedoTexture.uOffset +=0.003;
        tempMesh.material.emissiveTexture.uOffset += 0.003;
      });
    }
    // for VIP portal door
    if (event.key === "v") {
      let tempMesh = this.scene.getMeshByName("portal-door-top");
      let tempMeshEmiss = this.scene.getMeshByName("portal-door-emissive");
      console.log("portal-door 1");
      tempMesh.visibility = 0;
      tempMesh.isPickable = false;
      tempMeshEmiss.visibility = 0;
      tempMeshEmiss.isPickable = false;
    }
  }

  startSavingState() {
    if(!this.saveInterval) {
      this.saveInterval = setInterval(() => {
        this.saveState()
      }, 2000);
    }
  }

  // Save state of animated elements
  async saveState() {
    if ( ! this.worldState || document.querySelector("#saveState").checked === false) {
      return;
    }
    this.properties.activeMood = this.stageControls.activeMood;
    this.properties.fogSetting = this.stageControls.fogSetting;
    this.properties.environmentIntensity = this.scene.environmentIntensity;
    this.properties.environmentTexture = this.stageControls.activeCubeTexture;
    this.properties.pedestalColor = this.stageControls.pedestal.material.emissiveColor;
    this.properties.DJPlatformRaised = this.stageControls.DJPlatformRaised;
    this.properties.tunnelLightsOn = this.stageControls.tunnelLightsOn;
    this.properties.gridFloorOn = this.stageControls.gridFloorOn;
    this.properties.moodParticlesOn = this.stageControls.moodParticlesOn;
    this.properties.DJSpotLightIntensity = this.DJSpotLight ? this.DJSpotLight.intensity : false;
    this.shareProperties();
  }

  applyState() {
    let state = this.worldState.properties;

    this.initializeDisplays();

    this.stageControls.activeMood = state.activeMood;
    this.stageControls.fogSetting = state.fogSetting;
    this.stageControls.activeCubeTexture = state.environmentTexture;
    this.stageControls.changeCubeTexture(state.environmentTexture);

    this.scene.environmentIntensity = state.environmentIntensity;

    this.stageControls.raiseDJPlatform(state.DJPlatformRaised, 0)
    this.stageControls.toggleTunnelLights(state.tunnelLightsOn, 0);

    // Only turn it on if its actually on otherwise trips on itself
    if(state.gridFloorOn) {
      this.stageControls.toggleGridFloor(true, 0);
    }

    this.stageControls.toggleMoodParticles(state.moodParticlesOn);

    if(state.DJSpotLightIntensity && this.DJSpotLight) {
      this.DJSpotLight.intensity = state.DJSpotLightIntensity;
    }
    if(this.spaceConfig.mode === 'soundclub' && this.storeLight) {
      this.storeLight.intensity = state.activeMood ? 15 : 0;
    }

    if(state.fogSetting) {
      this.stageControls.animateFog(this.stageControls.fogSettingConfigs[state.fogSetting], 0);
    }
    if(state.activeMood) {
      let moodSet = this.stageControls.moodSets[state.activeMood];
      this.stageControls.pedestal.material.emissiveColor = new BABYLON.Color3(state.pedestalColor['r'], state.pedestalColor['g'], state.pedestalColor['b']);
      let pedestalColors = [this.stageControls.pedestal.material.emissiveColor, ...moodSet.pedestalColor];
      this.stageControls.animatePedestalColor(pedestalColors, moodSet.pedestalTransitionInterval, moodSet.pedestalWaitInterval, true);
    }

    if(this.permissions.stage_controls) {
      /* Update UI */
      setTimeout(() => {
        if (state.activeMood) {
          document.querySelector('#moodSet').value = state.activeMood;
        }
        if (state.fogSetting) {
          document.querySelector('#fogSetting').value = state.fogSetting;
        }
        if(state.skyboxScale) {
          document.querySelector('#skyboxScale').value = state.skyboxScale;
        }
        document.querySelector("#app")._vnode.component.data.DJSpotLightIntensity = state.DJSpotLightIntensity;
        document.querySelector("#app")._vnode.component.data.tunnelLightsOn = state.tunnelLightsOn;
        document.querySelector("#app")._vnode.component.data.gridFloorOn = state.gridFloorOn;
        document.querySelector("#app")._vnode.component.data.moodParticlesOn = state.moodParticlesOn;
      }, 1000);
    }
  }
}