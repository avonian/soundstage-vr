import Utilities from './utilities'

export class CinemaCamera {
  constructor (camera, scene, config, defaultStartDelay = 200) {
    this.camera = camera;
    this.scene = scene;
    this.defaultStartDelay = defaultStartDelay;
    this.animations = [];
    this.activeAnimation = null;
    this.nextAnimationTimeout;

    let cameraLocations = config.cameraLocations;
    this.animations = config.animations;
    this.autoLoopSequence = config.autoLoopSequence;
  }
  convertToVector3(coords) {
    return new BABYLON.Vector3(coords['_x'], coords['_y'], coords['_z']);
  }
  buildAnimationFrames(animation, immediate ) {
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
      let keys = this.buildKeys(animation, type, immediate);
      animationCamera.setKeys(keys);
      this.camera.animations.push(animationCamera);
    }
    return Object.keys(animation);
  }
  buildKeys(animation, type ) {
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
  stopAnimationChain(event) {
    if(event){
      if(event.key !== "Escape") {
        return;
      } else {
        Utilities.showHideUI(false)
      }
    }
    if(this.activeAnimation) {
      this.activeAnimation.stop();
      this.activeAnimation = null;
    }
    if(this.nextAnimationTimeout) {
      clearTimeout(this.nextAnimationTimeout);
    }
  }
  pauseOnOff() {
    if(this.nextAnimationTimeout) {
      clearTimeout(this.nextAnimationTimeout);
    }
    if(!this.activeAnimation) {
      return;
    }
    if(this.activeAnimation.animationStarted) {
      this.activeAnimation.pause();
    } else {
      this.activeAnimation.restart();
    }
  }
  play(animationNumber, startDelay) {

    if(document.querySelector("#autoloop-sequence") && document.querySelector("#autoloop-sequence").value !== '') {
      this.autoLoopSequence = document.querySelector("#autoloop-sequence").value.replace(/' '/g,'').split(",").map(n => isNaN(n) ? n : parseInt(n));
    }

    this.stopAnimationChain();
    this.camera.animations = [];

    this.startDelay = startDelay ? startDelay : this.defaultStartDelay;
    let frames = this.buildAnimationFrames(this.animations[animationNumber]);

    let callback = function() {
      this.nextAnimationTimeout = setTimeout(function () {
        var autoLoopIndex = this.autoLoopSequence.indexOf(parseInt(animationNumber));
        var nextAnimation = this.autoLoopSequence[autoLoopIndex + 1];
        if(nextAnimation) {
          this.play(nextAnimation)
        } else {
          this.play(this.autoLoopSequence[0])
        }
      }.bind(this), 10000)
    }

    this.activeAnimation = this.scene.beginAnimation(this.camera, 0, frames[frames.length - 1] + this.startDelay, false, 1, callback.bind(this));
    Utilities.showHideUI();
    document.removeEventListener('keydown', this.stopAnimationChain.bind(this))
    document.addEventListener('keydown', this.stopAnimationChain.bind(this));
  }
}

export default CinemaCamera;