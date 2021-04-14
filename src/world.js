import { World, WorldManager, VRSPACEUI } from './babylon/vrspace-ui.js';
import CinemaCamera from './cinema-camera';
import StageControls from './stage-controls';
import Emojis from './emojis';
import MediaSoup from './media-streams';
import HoloAvatar from './holo-avatar';
import Movement from './movement';

// deals with everything inside 3D world
export class NightClub extends World {
  constructor(eventConfig, userSettings) {
    super();
    this.file = 'Night_Club-2903-4.glb';
    this.displays = [];
    this.freeCamSpatialAudio = false;
    this.userSettings = userSettings;
    this.eventConfig = eventConfig;
    this.role = eventConfig.role;
    this.permissions = eventConfig.permissions;
    // cameras
    this.camera1 = null;
    this.camera3 = null;
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
    // things to dispose of
    this.tableMaterial = null;
    this.tableTexture = null;
    this.tableMesh = null;
    this.windowMaterial = null;
    this.windowTexture = null;
    this.windowMesh = null;
    this.videos = [
      { label: 'Default', url: 'https://assets.soundstage.fm/vr/Default.mp4' },
      { label: 'Intro', url: 'https://assets.soundstage.fm/vr/Intro.mp4' },
      { label: 'Abyss', url: 'https://assets.soundstage.fm/vr/Abyss.mp4' },
      { label: 'Beat Swiper', url: 'https://assets.soundstage.fm/vr/beat-swiper.mp4' },
      { label: 'Disco 1', url: 'https://assets.soundstage.fm/vr/Disco-1.mp4' },
      { label: 'Disco 2', url: 'https://assets.soundstage.fm/vr/Disco-2.mp4' },
      { label: 'Flamboyant Lines', url: 'https://assets.soundstage.fm/vr/flamboyant-lines.mp4' },
      { label: 'Loop 1', url: 'https://assets.soundstage.fm/vr/Loop-1.mp4' },
      { label: 'Megapixel', url: 'https://assets.soundstage.fm/vr/Megapixel.mp4' },
      { label: 'Neon Beams', url: 'https://assets.soundstage.fm/vr/Neon.mp4' },
      { label: 'Reactor', url: 'https://assets.soundstage.fm/vr/Reactor.mp4' },
      { label: 'Waves', url: 'https://assets.soundstage.fm/vr/Retro-1.mp4' },
      { label: 'Retro', url: 'https://assets.soundstage.fm/vr/Retro-2.mp4' },
      { label: 'Split Sphere', url: 'https://assets.soundstage.fm/vr/split-sphere.mp4' },
      { label: 'Tiler', url: 'https://assets.soundstage.fm/vr/Color-Tiler.mp4' },
      { label: 'Trails', url: 'https://assets.soundstage.fm/vr/Cube-Trails.mp4' },
      { label: 'Ultra', url: 'https://assets.soundstage.fm/vr/Ultra.mp4' },
    ]
    document.addEventListener('keydown', this.HDRControl.bind(this));
  }
  // intialization methods override defaults that do nothing
  // superclass ensures everything is called in order, from world init() method
  async createSkyBox() {
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000, this.scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("//www.babylonjs.com/assets/skybox/TropicalSunnyDay", this.scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
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
//  Adding curtains to close the hole
    let curtains = BABYLON.MeshBuilder.CreatePlane("curtains",
      {height:2, width: 3});
    curtains.position.x = 2;
    curtains.position.y = 1;
    curtains.position.z = 5.72;
    curtains.checkCollisions = true
    curtains.visibility = 0
  }

  async createPhysics() {
    this.scene.gravity = new BABYLON.Vector3(0, -0.01, 0);
  }
  // most important one - setup of cameras/navigation:
  async createCamera() {
    this.gravityEnabled = true;
    this.collisionsEnabled = true;

    // First person camera:

    let spawnPosition = this.role === 'artist' || this.permissions.spawn_backstage === true ? new BABYLON.Vector3(2.130480415252164, -2.4808838319778443, 38.82915151558704) : new BABYLON.Vector3(11, this.videoAvatarSize*2+this.avatarHeight, -7);
    this.camera1 = new BABYLON.UniversalCamera("First Person Camera", spawnPosition, this.scene); // If needed in the future DJ starts at 0, 3, 7

    this.camera1.maxZ = 100000;
    this.camera1.minZ = 0;
    this.camera1.setTarget(new BABYLON.Vector3(0,3,0));
    this.camera1.applyGravity = true;
    this.camera1.speed = 0.07;
    //in this space, 0.5 is minimum size that phisically makes sense, thus avatarSize*2:
    this.camera1.ellipsoid = new BABYLON.Vector3(this.videoAvatarSize, this.videoAvatarSize*2, this.videoAvatarSize);
    this.camera1.ellipsoidOffset = new BABYLON.Vector3(0, this.videoAvatarSize + this.avatarHeight, 0);
    this.camera1.checkCollisions = true;

    this.camera1.keysDown = [83]; // S
    this.camera1.keysLeft = [65]; // A
    this.camera1.keysRight = [68]; // D
    this.camera1.keysUp = [87]; // W
    this.camera1.keysUpward = [36, 33, 32]; // home, pgup, space
    console.log("1st Person Camera:")
    console.log(this.camera1);

    // Third person camera:
    // always looks at 1st person camera (avatar) - target is 1st ps camera position
    // alpha rotation depends on 1st ps camera rotation
    this.camera3 = new BABYLON.ArcRotateCamera("Third Person Camera", 0, 1.5*Math.PI-this.camera1.rotation.y, 1, this.camera1.position, this.scene);
    this.camera3.maxZ = 1000;
    this.camera3.minZ = 0;
    this.camera3.wheelPrecision = 100;
    this.camera3.checkCollisions = true; //CHECKME: check or not?

    // disable keys, movement with mouse only
    this.camera3.keysDown = [];
    this.camera3.keysLeft = [];
    this.camera3.keysRight = [];
    this.camera3.keysUp = [];
    this.camera3.keysUpward = [36, 33, 32]; // home, pgup, space

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
    this.cameraFree.keysUpward = [36, 33, 16]; // home, pgup, shift
    this.cameraFree.keysDownward = [35, 34, 32] // end, pgdn, space
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

  playCameraAnimation(animation) {
    this.activateCamera('free');
    if(!this.cineCam) {
      this.cineCam = new CinemaCamera(this.cameraFree, this.scene);
    }
    this.cineCam.play(animation, true);
  }

  load(callback) {
    BABYLON.SceneLoader.LoadAssetContainer('/models/',
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
    this.initializeDisplays();

    this.movement.start();
    this.scene.registerBeforeRender(() => this.spatializeAudio());

    // media streaming stuff
    this.mediaStreams = new MediaSoup(this.scene, 'videos', this.userSettings, this.eventConfig);

    // stop movement when focus is lost
    this.canvas.onblur = () => {
      if ( this.movingDirections > 0 && ! this.movingToTarget ) {
        this.stopMovement();
      }
    }

    if ( this.afterLoad ) {
      this.afterLoad();
    }
  }


  trackAvatarRotations(enable) {
    if ( this.trackAvatarRotation == enable ) {
      return;
    }
    this.trackAvatarRotation = enable;
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

  initializeDisplays(videoSource = false, displays = ['DJTableVideo', 'WindowVideo']) {

    if(!this.userSettings.enableVisuals) {
      return;
    }

    if(displays.indexOf('DJTableVideo') !== -1) {
      if(this.tableMaterial) {
        this.tableMaterial.dispose();
      }
      if(this.tableTexture) {
        this.tableTexture.dispose();
      }
      this.tableMaterial = new BABYLON.StandardMaterial("tableMaterial", this.scene);
      this.tableTexture = new BABYLON.VideoTexture("tableTexture", videoSource ? videoSource : [this.videos[0].url], this.scene, true, true, null, {
        autoUpdateTexture: true,
        autoPlay: true,
        muted: true,
        loop: true
      });
      this.tableMaterial.diffuseTexture = this.tableTexture;
      this.tableMaterial.diffuseTexture.vScale = 0.50;
      this.tableMaterial.diffuseTexture.vOffset = -0.75;
      this.tableMaterial.emissiveTexture = this.tableTexture;

      this.tableMesh = this.scene.getMeshByName("DJTableVideo")
      this.tableMesh.material = this.tableMaterial;
      console.log('tableMesh', this.tableMesh);
      this.displays.push({
        name: "DJTableVideo",
        mesh: this.tableMesh,
        texture: this.tableTexture
      });
    }

    if(displays.indexOf('WindowVideo') !== -1) {

      if(this.windowMaterial) {
        this.windowMaterial.dispose();
      }
      if(this.windowTexture) {
        this.windowTexture.dispose();
      }

      this.windowMaterial = new BABYLON.StandardMaterial("windowMaterial", this.scene);
      this.windowTexture = new BABYLON.VideoTexture("windowTexture", videoSource ? videoSource : [this.videos[0].url], this.scene, true, true, null, {
        autoUpdateTexture: true,
        autoPlay: true,
        muted: true,
        loop: true
      });
      this.windowMaterial.diffuseTexture = this.windowTexture;
      this.windowMaterial.diffuseTexture.vScale = 0.65;
      this.windowMaterial.diffuseTexture.uScale = -1;
      this.windowMaterial.diffuseTexture.vOffset = 0.17;
      this.windowMaterial.emissiveTexture = this.windowTexture;
      this.windowMesh = this.scene.getMeshByName("WindowVideo")
      this.windowMesh.material = this.windowMaterial;
      console.log('windowMesh', this.windowMesh);
      this.displays.push({
        name: "Window",
        mesh: this.windowMesh,
        texture: this.windowTexture
      });

      this.scene.getMeshByName("LogoText").visibility = 0;
      console.log("LogoText", this.scene.getMeshByName("LogoText"));
      this.scene.getMeshByName("LogoSign").visibility = 0;
      console.log("LogoSign", this.scene.getMeshByName("LogoSign"));

      // Instrumentation tool
      console.log('Total Meshes: ' + this.scene.meshes.length);
      console.log('Total Materials: ' + this.scene.materials.length);
      console.log('Total Textures: ' + this.scene.textures.length);
      let sceneInstrumentation = new BABYLON.SceneInstrumentation(this.scene);
      sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
      sceneInstrumentation.captureFrameTime = true;
      sceneInstrumentation.captureParticlesRenderTime = true;
      console.log('Draw Calls: ' + sceneInstrumentation.drawCallsCounter.current);

      this.scene.registerAfterRender(function () {
        console.log("Draw Calls: " + sceneInstrumentation.drawCallsCounter.current);
        // there will be much more more parameters
      });
      // End of Instrumentation tool
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
      this.video.show();
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

    this.connectHiFi(audioDeviceId, playbackDeviceId);

    this.worldManager = new WorldManager(this, fps);
    this.worldManager.customOptions = {
      radius: this.videoAvatarSize,
      avatarHeight: this.avatarHeight,
      videoAvatarSize: this.videoAvatarSize,
      trackAvatarRotation: this.trackAvatarRotation,
      emojiEvent: (obj) => this.animateAvatar(obj),
      stageEvent: (obj) => this.stageControls.execute(obj.stageEvent),
      properties: (obj) => {
        // THIS IS EVENT LISTENER FOR WORLD EVENTS
        console.log("Properties:", obj);
        if ( obj.properties.stageEvent ) {
          this.stageControls.execute(obj.properties.stageEvent);
        }
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
        this.worldManager.VRSPACE.sendMy("properties", {altImage: this.video.altImage});
      }
      this.worldManager.VRSPACE.sendMy("position:", {x:this.camera1.position.x, y:0, z:this.camera1.position.z});
      // enter a world
      this.worldManager.VRSPACE.sendCommand("Enter", {world: this.eventConfig.event_slug});
      // start session
      this.worldManager.VRSPACE.sendCommand("Session");
      // add chatroom id to the client, and start streaming
      welcome.client.token = this.eventConfig.event_slug;
      this.worldManager.pubSub(welcome.client);

      this.connected = true;
      if ( callback ) {
        callback(welcome);
      }
    }
    this.worldManager.VRSPACE.addWelcomeListener(enter);
    this.worldManager.VRSPACE.connect(process.env.VUE_APP_SERVER_URL);
  }

  createAvatar(obj) {
    let avatar = new HoloAvatar( this.worldManager.scene, null, this.worldManager.customOptions );
    // obj is the client object sent by the server
    if ( obj.properties ) {
      // THIS TRIGGERS WHEN USERS LOG IN
      if ( obj.properties.altImage ) {
        avatar.altImage = obj.properties.altImage;
      }
      // TODO this can process only one stage event
      // keep track of multiple states with multiple properties
      // at this point stage controls are not initialized yet
      if ( this.stageControls && obj.properties.stageEvent ) {
        this.stageControls.execute(obj.properties.stageEvent);
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
    this.stageControls = new StageControls(this.displays, this.camera1.position, callback, this.userSettings, this );
    this.stageControls.init();
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

  async getAudioStreamSettings(audioDeviceId) {
    window.audioStream = null;
    window.performanceAudioSourceNode = null;
    window.performancceAudioGainNode = null;
    let stereo;
    let audioConstraints;

    if(this.userSettings && this.userSettings.enableStereo) {

      window.audioContext = new AudioContext({
        sampleRate: 48000
      });

      let audioStreamDestination = await window.audioContext.createMediaStreamDestination();

      window.performanceAudioSourceNode = window.audioContext.createMediaStreamSource(
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
      window.performanceAudioGainNode = window.audioContext.createGain();
      window.performanceAudioSourceNode.connect(window.performanceAudioGainNode);

      /* Connect to destination */
      window.performanceAudioGainNode.connect(audioStreamDestination);

      /* Apply custom value */
      window.performanceAudioGainNode.gain.setValueAtTime(1 + (this.userSettings.stereoGainBoost / 100), window.audioContext.currentTime);

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

  async connectHiFi(audioDeviceId, playbackDeviceId) {
    var interval = null;
    if(!this.hifi) {
      this.hifi = new HighFidelityAudio.HiFiCommunicator({
        userDataStreamingScope: HighFidelityAudio.HiFiUserDataStreamingScopes.NONE,
        onConnectionStateChanged: (state) => {
          console.log("HiFi state", state);
          if ( "Disconnected" === state && !interval) {
            console.log("Reconnecting to audio server");
            interval = setInterval(() => this.connectHiFi(audioDeviceId, playbackDeviceId), 5000);
          } else if ("Connected" === state && interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      });
    }
    if ( this.mediaStreams.audioSource && this.mediaStreams.startAudio ) {
      let { audioStream, stereo } = await this.getAudioStreamSettings(audioDeviceId);
      console.log('stereo?', stereo);
      await this.hifi.setInputAudioMediaStream(audioStream, stereo);
    }

    this.hifi.connectToHiFiAudioAPIServer(this.eventConfig.highFidelity.token, this.eventConfig.highFidelity.url).then(() => {
      console.log('HiFi connected');
      var outputStream = this.hifi.getOutputAudioMediaStream();
      var outputElement = document.getElementById('audioOutput');
      // and now bind that output somewhere
      outputElement.srcObject = outputStream;
      outputElement.play();
      this.changePlaybackDevice(playbackDeviceId);

      // Disable auto-muting while stereo broadcasting
      this.hifi._currentHiFiAudioAPIData.volumeThreshold = this.userSettings.enableStereo ? -96 : null
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
    if(this.userSettings && this.userSettings.enableStereo) {
      pos = {
        orientationEuler: {
          pitchDegrees: -7.646941233545094,
          rollDegrees: 0,
          yawDegrees: 0
        },
        position: {
          x: 2.1675716757014136,
          y: 1.079573474549019,
          z: 4.359327756668091
        }
      }
    } else if ( this.activeCameraType === '1p' ) {
      this.audioData( pos, this.camera1 );
    } else if ( this.activeCameraType === '3p' ) {
      var rotY = 1.5*Math.PI-this.camera3.alpha;
      // we can track position of either cam1 or cam3
      // tracking cam1 because that's where avatar is
      this.audioData( pos, this.camera1, {x:0, y:rotY, z:0});
    } else if ( this.activeCameraType === 'free' ) {
      if ( this.freeCamSpatialAudio || (document.querySelector('#freeCamSpatialAudio') && document.querySelector('#freeCamSpatialAudio').value === 'true')) {
        // we can track cameraFree as we track camera1, but soon as camera moves away from the avatar,
        // sound becomes confusing
        // so it makes sense only for accurate sound recording
        this.audioData( pos, this.cameraFree );
      } else {
        // otherwise sound tracks avatar position (1st person camera)
        this.audioData( pos, this.camera1 );
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

// FOR TESTING, WILL BE REMOVED
  HDRControl(event) {
    if(event.key === "1") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/environment.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 1;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "2") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/Runyon_Canyon_A_2k_cube_specular.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 1.4;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "3") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/night.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 1.5;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "4") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/room.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 0.4;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "5") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/parking.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 0.4;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "6") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/country.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 0.8;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "7") {
      let hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/Studio_Softbox_2Umbrellas_cube_specular.env", this.scene);
      this.scene.environmentTexture = hdrTexture;
      this.scene.environmentIntensity = 0.4;
      console.log("hdrTexture: " + hdrTexture);
    }
    if(event.key === "8") {
      this.scene.fogEnabled = false;
    }
    if(event.key === "9") {
      let myFogColor = new BABYLON.Color4(1,0,1,0.5);
      this.scene.fogEnabled = true;
      this.scene.fogMode = 2;
      this.scene.fogColor = myFogColor;
      this.scene.fogDensity = 0;
      console.log("this.scene.fogEnabled: " + this.scene.fogEnabled);
    }
    if(event.key === "0") {
      let myFogColor = new BABYLON.Color4(0,0,1,0.5);
      this.scene.fogEnabled = true;
      this.scene.fogMode = 2;
      this.scene.fogColor = myFogColor;
      this.scene.fogDensity = 0;
      console.log("this.scene.fogEnabled: " + this.scene.fogEnabled);
    }
    if(event.key === "-") {
      this.scene.environmentIntensity -= 0.01;
      console.log("this.scene.environmentIntensity: " + this.scene.environmentIntensity);
    }
    if(event.key === "=") {
      this.scene.environmentIntensity += 0.01;
      console.log("this.scene.environmentIntensity: " + this.scene.environmentIntensity);
    }
    if(event.key === "/") {
      this.scene.fogDensity += 0.001;
      console.log("this.scene.fogDensity: " + this.scene.fogDensity);
    }
    if(event.key === "*") {
      this.scene.fogDensity -= 0.001;
      console.log("this.scene.fogDensity: " + this.scene.fogDensity);
    }
    if(event.key === "p") {
      let tempPipe = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
      tempPipe.imageProcessingEnabled = true;
      tempPipe.imageProcessing.toneMappingEnabled = true;
      tempPipe.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    }
    if(event.key === "o") {
      let tempPipe = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
      tempPipe.imageProcessingEnabled = true;
      tempPipe.imageProcessing.toneMappingEnabled = true;
      tempPipe.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_STANDARD;
    }
    if(event.key === "i") {
      let tempPipe = this.scene.postProcessRenderPipelineManager.supportedPipelines[0];
      tempPipe.imageProcessingEnabled = false;

    }
    if(event.key === "l") {
      let tempMesh= this.scene.getMeshByName("Pedestal_Pedestal_Emission_2_15348");
      tempMesh.material.emissiveColor = BABYLON.Color3.Green();
      console.log("Emissive Green");
    }
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
    if(event.key === "h") {
      let tempMesh = this.scene.getMeshByName("Plane.1");
      this.scene.registerBeforeRender(function () {
        tempMesh.material.albedoTexture.uOffset +=0.003;
        tempMesh.material.emissiveTexture.uOffset +=0.003;
        console.log("Slide Show");
      });
    }

    if(event.key === "m") {
      var stream = navigator.getUserMedia({ audio:true, video:true },
        function( localMediaStream ){
          let sound = new BABYLON.Sound("Music", localMediaStream,
            this.scene, null, { streaming: true, autoplay: true, loop:true, volume:1 });
        },
        function(){ console.log("failed mic for visualizer"); }
      );
      var myAnalyser = new BABYLON.Analyser(this.scene);
      BABYLON.Engine.audioEngine.connectToAnalyser(myAnalyser);
      myAnalyser.FFT_SIZE = 256;
      myAnalyser.SMOOTHING = 0.9;
      console.log(myAnalyser);
      myAnalyser.DEBUGCANVASSIZE.width = 160;
      myAnalyser.DEBUGCANVASSIZE.height = 100;
      myAnalyser.DEBUGCANVASPOS.x = 40;
      myAnalyser.DEBUGCANVASPOS.y = 30;
      myAnalyser.drawDebugCanvas();
      var fft;
      let tempMesh = this.scene.getMeshByName("Plane.2");
      let tempMesh2 = this.scene.getMeshByName("Table.001_Table.004_Base_2_15346");
      let callback = function(){
        fft = myAnalyser.getByteFrequencyData();
        var scale = fft[20] / 100;
        //console.log(scale);
        tempMesh.scaling.x = scale;
        tempMesh.scaling.y = scale;
        tempMesh.scaling.z = scale;
//tempMesh2.scaling.x = scale;
        tempMesh2.scaling.y = scale*1.4;
// tempMesh2.scaling.z = scale;
      };
      this.scene.registerBeforeRender(callback);

    }

  }
  
}

export default NightClub;