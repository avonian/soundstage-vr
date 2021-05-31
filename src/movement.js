export class Movement {
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
    if(this.disableMovement) {
      return;
    }
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        //console.log("KEY DOWN: ", kbInfo.event.key);
        switch (kbInfo.event.key) {
          case "ArrowLeft":
            if ( ! this.rotAround ) {
              this.rotAround = this.cameraRotation(this.world.camera1, 'y', this.world.camera1.rotation.y-Math.PI*2, 5);
            }
            break;
          case "ArrowRight":
            if ( ! this.rotAround ) {
              this.rotAround = this.cameraRotation(this.world.camera1, 'y', this.world.camera1.rotation.y+Math.PI*2, 5);
            }
            break;
          case "ArrowUp":
            if ( ! this.rotVertical ) {
              this.rotVertical = this.cameraRotation(this.world.camera1, 'x', -Math.PI/2.1, 3);
            }
            break;
          case "ArrowDown":
            if ( ! this.rotVertical ) {
              this.rotVertical = this.cameraRotation(this.world.camera1, 'x', Math.PI/2.1, 3);
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
    if(this.disableMovement) {
      return;
    }
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        //console.log("KEY DOWN: ", kbInfo.event.key, " directions: "+this.movingDirections);
        switch (kbInfo.event.key) {
          case "Shift":
            this.shiftPressed = true;
            break;
          case "ArrowLeft":
            if ( ! this.rotAround ) {
              this.rotAround = this.arcRotation(this.world.camera3, 'alpha', this.world.camera3.alpha+Math.PI*2, 3);
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
              this.rotAround = this.arcRotation(this.world.camera3, 'alpha', this.world.camera3.alpha-Math.PI*2, 3);
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
                this.rotVertical = this.arcRotation(this.world.camera3, 'beta', 0, 2-this.world.camera3.beta/Math.PI);
              }
            } else {
              if ( ! this.camRadius ) {
                this.camRadius = this.arcRotation(this.world.camera3, 'radius', 0, 3);
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
                this.rotVertical = this.arcRotation(this.world.camera3, 'beta', Math.PI/2, 2-this.world.camera3.beta/Math.PI);
              }
            } else {
              if ( ! this.camRadius ) {
                this.camRadius = this.arcRotation(this.world.camera3, 'radius', 5, 3);
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
  handleMediaViewerKeys(kbInfo) {
    if (this.world.viewingMedia && this.disableMovement === true) {
      switch (kbInfo.event.key) {
        case "Escape":
          try {
            this.world.viewingMediaMesh.material.emissiveTexture.video.pause();
          } catch (error) {
            this.world.customizer.returnToStartingPosition();
          }
          break;
      }
    }
  }
  handleKeyboard(kbInfo) {
    if ( this.world.activeCameraType === '1p' ) {
      this.handleUniCamKeys(kbInfo);
    } else if ( this.world.activeCameraType === '3p' ) {
      this.handleArcCamKeys(kbInfo);
    }
    if (this.world.viewingMedia) {
      this.handleMediaViewerKeys(kbInfo);
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
    if ( this.world.activeCameraType != '3p' || (this.movingDirections == 0 && !this.movingToTarget)) {
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
    var distance = this.world.camera3.speed * delta;
    //console.log("speed: "+this.world.camera3.speed+" dist: "+distance+" time: "+delta);
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
      var angle = -1.5*Math.PI-this.world.camera3.alpha;
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
    if ( this.world.activeCameraType != '3p' || this.movingDirections > 0 ) {
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

  enableKeys() {
    this.world.camera1.keysDown = [83]; // S
    this.world.camera1.keysLeft = [65]; // A
    this.world.camera1.keysRight = [68]; // D
    this.world.camera1.keysUp = [87]; // W
    this.world.camera1.keysUpward = [32]; // space
    this.disableMovement = false;
  }

  disableKeys() {
    this.world.camera1.keysDown = [];
    this.world.camera1.keysLeft = [];
    this.world.camera1.keysRight = [];
    this.world.camera1.keysUp = [];
    this.world.camera1.keysUpward = [];
    this.disableMovement = true;
  }

}

export default Movement;