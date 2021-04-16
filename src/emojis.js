import { VRSPACEUI } from './vrspace-babylon.js';

export class Emoji {
  constructor( filename, baseUrl, scene ) {
    this.href = baseUrl + filename;
    this.baseUrl = baseUrl;
    this.file = filename;
    this.texture = new BABYLON.Texture(this.href, scene, null, false);
    this.texture.name = "emoji:"+this.file;
    this.name = this.file.substring(0, this.file.lastIndexOf('.'));
  }
}

export class Emojis {
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
    var ret = new Emojis(this.world);
    ret.emojis = this.emojis;
    return ret;
  }
  play( icon ) {
    this.execute(icon);
    this.world.worldManager.VRSPACE.sendMy('emojiEvent',{emoji:icon});
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
    var forward = this.world.camera1.getForwardRay(distance).direction.add(this.position);
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

export default Emojis;