import { World, VideoAvatar, WorldManager, MediaStreams, VRSPACEUI } from './babylon/vrspace-ui.js';
import mediasoup from './mediasoup'

var camera1;
var camera3;
var activeCameraType = '1p'; // initial camera - 1st person

// network stuff
var publishing = false;
var connected = false;
var worldManager = null;
var trackAvatarRotation = true;

let Videos = [
  { label: 'Default', url: 'https://assets.soundstage.fm/vr/Default.mp4' },
  { label: 'Disco 1', url: 'https://assets.soundstage.fm/vr/Disco-1.mp4' },
  { label: 'Disco 2', url: 'https://assets.soundstage.fm/vr/Disco-2.mp4' },
  { label: 'Loop 1', url: 'https://assets.soundstage.fm/vr/Loop-1.mp4' },
  { label: 'Megapixel', url: 'https://assets.soundstage.fm/vr/Megapixel.mp4' },
  { label: 'Reactor', url: 'https://assets.soundstage.fm/vr/Reactor.mp4' },
  { label: 'Waves', url: 'https://assets.soundstage.fm/vr/Retro-1.mp4' },
  { label: 'Retro', url: 'https://assets.soundstage.fm/vr/Retro-2.mp4' },
  { label: 'Ultra', url: 'https://assets.soundstage.fm/vr/Ultra.mp4' },
  { label: 'Neon Beams', url: 'https://assets.soundstage.fm/vr/neon-laser-beams.mp4' },
  { label: 'Flamboyant Lines', url: 'https://assets.soundstage.fm/vr/flamboyant-lines.mp4' },
  { label: 'Beat Swiper', url: 'https://assets.soundstage.fm/vr/beat-swiper.mp4' },
  { label: 'Split Sphere', url: 'https://assets.soundstage.fm/vr/split-sphere.mp4' },
]
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
    // in this space, 0.5 is minimum size that phisically makes sense
    this.videoAvatarSize = 0.25;
    // distance from the floor
    this.avatarHeight = 0.25;
    // movement implementation
    this.movement = new Movement(this);
    // mesh to share movement
    this.movementTracker = null;
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
    camera1 = new BABYLON.UniversalCamera("First Person Camera", spawnPosition, this.scene); // If needed in the future DJ starts at 0, 3, 7

    camera1.maxZ = 100000;
    camera1.minZ = 0;
    camera1.setTarget(new BABYLON.Vector3(0,3,0));
    // not required, world.init() does that
    //camera1.attachControl(canvas, true);
    camera1.applyGravity = true;
    camera1.speed = 0.07;
    //in this space, 0.5 is minimum size that phisically makes sense, thus avatarSize*2:
    camera1.ellipsoid = new BABYLON.Vector3(this.videoAvatarSize, this.videoAvatarSize*2, this.videoAvatarSize);
    camera1.ellipsoidOffset = new BABYLON.Vector3(0, this.videoAvatarSize + this.avatarHeight, 0);
    camera1.checkCollisions = true;

    camera1.keysDown = [83]; // S
    camera1.keysLeft = [65]; // A
    camera1.keysRight = [68]; // D
    camera1.keysUp = [87]; // W
    //camera1.keysDown = [40, 83]; // down, S
    //camera1.keysLeft = [37, 65]; // left, A
    //camera1.keysRight = [39, 68]; // right, D
    //camera1.keysUp = [38, 87]; // up, W
    camera1.keysUpward = [36, 33, 32]; // home, pgup, space
    console.log("1st Person Camera:")
    console.log(camera1);

    // Third person camera:
    // always looks at 1st person camera (avatar) - target is 1st ps camera position
    // alpha rotation depends on 1st ps camera rotation
    camera3 = new BABYLON.ArcRotateCamera("Third Person Camera", 0, 1.5*Math.PI-camera1.rotation.y, 1, camera1.position, this.scene);
    camera3.maxZ = 1000;
    camera3.minZ = 0;
    camera3.wheelPrecision = 100;
    camera3.checkCollisions = true; //CHECKME: check or not?

    // disable keys, movement with mouse only
    camera3.keysDown = [];
    camera3.keysLeft = [];
    camera3.keysRight = [];
    camera3.keysUp = [];
    camera3.keysUpward = [36, 33, 32]; // home, pgup, space

    // this disables looking at own avatar from below:
    //camera3.upperBetaLimit = 1.5; // little less than Math.PI/2;
    // allows for about 45 deg angle from below:
    // camera3.upperBetaLimit = 2.2;
    camera3.lowerRadiusLimit = 0.5; // at least 0.5 m behind avatar
    camera3.upperRadiusLimit = 5; // a maximum of 5 m behind avatar
    camera3.speed = 0.3;

    // disable panning, as it moves avatar/camera1:
    camera3.panningSensibility = 0;
    camera3.inputs.attached.pointers.buttons = [1,2]; // disable LMB(0)

    console.log("3rd Person Camera:")
    console.log(camera3);

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
    this.camera = camera1;
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
      var rotY = 1.5*Math.PI-camera3.alpha;
      if ( trackAvatarRotation ) {
        // convert alpha and beta to mesh rotation.y and rotation.x
        this.video.mesh.rotation.y = rotY;
        // possible but looks weird:
        //this.video.mesh.rotation.x = 0.5*Math.PI - camera3.beta;
      }
      this.movementTracker.rotation.y = rotY;
      // and now also apply rotation to 1st person camera
      camera1.rotation.z = 0;
      camera1.rotation.y = rotY;
      camera1.rotation.x = 0;
    }
    this.scene.registerBeforeRender( this.applyRotationToMesh );
  }

  // changing camera types, utilized from HTML UI
  activateCamera(cameraType) {
    if ( cameraType == activeCameraType ) {
      return;
    }
    this.camera.detachControl();
    if ( this.video ) {
      this.video.detachFromCamera();
    }
    this.stopTrackingRotation();
    if ( '1p' === cameraType ) {
      // set position/target from current camera/avatar
      camera1.rotation.y = 1.5*Math.PI-camera3.alpha;
      //camera1.position.y += camera1.ellipsoid.y*2 - this.video.radius - camera1.ellipsoidOffset.y;
      camera1.position.y += camera1.ellipsoid.y*2 - this.video.radius - camera1.ellipsoidOffset.y-this.avatarHeight;
      this.camera = camera1;
      if ( worldManager ) {
        worldManager.trackMesh(null);
      }
    } else if ( '3p' === cameraType ) {
      //camera1.position.y += this.video.radius-camera1.ellipsoid.y*2+camera1.ellipsoidOffset.y;
      camera1.position.y += this.video.radius-camera1.ellipsoid.y*2+camera1.ellipsoidOffset.y+this.avatarHeight;
      // set position/target from current camera/avatar
      camera3.alpha = 1.5*Math.PI-camera1.rotation.y;
      this.camera = camera3;
      if ( worldManager && this.video ) {
        worldManager.trackMesh(this.movementTracker);
        this.startTrackingRotation();
      }

    } else if ( 'free' === cameraType ) {
      if ( trackAvatarRotation ) {
        this.video.mesh.rotation.y = .5*Math.PI-camera3.alpha;
        this.video.back.position = new BABYLON.Vector3( 0, 0, 0.001);
      }
      this.camera = this.cameraFree;
      if ( worldManager && this.video ) {
        worldManager.trackMesh(this.movementTracker);
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
    activeCameraType = cameraType;
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
    if ( trackAvatarRotation == enable ) {
      return;
    }
    trackAvatarRotation = enable;
    worldManager.mediaStreams.clients.forEach( (client) => {
      client.video.applyRotation(trackAvatarRotation);
    });
    this.video.applyRotation(trackAvatarRotation);
    if ( trackAvatarRotation ) {
      this.video.back.position = new BABYLON.Vector3( 0, 0, -0.001);
    } else {
      this.video.back.position = new BABYLON.Vector3( 0, 0, 0.001);
    }
    if ( '3p' === activeCameraType ) {
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
      this.tableTexture = new BABYLON.VideoTexture("tableTexture", videoSource ? videoSource : [Videos[0].url], this.scene, true, true, null, {
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
      this.windowTexture = new BABYLON.VideoTexture("windowTexture", videoSource ? videoSource : [Videos[0].url], this.scene, true, true, null, {
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
    }
  }

  // custom video/audio streaming support methods
  async showVideo(altImage) {
    let avatarOptions = {
      radius: this.videoAvatarSize,
      avatarHeight: this.avatarHeight,
      videoAvatarSize: this.videoAvatarSize
    };
    if ( altImage ) {
      avatarOptions.altImage = altImage;
    }
    if ( ! this.video ) {
      this.video = new HoloAvatar( this.scene, null, avatarOptions);
      this.video.autoAttach = false;
      this.video.camera = camera1;
      this.video.autoStart = false;
      this.video.show();
      if ( trackAvatarRotation ) {
        this.video.back.position = new BABYLON.Vector3( 0, 0, -0.001);
      }

      // tracking movement of this mesh allows to send different position and/or orientation
      this.movementTracker = BABYLON.MeshBuilder.CreateDisc("MovementTracker", {radius:this.radius}, this.scene);
      this.movementTracker.setEnabled(false); // never displayed
      this.movementTracker.ellipsoid = this.video.mesh.ellipsoid;
      this.video.movementTracker = this.movementTracker;

      this.video.attachToCamera(this.fpsWebcamPreviewPos);
      if ( '1p' !== activeCameraType ) {
        this.video.detachFromCamera();
      }
    }
  }

  startVideo(device) {
    this.video.device = device;
    this.video.displayVideo(device);
    publishing = true;
    this.mediaStreams.videoSource = device;
    this.mediaStreams.startVideo = true;
    if ( connected ) {
      this.mediaStreams.publishVideo(true);
    }
  }

  stopVideo() {
    if ( this.video ) {
      this.video.displayAlt();
    }
    publishing = false;
    this.mediaStreams.videoSource = false;
    this.mediaStreams.startVideo = false;
    if ( connected ) {
      this.mediaStreams.publishVideo(false);
    }
  }

  startAudio(device) {
    this.mediaStreams.audioSource = device;
    this.mediaStreams.startAudio = true;
    if ( connected ) {
      this.mediaStreams.publishAudio(true);
    }
  }

  stopAudio() {
    this.mediaStreams.audioSource = false;
    this.mediaStreams.startAudio = false;
    if ( connected ) {
      this.mediaStreams.publishAudio(false);
    }
  }

  connect(name, fps, audioDeviceId, playbackDeviceId, callback) {
    // change text on video avatar:
    this.video.altText = name;
    if ( ! publishing ) {
      this.video.displayAlt();
    }

    this.connectHiFi(audioDeviceId, playbackDeviceId);

    worldManager = new WorldManager(this, fps);
    worldManager.customOptions = {
      radius: this.videoAvatarSize,
      avatarHeight: this.avatarHeight,
      videoAvatarSize: this.videoAvatarSize,
      emojiEvent: (obj) => this.animateAvatar(obj),
      stageEvent: (obj) => this.stageControls.execute(obj.stageEvent),
      properties: (obj) => {
        console.log("Properties:", obj);
        if ( obj.properties.stageEvent ) {
          this.stageControls.execute(obj.properties.stageEvent);
        }
      }
    };
    worldManager.avatarFactory = this.createAvatar;
    // Use this for testing purposes, to randomize avatar movement:
    //worldManager.avatarFactory = this.randomizeAvatar;
    worldManager.mediaStreams = this.mediaStreams;

    //worldManager.trackRotation = trackAvatarRotation; // track rotation to show avatar's direction

    worldManager.debug = false; // client debug
    worldManager.VRSPACE.debug = false; // network debug

    worldManager.VRSPACE.addErrorListener( (error) => {
      console.log("SERVER ERROR: "+error );
    });

    // TODO refactor this into WorldManager promisses
    var enter = (welcome) => {
      // first remove welcome listner, to prevent responding to 2nd welcome
      worldManager.VRSPACE.removeWelcomeListener(enter);
      // name MUST be unique, using own ID ensures it
      if ( ! name || "N/A" === name ) {
        name = "u"+worldManager.VRSPACE.me.id;
        // also write it to own avatar
        this.video.altText = name;
        // force displayText again if web cams are off since otherwise it shows 'N/A'
        if(this.userSettings.enableWebcamFeeds === false) {
          this.video.displayAlt();
        }
      }
      // set own properties
      worldManager.VRSPACE.sendMy("name", name );
      worldManager.VRSPACE.sendMy("mesh", "video");
      if ( this.video.altImage ) {
        worldManager.VRSPACE.sendMy("properties", {altImage: this.video.altImage});
      }
      worldManager.VRSPACE.sendMy("position:", {x:camera1.position.x, y:0, z:camera1.position.z});
      // enter a world
      worldManager.VRSPACE.sendCommand("Enter", {world: this.eventConfig.event_slug});
      // start session
      worldManager.VRSPACE.sendCommand("Session");
      // add chatroom id to the client, and start streaming
      welcome.client.token = this.eventConfig.event_slug;
      worldManager.pubSub(welcome.client);

      connected = true;
      if ( callback ) {
        callback(welcome);
      }
    }
    worldManager.VRSPACE.addWelcomeListener(enter);
    worldManager.VRSPACE.connect(process.env.VUE_APP_SERVER_URL);
  }

  createAvatar(obj) {
    let avatar = new HoloAvatar( worldManager.scene, null, worldManager.customOptions );
    // obj is the client object sent by the server
    if ( obj.properties ) {
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
      worldManager.VRSPACE.processEvent( {Client:obj.id}, changes );
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
    this.emojis = new Emojis(this, camera1.position, callback );
    this.emojis.init();
  }

  initStageControls( callback ) {
    // stage controls
    this.stageControls = new StageControls(this.displays, camera1.position, callback, this.userSettings, this );
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
    if ( ! connected ) {
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
    } else if ( activeCameraType === '1p' ) {
      this.audioData( pos, camera1 );
    } else if ( activeCameraType === '3p' ) {
      var rotY = 1.5*Math.PI-camera3.alpha;
      // we can track position of either cam1 or cam3
      // tracking cam1 because that's where avatar is
      this.audioData( pos, camera1, {x:0, y:rotY, z:0});
    } else if ( activeCameraType === 'free' ) {
      if ( this.freeCamSpatialAudio || (document.querySelector('#freeCamSpatialAudio') && document.querySelector('#freeCamSpatialAudio').value === 'true')) {
        // we can track cameraFree as we track camera1, but soon as camera moves away from the avatar,
        // sound becomes confusing
        // so it makes sense only for accurate sound recording
        this.audioData( pos, this.cameraFree );
      } else {
        // otherwise sound tracks avatar position (1st person camera)
        this.audioData( pos, camera1 );
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

}


class Movement {
  constructor( world ) {
    this.world = world;
    // movement state variables
    this.movingDirections = 0;
    this.movingToTarget = false;
    this.movementTarget = null;
    this.movementDirection = new BABYLON.Vector3(0,0,0);
    this.movingLeft = false;
    this.movingRight = false;
    this.movingForward = false;
    this.movingBackward = false;
    this.movingUpward = false;
    this.movingDownward = false;
    this.timestamp = 0;
    this.movementStart = 0;
    // movement constants
    this.leftVector = new BABYLON.Vector3(1, 0, 0);
    this.rightVector = new BABYLON.Vector3(-1, 0, 0);
    this.forwardVector = new BABYLON.Vector3(0, 0, -1);
    this.backwardVector = new BABYLON.Vector3(0, 0, 1);
    this.upwardVector = new BABYLON.Vector3(0, .5, 0);
    this.downwardVector = new BABYLON.Vector3(0, 0, 0); // gravity takes care of moving down
    this.movementTimeout = 5000;
    this.DOWN = new BABYLON.Vector3(0,-1,0);    
  }
  
  start() {
    // 3rd person movement handler
    this.world.scene.registerBeforeRender(() => this.moveAvatar());    
    // install pointer event handler - moving avatar to
    this.world.scene.onPointerObservable.add((pointerInfo) => this.handleClick(pointerInfo));
    // install keyboard event handler - moving avatar around
    this.world.scene.onKeyboardObservable.add((kbInfo) => this.handleKeyboard(kbInfo) );
  }
  
  cameraRotation(camera, field, max, seconds) {
    var cameraRot = new BABYLON.AnimationGroup("CameraRotation "+field);
    var vAnim = new BABYLON.Animation("CameraRotation:"+field, "rotation."+field, 1, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var vKeys = [];
    vKeys.push({frame:0, value: camera.rotation[field]});
    vKeys.push({frame:seconds, value: max});
    vAnim.setKeys(vKeys);
    cameraRot.addTargetedAnimation(vAnim, camera);

    cameraRot.onAnimationGroupEndObservable.add(() => {
      console.log("Camera rotation ended");
      cameraRot.dispose();
    });
    cameraRot.play(false);
    return cameraRot;
  }

  arcRotation(camera, field, max, seconds) {
    var cameraRot = new BABYLON.AnimationGroup("CameraRotation "+field);
    var vAnim = new BABYLON.Animation("CameraRotation:"+field, field, 1, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var vKeys = [];
    vKeys.push({frame:0, value: camera[field]});
    vKeys.push({frame:seconds, value: max});
    vAnim.setKeys(vKeys);
    cameraRot.addTargetedAnimation(vAnim, camera);

    cameraRot.onAnimationGroupEndObservable.add(() => {
      console.log("Camera rotation ended");
      cameraRot.dispose();
    });
    cameraRot.play(false);
    return cameraRot;
  }

  // keyboard event handler - camera rotation control, 3rd person movement
  handleUniCamKeys(kbInfo) {
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        //console.log("KEY DOWN: ", kbInfo.event.key);
        switch (kbInfo.event.key) {
          case "ArrowLeft":
            if ( ! this.rotAround ) {
              this.rotAround = this.cameraRotation(camera1, 'y', camera1.rotation.y-Math.PI*2, 5);
            }
            break;
          case "ArrowRight":
            if ( ! this.rotAround ) {
              this.rotAround = this.cameraRotation(camera1, 'y', camera1.rotation.y+Math.PI*2, 5);
            }
            break;
          case "ArrowUp":
            if ( ! this.rotVertical ) {
              this.rotVertical = this.cameraRotation(camera1, 'x', -Math.PI/2.1, 3);
            }
            break;
          case "ArrowDown":
            if ( ! this.rotVertical ) {
              this.rotVertical = this.cameraRotation(camera1, 'x', Math.PI/2.1, 3);
            }
            break;
          default:
            // this can be used as text input eventually
            break;
        }
        break;
      case BABYLON.KeyboardEventTypes.KEYUP:
        //console.log("KEY UP: ", kbInfo.event.keyCode);
        switch (kbInfo.event.key) {
          case "ArrowLeft":
          case "ArrowRight":
            if ( this.rotAround) {
              console.log("RotAround stop");
              this.rotAround.stop();
              delete this.rotAround;
            }
            break;
          case "ArrowUp":
          case "ArrowDown":
            if ( this.rotVertical ) {
              console.log("RotVertical stop");
              this.rotVertical.stop();
              delete this.rotVertical;
            }
            break;
          default:
            // this can be used as text input eventually
            break;
        }
        break;
    }
  }

  handleArcCamKeys(kbInfo) {
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        //console.log("KEY DOWN: ", kbInfo.event.key, " directions: "+this.movingDirections);
        switch (kbInfo.event.key) {
          case "Shift":
            this.shiftPressed = true;
            break;
          case "ArrowLeft":
            if ( ! this.rotAround ) {
              this.rotAround = this.arcRotation(camera3, 'alpha', camera3.alpha+Math.PI*2, 3);
            }
            break;
          case "a":
          case "A":
            if ( ! this.movingLeft ) {
              this.addDirection(this.leftVector);
              this.movingLeft = true;
            }
            break;
          case "ArrowRight":
            if ( ! this.rotAround ) {
              this.rotAround = this.arcRotation(camera3, 'alpha', camera3.alpha-Math.PI*2, 3);
            }
            break;
          case "d":
          case "D":
            if ( ! this.movingRight ) {
              this.addDirection(this.rightVector);
              this.movingRight = true;
            }
            break;
          case "ArrowUp":
            if ( ! this.shiftPressed ) {
              if ( ! this.rotVertical ) {
                this.rotVertical = this.arcRotation(camera3, 'beta', 0, 2-camera3.beta/Math.PI);
                //this.rotVertical = this.arcRotation(camera3, 'beta', Math.PI/2, 2-camera3.beta/Math.PI);
              }
            } else {
              if ( ! this.camRadius ) {
                this.camRadius = this.arcRotation(camera3, 'radius', 0, 3);
              }
            }
            break;
          case "w":
          case "W":
            if ( ! this.movingForward ) {
              this.addDirection(this.forwardVector);
              this.movingForward = true;
            }
            break;
          case "ArrowDown":
            if ( ! this.shiftPressed ) {
              if ( ! this.rotVertical ) {
                this.rotVertical = this.arcRotation(camera3, 'beta', Math.PI/2, 2-camera3.beta/Math.PI);
                //this.rotVertical = this.arcRotation(camera3, 'beta', 0, 2-camera3.beta/Math.PI);
              }
            } else {
              if ( ! this.camRadius ) {
                this.camRadius = this.arcRotation(camera3, 'radius', 5, 3);
              }
            }
            break;
          case "s":
          case "S":
            if ( ! this.movingBackward ) {
              this.addDirection(this.backwardVector);
              this.movingBackward = true;
            }
            break;
          case "PageUp":
          case " ":
            if ( this.movingDownward ) {
              this.movingDownward = false;
              this.stopDirection(this.downwardVector);
            }
            if ( ! this.movingUpward ) {
              this.addDirection(this.upwardVector);
              this.movingUpward = true;
            }
            break;
          default:
            // this can be used as text input eventually
            break;
        }
        break;
      case BABYLON.KeyboardEventTypes.KEYUP:
        //console.log("KEY UP: ", kbInfo.event.keyCode, " directions: "+this.movingDirections);
        switch (kbInfo.event.key) {
          case "Shift":
            this.shiftPressed = false;
            if ( this.camRadius ) {
              this.camRadius.stop();
              delete this.camRadius;
            }
            break;
          case "ArrowLeft":
            if ( this.rotAround ) {
              console.log("RotAround stop");
              this.rotAround.stop();
              delete this.rotAround;
            }
            break;
          case "a":
          case "A":
            if ( this.movingLeft ) {
              this.movingLeft = false;
              this.stopDirection(this.leftVector);
            }
            break;
          case "ArrowRight":
            if ( this.rotAround) {
              console.log("RotAround stop");
              this.rotAround.stop();
              delete this.rotAround;
            }
            break;
          case "d":
          case "D":
            if ( this.movingRight ) {
              this.movingRight = false;
              this.stopDirection(this.rightVector);
            }
            break;
          case "ArrowUp":
            if ( this.rotVertical ) {
              console.log("RotVertical stop");
              this.rotVertical.stop();
              delete this.rotVertical;
            }
            if ( this.camRadius ) {
              this.camRadius.stop();
              delete this.camRadius;
            }
            break;
          case "w":
          case "W":
            if ( this.movingForward ) {
              this.movingForward = false;
              this.stopDirection(this.forwardVector);
            }
            break;
          case "ArrowDown":
            if ( this.rotVertical ) {
              console.log("RotVertical stop");
              this.rotVertical.stop();
              delete this.rotVertical;
            }
            if ( this.camRadius ) {
              this.camRadius.stop();
              delete this.camRadius;
            }
            break;
          case "s":
          case "S":
            if ( this.movingBackward ) {
              this.movingBackward = false;
              this.stopDirection(this.backwardVector);
            }
            break;
          case "PageUp":
          case " ":
            if ( this.movingUpward ) {
              this.movingUpward = false;
              this.stopDirection(this.upwardVector);
              this.addDirection(this.downwardVector);
              this.movingDownward = true;
            }
            break;
          default:
            // this can be used as text input eventually
            break;
        }
        break;
    }

  }
  handleKeyboard(kbInfo) {
    if ( activeCameraType === '1p' ) {
      this.handleUniCamKeys(kbInfo);
    } else if ( activeCameraType === '3p' ) {
      this.handleArcCamKeys(kbInfo);
    }
  }

  addDirection(vector) {
    if ( this.movingToTarget ) {
      this.stopMovement();
    }
    this.movementDirection.addInPlace(vector);
    this.movingDirections++;
  }
  stopDirection(vector) {
    this.movementDirection.subtractInPlace(vector);
    this.movingDirections--;
    if ( this.movingDirections == 0 ) {
      this.stopMovement();
    }
  }
  
  stopMovement() {
    this.timestamp = 0;
    this.movingDirections = 0;
    this.movingLeft = this.movingRight = this.movingForward = this.movingBackward = this.movingUpward = this.movingDownward = false;
    this.movingToTarget = false;
    this.movementTarget = null;
    this.movementDirection = new BABYLON.Vector3(0,0,0);
    this.xDist = null;
    this.zDist = null;
  }
  
  moveAvatar() {
    if ( activeCameraType != '3p' || (this.movingDirections == 0 && !this.movingToTarget)) {
      return;
    }
    if ( this.timestamp == 0 ) {
      this.timestamp = Date.now();
      this.movementStart = Date.now();
      return;
    } else if ( this.movingToTarget && this.movementStart + this.movementTimeout < this.timestamp ) {
      // could not reach the destination, stop
      console.log("Stopping movement due to timeout");
      this.stopMovement();
      return;
    }
    var avatar = this.world.video.mesh;
    var old = this.timestamp;
    this.timestamp = Date.now();
    var delta = (this.timestamp - old)/100; // CHECKME this was supposed to be 1000!
    var distance = camera3.speed * delta;
    //console.log("speed: "+camera3.speed+" dist: "+distance+" time: "+delta);
    var gravity = new BABYLON.Vector3(0,this.world.scene.gravity.y,0);
    // height correction:
    var origin = avatar.position.subtract( new BABYLON.Vector3(0,-this.world.videoAvatarSize,0));
    var ray = new BABYLON.Ray(origin, this.DOWN, 10);
    var hit = this.world.scene.pickWithRay(ray, (mesh) => mesh !== avatar && mesh.name !== 'particleSource' && mesh.name !== 'VideoAvatarBackground' );
    //console.log(avatar.position.y+" "+hit.pickedPoint.y+" "+hit.pickedMesh.id);
    // this puts avatar right on top of whatever is below it - a bumpy ride:
    //avatar.position.y = hit.pickedPoint.y+this.world.videoAvatarSize;
    // so we conditionally increase gravity to make it smooth:
    if (hit.pickedPoint.y+this.world.videoAvatarSize < avatar.position.y - 0.2 - this.world.avatarHeight) {
      if ( ! this.movingUpward ) {
        // if not flying, increase the gravity so the avatar falls down
        // CHECKME: this value is tailored to stairs
        //console.log("Gravity changes: "+avatar.position.y+" "+hit.pickedPoint.y+" "+hit.pickedMesh.id);
        gravity.y = -1;
        // TODO: instead of gravity modification we could use this.downwardVector
      }
    } else if ( this.movingDownward ) {
      // fallen to the floor, stop moving down
      this.movingDownward = false;
      this.stopDirection(this.downwardVector);
    }
    // we finally have desired movement direction
    var direction = this.movementDirection.add(gravity).normalize().scale(distance);
    if ( this.movingDirections > 0 ) {
      var angle = -1.5*Math.PI-camera3.alpha;
      var rotation = BABYLON.Quaternion.RotationAxis( BABYLON.Axis.Y, angle);
      direction.rotateByQuaternionToRef( rotation, direction );
      avatar.moveWithCollisions(direction);
    } else if ( this.movingToTarget ) {
      // on click, moving without gravity
      var xDist = Math.abs(avatar.position.x - this.movementTarget.x);
      var zDist = Math.abs(avatar.position.z - this.movementTarget.z);
      if ( xDist < 0.2 && zDist < 0.2) {
        console.log("Arrived to destination: "+avatar.position);
        this.stopMovement();
      } else if ( this.xDist && this.zDist && xDist > this.xDist && zDist > this.zDist ) {
        console.log("Missed destination: "+avatar.position+" by "+xDist+","+zDist);
        this.stopMovement();
      } else {
        avatar.moveWithCollisions(direction);
        this.xDist = xDist;
        this.zDist = zDist;
      }
    }
    this.world.movementTracker.position = avatar.position;
  }

  // mouse event handler - move avatar to point
  handleClick(pointerInfo) {
    if ( activeCameraType != '3p' || this.movingDirections > 0 ) {
      return;
    }
    if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP ) {
      //console.log(pointerInfo);
      // LMB: 0, RMB: 2
      if ( pointerInfo.event.button == 0 ) {
        this.moveToTarget(pointerInfo.pickInfo.pickedPoint);
      }
    }
  }

  moveToTarget(point) {
    if ( this.movingDirections > 0 ) {
      return;
    }
    var avatar = this.world.video.mesh;
    this.movementTarget = new BABYLON.Vector3(point.x, point.y, point.z);
    this.movementDirection = this.movementTarget.subtract(avatar.position);
    console.log("Moving from "+avatar.position+" to "+this.movementTarget+" direction "+this.movementDirection);
    this.movingToTarget = true;
  }

}

class HoloAvatar extends VideoAvatar {
  show() {
    super.show();
    this.mesh.ellipsoid = new BABYLON.Vector3(this.radius, this.radius+this.avatarHeight, this.radius);
    this.mesh.position = new BABYLON.Vector3( 0, this.radius+this.avatarHeight, 0);
    this.mesh.material.backFaceCulling = false;

    if ( trackAvatarRotation ) {
      this.mesh.rotation = new BABYLON.Vector3(0,Math.PI,0);
      this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
    }

    this.back = BABYLON.MeshBuilder.CreateDisc("VideoAvatarBackground", {radius:this.radius}, this.scene);
    this.back.position = new BABYLON.Vector3( 0, 0, 0.001);
    this.back.material = new BABYLON.StandardMaterial("BackgroundMat", this.scene);
    this.back.material.emissiveColor = new BABYLON.Color3.Black();
    this.back.material.specularColor = new BABYLON.Color3.Black();
    this.back.material.backFaceCulling = false;
    this.back.visibility = 0.5;
    this.back.parent = this.mesh;

    this.startParticles(this.altText);
  }

  applyRotation(enable) {
    console.log( this.altText +" applying rotation: "+enable);
    if ( enable ) {
      this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
      this.mesh.rotation = new BABYLON.Vector3(0,Math.PI,0);
    } else {
      this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      this.mesh.rotation = new BABYLON.Vector3(0,0,0);
    }
  }

  detachFromCamera() {
    super.detachFromCamera();
    this.movementTracker.position = this.mesh.position;
    if ( trackAvatarRotation ) {
      this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
    }
  }
  attachToCamera(pos) {
    super.attachToCamera(pos);
    this.mesh.rotation = new BABYLON.Vector3(0,0,0);
  }
  startParticles( name ) {
    var particleSystem;

    if (BABYLON.GPUParticleSystem.IsSupported) {
      // does not work in XR, renders only in one eye
      particleSystem = new BABYLON.GPUParticleSystem("particles:"+name, { capacity:100 }, this.scene);
      particleSystem.activeParticleCount = 100;
    } else {
      particleSystem = new BABYLON.ParticleSystem("particles:"+name, 100, this.scene);
    }

    particleSystem.color1 = this.randomColor();
    particleSystem.color2 = this.randomColor();
    particleSystem.colorDead = new BABYLON.Color4(particleSystem.color2.r/10,particleSystem.color2.g/10,particleSystem.color2.b/10,0);
    particleSystem.emitRate = 10;
    //particleSystem.particleEmitterType = new BABYLON.SphereParticleEmitter(0.1);
    particleSystem.particleEmitterType = new BABYLON.ConeParticleEmitter(this.radius, Math.PI);
    particleSystem.particleEmitterType.radiusRange = 1;
    particleSystem.particleEmitterType.heightRange = 1;
    particleSystem.particleTexture = new BABYLON.Texture("//www.babylonjs-playground.com//textures/flare.png", this.scene); // FIXME: cdn
    particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 3;
    particleSystem.minSize = 0.01;
    particleSystem.maxSize = 0.2;
    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.3;
    var fountain = BABYLON.Mesh.CreateBox("particleSource", 0.1, this.scene);
    fountain.position = new BABYLON.Vector3(0, -this.radius*1.2, 0);
    fountain.parent = this.mesh;
    fountain.visibility = 0;
    particleSystem.emitter = fountain;

    particleSystem.start();
    return particleSystem;
  }
  randomColor() {
    return new BABYLON.Color4(Math.random(), Math.random, Math.random(), Math.random()/5+0.8);
  }
}

class MediaSoup extends MediaStreams {

  constructor(scene, htmlElementName, userSettings, eventConfig) {
    super(scene, htmlElementName);
    this.userSettings = userSettings;
    this.eventConfig = eventConfig;
  }

  addANewVideoElement(track, isLocal, peerId= false) {
    if (isLocal) {
      document.querySelector("#localVideo").srcObject = new MediaStream([track]);
      document.querySelector("#localVideo").setAttribute('peerId', worldManager.VRSPACE.me.id);
    } else {

      let videoElement = document.querySelector(`video[peerid='${peerId}']`);
      if(videoElement) {
        // Video element already exists no need to create one (this is the case when users pause/resume video)
        videoElement.srcObject = new MediaStream([track]);
        return;
      }

      const newVideoElement = document.createElement("video");
      newVideoElement.muted = true;
      newVideoElement.playsInline = true;
      newVideoElement.autoplay = true;
      newVideoElement.controls = true;
      newVideoElement.srcObject = new MediaStream([track]);
      newVideoElement.classList.add("vid");
      const mainVideoContainer = document.getElementById(this.htmlElementName);
      const videoDiv = document.createElement('div');
      videoDiv.classList.add("relative");
      if(peerId) {
        newVideoElement.setAttribute('peerId', peerId);
      }
      let badge = document.createElement('div');
      badge.setAttribute('class','absolute top-0 right-0 bg-indigo-500 mt-2 mr-2 px-3 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer');
      badge.innerHTML = 'CAST';
      badge.addEventListener('click', () => {
        document.querySelector("#app").__vue_app__._component.methods.castUser(peerId)
      })
      videoDiv.appendChild(badge)
      videoDiv.appendChild(newVideoElement);
      mainVideoContainer.appendChild(videoDiv);
    }
  }

  async init( roomId, callback ) {
    if(!this.userSettings.enableWebcamFeeds) {
      return;
    }
    // Initializing connection to the server.
    let roomClient = new mediasoup.RoomClient({
      roomId: roomId,
      peerId: worldManager.VRSPACE.me.id,
      displayName: worldManager.VRSPACE.me.name,
      baseUrl: this.eventConfig.mediaSoup['url'], // FIXME use property
      // modes: VIDEO_ONLY, AUDIO_ONLY, AUDIO_AND_VIDEO
      mode: mediasoup.MODES.VIDEO_ONLY,
      useSimulcast: false,
      forceH264: false,
      resolution: this.role === 'artist' ? 'uhd' : 'vga'
    });
    await roomClient.join();
    // Listen for events on 'PRODUCER's. Local tracks.
    roomClient.on(mediasoup.EVENTS.PRODUCER.NEW_PRODUCER, (producer) => {
      const track = producer.track;
      // Producers are local tracks
      this.addANewVideoElement(track, true);
      console.log("New producer")
    });
    // Listen for events on 'CONSUMERS's. Local tracks.
    roomClient.on(mediasoup.EVENTS.CONSUMER.NEW_CONSUMER, (event) => {
      console.log("New consumer")
      console.log(event);
      const track = event.consumer.track;
      // Consumers are remote tracks
      this.addANewVideoElement(track, false, event.peerId);
      if ( callback ) {
        callback( event );
      }
    });
    roomClient.on(mediasoup.EVENTS.CONSUMER.REMOVE_CONSUMER, (event) => {
      console.log("Video stream stopped");
      var clientId = this.getClientId(event);
      for ( var i = 0; i < this.clients.length; i++ ) {
        if ( this.clients[i].id == clientId ) {
          var avatar = this.clients[i].video;
          avatar.displayAlt();
          break;
        }
      }
    });
    // Print all supported events
    console.log("Here's a list of mediasoup events supported.");
    console.log(mediasoup.EVENTS);
    //Subscribing to all events
    const eventGroups = Object.keys(mediasoup.EVENTS);
    for (const group of eventGroups) {
      let events = Object.keys(mediasoup.EVENTS[group]);
      for (const ev of events) {
        roomClient.on(ev, (data) => {
          console.log(`${group} Event: ${ev}`, data);
        });
      }
    }

    window.roomClient = roomClient;
  }

  async connect(roomId) {
    await this.init(roomId, (subscriber) => this.streamingStart(subscriber));
  }

  publish(htmlElementName) {
    console.log("Started publishing video/audio")
  }

  publishVideo(enabled) {
    console.log("TODO Publishing video: "+enabled);
  }

  publishAudio(enabled) {
    console.log("TODO Publishing audio: "+enabled);
  }

  getClientId(consumerEvent) {
    return parseInt(consumerEvent.peerId,10);
  }

  getStream(consumerEvent) {
    console.log(consumerEvent.consumer.track);
    return new MediaStream([consumerEvent.consumer.track]);
  }

  attachVideoStream(client, consumerEvent) {
    if ( client.video ) {
      console.log(consumerEvent);
      var mediaStream = this.getStream(consumerEvent);
      var videoTracks = mediaStream.getVideoTracks();
      if ( videoTracks && videoTracks.length > 0 ) {
        console.log("Attaching video stream to client "+client.id);
        client.video.displayStream(mediaStream);
      }
    }
  }


}

class Emoji {
  constructor( filename, baseUrl, scene ) {
    this.href = baseUrl + filename;
    this.baseUrl = baseUrl;
    this.file = filename;
    this.texture = new BABYLON.Texture(this.href, scene, null, false);
    this.texture.name = "emoji:"+this.file;
    this.name = this.file.substring(0, this.file.lastIndexOf('.'));
  }
}
class Emojis {
  constructor(world, position, callback) {
    this.world = world;
    this.scene = world.scene;
    this.position = position;
    this.callback = callback;
    this.baseUrl = "/assets/emojis/";
    this.suffix = ".png";
    this.emojis = [
      "1f44b.png",
      "1f44c.png",
      "1f44d.png",
      "1f44f.png",
      "1f493.png",
      "1f525.png",
      "1f608.png",
      "1f60d.png",
      "1f60e.png",
      "1f635-1f4ab.png",
      "1f64c.png",
      "1f64f.png",
      "1f918.png",
      "1f919.png",
      "1f923.png",
      "1f929.png",
      "1f92b.png",
      "1f970.png",
      "1f971.png",
      "1f972.png",
      "1f973.png",
      "1f975.png",
      "1f976.png",
      "1f9e8.png",
      "270a.png",
      "2764-1f525.png",
      "alien.png",
      "beaming-face-with-smiling-eyes.png",
      "exploding-head.png",
      "face-blowing-a-kiss.png",
      "face-with-hand-over-mouth.png",
      "face-with-symbols-on-mouth.png",
      "face-with-tongue.png",
      "skull.png",
      "slightly-smiling-face.png",
      "winking-face.png",
    ];
  }
  init() {
    for(var i = 0; i < this.emojis.length; i++) {
      this.emojis[i] = new Emoji(this.emojis[i], this.baseUrl, this.scene);
    }
    console.log(this.emojis);
    if ( this.callback ) {
      this.callback(this);
    }
  }
  copy() {
    var ret = new Emojis(this.scene);
    ret.emojis = this.emojis;
    return ret;
  }
  play( icon ) {
    this.execute(icon);
    worldManager.VRSPACE.sendMy('emojiEvent',{emoji:icon});
  }
  execute( icon ) {
    //console.log("Playing "+icon);
    var index = this.emojis.findIndex((emoji) => emoji.file.toLowerCase().includes(icon.toLowerCase()));
    if ( index < 0 ) {
      // log error
      return false;
    }
    var emoji = this.emojis[index];

    var mesh = BABYLON.MeshBuilder.CreateDisc("Emoji:"+emoji.file, {radius:this.world.videoAvatarSize}, this.scene);
    mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    mesh.position = new BABYLON.Vector3( this.position.x, this.position.y, this.position.z);
    mesh.material = new BABYLON.StandardMaterial("Emoji:"+emoji.file, this.scene);
    mesh.material.emissiveColor = new BABYLON.Color3.White();
    mesh.material.specularColor = new BABYLON.Color4(0,0,0,0);
    mesh.material.transparencyMode = BABYLON.StandardMaterial.MATERIAL_ALPHATESTANDBLEND;
    mesh.material.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
    mesh.visibility = 0.95;
    mesh.material.diffuseTexture = emoji.texture;
    if ( this.scene.effectLayers ) {
      this.scene.effectLayers.forEach( (layer) => {
        if ( 'GlowLayer' === layer.getClassName() ) {
          layer.addExcludedMesh(mesh);
        }
      });
    }

    // forward vector of own avatar (1st person camera)
    var distance = 2;
    var forward = camera1.getForwardRay(distance).direction.add(this.position);
    var yStart = this.position.y;
    if ( this.avatar ) {
      yStart = this.position.y+this.world.avatarHeight+this.world.videoAvatarSize;
      // forward vector of other avatars
      console.log(this.avatar.rotation.y);
      mesh.forward.scale(distance).rotateByQuaternionToRef(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, this.avatar.rotation.y), forward);
      console.log(forward);
      forward.addInPlace(new BABYLON.Vector3( this.position.x, yStart, this.position.z));
      console.log(forward);
    }
    // animation of position
    var animPos = new BABYLON.AnimationGroup("tranAnim "+mesh.id);
    var xAnim = new BABYLON.Animation("xAnim "+mesh.id, "position.x", 2, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var xKeys = [];
    xKeys.push({frame:0, value: this.position.x});
    xKeys.push({frame:.5, value: forward.x});
    xKeys.push({frame:2, value: forward.x});
    xAnim.setKeys(xKeys);

    var yAnim = new BABYLON.Animation("yAnim "+mesh.id, "position.y", 2, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var yKeys = [];
    yKeys.push({frame:0, value: yStart});
    yKeys.push({frame:.5, value: forward.y});
    yKeys.push({frame:2, value: forward.y+2});
    yAnim.setKeys(yKeys);

    var zAnim = new BABYLON.Animation("zAnim "+mesh.id, "position.z", 2, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var zKeys = [];
    zKeys.push({frame:0, value: this.position.z});
    zKeys.push({frame:.5, value: forward.z});
    zKeys.push({frame:2, value: forward.z});
    zAnim.setKeys(zKeys);

    animPos.addTargetedAnimation(xAnim, mesh);
    animPos.addTargetedAnimation(yAnim, mesh);
    animPos.addTargetedAnimation(zAnim, mesh);

    // of scale
    var animScale = VRSPACEUI.createAnimation(mesh, "scaling", 1);

    // transparency animation
    var animTran = new BABYLON.AnimationGroup("tranAnim "+mesh.id);
    var vAnim = new BABYLON.Animation("xAnim "+mesh.id, "visibility", 1, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var vKeys = [];
    vKeys.push({frame:0, value: 0.95});
    vKeys.push({frame:1, value: 0});
    vAnim.setKeys(vKeys);
    animTran.addTargetedAnimation(vAnim, mesh);

    // animation chain
    animPos.onAnimationGroupEndObservable.add(() => {
      console.log("Position animation ended, starting transparency animation");
      animTran.play(false);
    });
    animScale.onAnimationGroupEndObservable.add(() => {
      //console.log("Scale animation ended");
    });
    animTran.onAnimationGroupEndObservable.add(() => {
      console.log("Transparency animation ended");
      mesh.material.dispose();
      mesh.dispose();
      animTran.dispose();
      animPos.dispose();
      animScale.dispose();
    });

    // start animations
    animPos.play(false);
    VRSPACEUI.updateAnimation(animScale, new BABYLON.Vector3(.2,.2,.2), new BABYLON.Vector3(2.5,2.5,2.5));
  }
}

class StageControls {
  constructor (displays, position, callback, userSettings, world) {
    this.displays = displays;
    this.callback = callback;
    this.videos = Videos;
    this.userSettings = userSettings;
    this.world = world;
    this.userBeingCasted = false;
  }
  init () {
    if (this.callback) {
      this.callback(this);
    }
  }
  executeAndSend(event) {
    this.execute(event);
    worldManager.VRSPACE.sendMy('properties', {stageEvent: event});
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
    if(!this.userSettings.enableVisuals) {
      return;
    }
    /* If a user was being casted continue playing the video element since initializeDisplays will have paused it when disposing previous textures */
    let resumeUserPlayback = this.userBeingCasted;

    switch(event.action) {
      case 'playVideo':
        this.world.initializeDisplays(Videos[event.videoIndex].url, [event.target]);
        this.userBeingCasted = false;
        break;
      case "castUser":
        let video = this.fetchPeerVideoElement(event.userId);
        if(video) {
          this.world.initializeDisplays(video, [event.target]);
          this.userBeingCasted = event.userId;
        }
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

class CinemaCamera {
  constructor (camera, scene, startDelay = 200) {
    this.camera = camera;
    this.scene = scene;
    this.startDelay = startDelay;
    this.animations = [];
    this.activeAnimation = null;
    this.continueLooping = true;

    let cameraLocations = {
      entrance: {"position":{"_x":11,"_y":1.3,"_z":-7},"rotation":{"_x":0,"_y":-1.0164888305933453,"_z":0}},
      dj_from_the_bar: {"position":{"_x":2.714840163985193,"_y":1.3339231382204182,"_z":-5.868889062744814},"rotation":{"_x":0.00042169254924161756,"_y":0.03705942461793172,"_z":0}},
      dj_from_up_close: {"position":{"_x":2.1662825842177846,"_y":1.740671993075563,"_z":-0.38394678566868107},"rotation":{"_x":-0.024783995888239835,"_y":-0.019345515355607173,"_z":0}},
      dj_from_right: {"position":{"_x":-2.8875171844546332,"_y":1.461973115676424,"_z":2.2319816266069075},"rotation":{"_x":0.11693282179127831,"_y":-4.924461272584404,"_z":0}},
      dj_from_left: {"position":{"_x":7.415755414815222,"_y":1.6281320635511969,"_z":3.0938173942103186},"rotation":{"_x":0.11770537694297362,"_y":-1.6259616682580837,"_z":0}},
      dj_from_top1: {"position":{"_x":-3.0276884678910436,"_y":4.137822730670261,"_z":-0.8604685460075695},"rotation":{"_x":0.3063117451302702,"_y":-5.314213785486876,"_z":0}},
      dj_from_vip1: {"position":{"_x":6.768748635133134,"_y":4.5899211428664515,"_z":-3.5664481270748993},"rotation":{"_x":0.39154092157212694,"_y":-7.053671265867726,"_z":0}},
      dj_from_vip2: {"position":{"_x":-1.3820688725976336,"_y":4.589921143068838,"_z":-4.569677437859342},"rotation":{"_x":0.4086106496305842,"_y":-5.824089155980171,"_z":0}},
      dj_from_below_discoball: {"position":{"_x":1.9829657530152298,"_y":3.103685721748864,"_z":-1.2984003339030339},"rotation":{"_x":0.1870217542919634,"_y":-6.288925943372435,"_z":0}},
      dj_from_backleft_corner: {"position":{"_x":-4.485027962271525,"_y":1.3625359970272668,"_z":-8.514632060225212},"rotation":{"_x":0.038415992808978415,"_y":0.6701928433983576,"_z":0}},
      upstairs_above_entrance: {"position":{"_x":8.279987580621425,"_y":3.4784407195031353,"_z":-7.798026594595105},"rotation":{"_x":0.022450718554269652,"_y":-6.891998112460732,"_z":0}},
      looking_at_vip: {"position":{"_x":2.10075688137325,"_y":3.4784407194983173,"_z":-8.133120323944423},"rotation":{"_x":0.027763688608770456,"_y":-6.280938992224663,"_z":0}},
      looking_at_stairs: {"position":{"_x":8.190497947364703,"_y":0.8831396330634017,"_z":-5.747407506609874},"rotation":{"_x":0.01128888324500647,"_y":-6.303341016721594,"_z":0}},
      top_of_stairs1: {"position":{"_x":8.21030117260347,"_y":3.151785381961582,"_z":0.5791620253050075},"rotation":{"_x":-0.04244887857179293,"_y":-6.87231140146104,"_z":0}},
      top_of_stairs2: {"position":{"_x":8.289090959684218,"_y":4.589921142872952,"_z":1.1131866401635588},"rotation":{"_x":0.3771685581090427,"_y":-7.845735179807327,"_z":0}},
      behind_speaker1: {"position":{"_x":4.179318615201289,"_y":1.3839190687478113,"_z":5.692456027265751},"rotation":{"_x":-0.050882309901184586,"_y":-3.1256022124411023,"_z":0}},
      behind_speaker2: {"position":{"_x":-0.17988146430207216,"_y":1.3839190687493474,"_z":5.761730694590317},"rotation":{"_x":-0.050882309901184586,"_y":-3.1256022124411023,"_z":0}},
      dancefloor_from_above: {"position":{"_x":2.1021077141695486,"_y":4.435483809682374,"_z":-4.266230488669585},"rotation":{"_x":0.44719295280313265,"_y":-6.297006073294026,"_z":0}},
      bar_panoramic_start: {"position":{"_x":11.006752535000244,"_y":1.2016037517980154,"_z":-7.9789520080225325},"rotation":{"_x":0.0954239847343085,"_y":0.0018643144840171447,"_z":0}},
      bar_panoramic_end: {"position":{"_x":-2.6827037855288385,"_y":1.201603751800303,"_z":-7.97639981944732},"rotation":{"_x":0.0954239847343085,"_y":0.0018643144840171447,"_z":0}},
      panoramic_from_bar: {"position":{"_x":6.32981322804486,"_y":1.6281320635540006,"_z":-4.888944016223378},"rotation":{"_x":0.13230211106812823,"_y":-0.950139088213945,"_z":0}},
      corner_lounge: {"position":{"_x":-4.843006664490363,"_y":1.2586576992114813,"_z":4.6307094288794755},"rotation":{"_x":0.14650548312116665,"_y":-4.189883969397824,"_z":0}},
      backstage_corner: {"position":{"_x":4.874076350237268,"_y":-2.201754675378747,"_z":39.34873780254707},"rotation":{"_x":0.07254482094809912,"_y":-2.4642198020215798,"_z":0}},
      backstage_looking_at_tunnel: {"position":{"_x":2.0499726788635653,"_y":-2.1777192712307554,"_z":36.6986384170193},"rotation":{"_x":-0.009194905390009198,"_y":-3.1550966077990497,"_z":0}},
      ramp_start: {"position":{"_x":2.071731389224853,"_y":-2.162902796766129,"_z":20.58853095272788},"rotation":{"_x":-0.009194905390009198,"_y":-3.1550966077990497,"_z":0}},
      ramp_end1: {"position":{"_x":2.1996237616904084,"_y":0.5808306444420244,"_z":7.56427577584795},"rotation":{"_x":-0.20621751642862113,"_y":-3.131253356219028,"_z":0}},
      ramp_end2: {"position":{"_x":2.1978078268791146,"_y":0.9473518605430168,"_z":5.808878342623052},"rotation":{"_x":-0.20621751642862113,"_y":-3.131253356219028,"_z":0}},
      ramp_end3: {"position":{"_x":2.050838653369418,"_y":1.4087861288156869,"_z":5.686279198185502},"rotation":{"_x":-0.03992020396141434,"_y":-3.12658486710244,"_z":0}},
      ramp_end4: {"position":{"_x":2.0755127438449383,"_y":1.5071758010387701,"_z":5.170473439433556},"rotation":{"_x":0.13457014257789957,"_y":-3.149948680701199,"_z":0}},
      ramp_end5: {"position":{"_x":0.9039062563169764,"_y":1.5232882605165157,"_z":4.741485287637102},"rotation":{"_x":0.18786632050773774,"_y":-3.6597118317668893,"_z":0}},
      hover_looking_at_entrance: {"position":{"_isDirty":true,"_x":-0.5266157578849017,"_y":3.017267322480074,"_z":2.3930089890552533},"rotation":{"_isDirty":true,"_x":0.1953965619797092,"_y":-3.641191390899979,"_z":0}}
    }

    // Entrance panning to the DJ
    this.animations[0] = {
      0: cameraLocations.entrance,
      1400: cameraLocations.dj_from_the_bar,
      2500: cameraLocations.dj_from_up_close,
    }

    // Bar panoramic
    this.animations[1] = {
      0: cameraLocations.bar_panoramic_start,
      2500: cameraLocations.bar_panoramic_end
    }

    // Upstairs panoramic back down to the bar
    this.animations[2] = {
      0: cameraLocations.upstairs_above_entrance,
      800: cameraLocations.looking_at_vip,
      2200: cameraLocations.dancefloor_from_above,
      3200: cameraLocations.dj_from_top1,
      5400: cameraLocations.dj_from_left,
      6300: cameraLocations.panoramic_from_bar
    }

    // From entrance to the upstairs
    this.animations[3] = {
      0: cameraLocations.looking_at_stairs,
      1300: cameraLocations.top_of_stairs2,
      2000: cameraLocations.dj_from_vip1,
      2700: cameraLocations.dj_from_vip2,
    }

    // Panoramic from upstairs back corner
    this.animations[4] = {
      0: cameraLocations.upstairs_above_entrance,
      800: cameraLocations.dj_from_vip1,
      3000: cameraLocations.corner_lounge
    }

    // Panoramic entrance to the left side
    this.animations[5] = {
      0: {"position":{"_x":8.069870792404346,"_y":1.0500232098477533,"_z":-4.766294851415272},"rotation":{"_x":0.051664574268398905,"_y":-0.6955063511428636,"_z":0}},
      2500: {"position":{"_x":-3.031639654711813,"_y":1.0310475325350523,"_z":-2.3266791538559204},"rotation":{"_x":0.04145216762484045,"_y":0.995520275366068,"_z":0}}
    }

    // Reverse panoramic entrance to the left side
    this.animations[6] = {
      0: {"position":{"_x":-3.031639654711813,"_y":1.0310475325350523,"_z":-2.3266791538559204},"rotation":{"_x":0.04145216762484045,"_y":0.995520275366068,"_z":0}},
      2500: {"position":{"_x":8.069870792404346,"_y":1.0500232098477533,"_z":-4.766294851415272},"rotation":{"_x":0.051664574268398905,"_y":-0.6955063511428636,"_z":0}}
    }

    // Reverse panoramic entrance to the left side
    this.animations[7] = {
      0: {"position":{"_x":8.67783698284091,"_y":1.3437483999015625,"_z":5.658542332119999},"rotation":{"_x":0.05186080617876933,"_y":-2.4143524702760613,"_z":0}},
      3000: {"position":{"_x":-4.428034873689916,"_y":1.374658707615629,"_z":5.673964767528411},"rotation":{"_x":0.018040232815208477,"_y":-3.730873577932433,"_z":0}}
    }

    this.animations[8] = {
      0: {"position":{"_x":2.065910364902137,"_y":0.7267225326396447,"_z":5.655121757949481},"rotation":{"_x":0.0030849251800172815,"_y":-3.119321382298109,"_z":0}},
      1700: {"position":{"_x":2.065548053288544,"_y":4.169040311582728,"_z":5.068243439306985},"rotation":{"_x":0.29675163370755114,"_y":-3.1422480242416366,"_z":0}}
    }

    this.animations[9] = {
      0: cameraLocations.backstage_looking_at_tunnel,
      800: cameraLocations.ramp_start,
      1500: cameraLocations.ramp_end2,
      2400: {"position":{"_isDirty":true,"_x":3.0060449035674064,"_y":1.6822938611957166,"_z":5.55129439625964},"rotation":{"_isDirty":true,"_x":0.37389716100755305,"_y":-2.757087932494489,"_z":0}},
      3200: {"position":{"_isDirty":true,"_x":4.594282606288688,"_y":2.360403962693647,"_z":5.518596067365541},"rotation":{"_isDirty":true,"_x":0.3291938980363425,"_y":-2.341850515739511,"_z":0}},
      4200: {"position":{"_x":8.069870792404346,"_y":1.0500232098477533,"_z":-4.766294851415272},"rotation":{"_x":0.051664574268398905,"_y":-0.6955063511428636,"_z":0}}
    }

    this.autoLoopSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  }
  convertToVector3(coords) {
    return new BABYLON.Vector3(coords['_x'], coords['_y'], coords['_z']);
  }
  buildKeys(animation, type) {
    let keys = [];
    for(var frame of Object.keys(animation)) {
      keys.push({
        frame: parseInt(frame) + this.startDelay,
        value: this.convertToVector3(animation[frame][type])
      })
    }
    keys.splice(0, 0,{
      frame: 0,
      value: this.convertToVector3(animation[0][type])
    })
    return keys;
  }
  play(animationNumber, restartLoop) {
    if(restartLoop) {
      this.continueLooping = true;
    }
    let animation = this.animations[animationNumber];
    this.camera.animations = [];
    for(let type of ['position', 'rotation']) {
      let animationCamera = new BABYLON.Animation(
        `${type}Animation`,
        type,
        100,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      if(document.querySelector('#easing').value !== "") {
        let ease = new BABYLON[document.querySelector('#easing').value]();
        ease.setEasingMode(BABYLON.EasingFunction.EASEINOUT);
        animationCamera.setEasingFunction(ease);
      }
      let keys = this.buildKeys(animation, type);
      animationCamera.setKeys(keys);
      this.camera.animations.push(animationCamera);
    }
    let frames = Object.keys(animation);
    this.activeAnimation = this.scene.beginAnimation(this.camera, 0, frames[frames.length - 1] + this.startDelay, false, 1, () => {
      this.activeAnimation = null;
      if(this.continueLooping) {
        setTimeout(() => {
          var autoLoopIndex = this.autoLoopSequence.indexOf(animationNumber);
          var nextAnimation = this.autoLoopSequence[autoLoopIndex + 1];
          if(nextAnimation) {
            this.play(animationNumber + 1)
          } else {
            this.play(0)
          }
        }, 10000)
      }
    });
    this.showHideUI();
    document.removeEventListener('keydown', this.stop.bind(this))
    document.addEventListener('keydown', this.stop.bind(this));
  }
  stop(event) {
    if(event.key === "Escape"){
      this.showHideUI(false)
      if(this.activeAnimation) {
        this.continueLooping = false;
        this.activeAnimation.stop();
      }
    }
  }
  showHideUI(hide = true) {
    var controls = document.body.querySelectorAll(":not(canvas, #app, #app > div, audio)");
    for(var el of controls) {
      if(hide) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    }
  }
}

export default NightClub;