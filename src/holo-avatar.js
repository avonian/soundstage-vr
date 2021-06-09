import { VideoAvatar } from '@avonian/vrspace-frontend/src/lib/index-min';

export class HoloAvatar extends VideoAvatar {
  show(otherUser = true) {
    super.show();
    this.mesh.ellipsoid = new BABYLON.Vector3(this.radius, this.radius+this.avatarHeight, this.radius);
    this.mesh.position = new BABYLON.Vector3( 0, this.radius+this.avatarHeight, 0);
    this.mesh.material.backFaceCulling = false;

    if ( this.trackAvatarRotation ) {
      this.mesh.rotation = new BABYLON.Vector3(0,Math.PI,0);
      this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
    }

    if(otherUser) {
      this.mesh.isPickable = true;
      this.mesh.actionManager = new BABYLON.ActionManager(this.scene);
      this.mesh.actionManager
        .registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
              let pickedMesh = event.meshUnderPointer;
              pickedMesh.material.diffuseTexture.level = 1.2;
            })
        )
      this.mesh.actionManager
        .registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
              let pickedMesh = event.meshUnderPointer;
              pickedMesh.material.diffuseTexture.level = 1;
            })
        )
      this.mesh.actionManager
        .registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, (event) => {
              let pickedMesh = event.meshUnderPointer;
              document.querySelector("#app")._vnode.component.data.avatarMenuClientId = pickedMesh.id.replace("Client ", "");
            })
        )
      if(document.querySelector("#app")._vnode.component.data.userSettings.soundOnJoin) {
        var ring = new Audio('http://assets.soundstage.fm/vr/user-joined.mp3');
        ring.play();
      }
    }

    this.back = BABYLON.MeshBuilder.CreateDisc("VideoAvatarBackground", {radius:this.radius}, this.scene);
    this.back.position = new BABYLON.Vector3( 0, 0, 0.001);
    this.back.material = new BABYLON.StandardMaterial("BackgroundMat", this.scene);
    this.back.material.emissiveColor = new BABYLON.Color3.Black();
    this.back.material.specularColor = new BABYLON.Color3.Black();
    this.back.material.backFaceCulling = false;
    this.back.visibility = 0.5;
    this.back.parent = this.mesh;

    this.particleSystem = this.startParticles(this.altText);
  }

  displayStream(mediaStream) {
    super.displayStream(mediaStream);
    if ( this.streamCallback ) {
      this.streamCallback(this);
    }
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
    if ( this.trackAvatarRotation ) {
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
  dispose() {
    super.dispose();
    this.back.material.dispose();
    this.particleSystem.dispose();
  }
}

export default HoloAvatar;