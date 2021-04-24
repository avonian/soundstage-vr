export class CinemaCamera {
  constructor (camera, scene, startDelay = 200) {
    this.camera = camera;
    this.scene = scene;
    this.startDelay = startDelay;
    this.animations = [];
    this.activeAnimation = null;
    this.nextAnimationTimeout;

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

    this.animations['Insert'] = {
      0: cameraLocations.entrance,
      1000: cameraLocations.dj_from_the_bar,
      1800: {"position": {_isDirty: true, _x: 2.146117235439716, _y: 1.1943042196913987, _z: 2.5539031191146067}, "rotation": {_isDirty: true, _x: 0.03145491368223644, _y: -0.002670104918247234, _z: 0}},
    };
    this.animations['Delete'] = {
      0: {"position": {_isDirty: true, _x: 2.146117235439716, _y: 1.1943042196913987, _z: 2.5539031191146067}, "rotation": {_isDirty: true, _x: 0.03145491368223644, _y: -0.002670104918247234, _z: 0}},
      1200: {"position": {_isDirty: true, _x: 2.168240283987669, _y: 4.97209498652936, _z: -7.88401117568601}, "rotation": {_isDirty: true, _x: 0.2214687683273271, _y: 0.014055259785063744, _z: 0} },
    }

    this.autoLoopSequence = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  }
  convertToVector3(coords) {
    return new BABYLON.Vector3(coords['_x'], coords['_y'], coords['_z']);
  }
  buildAnimationFrames(animation) {
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
    return Object.keys(animation);
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
  stopAnimationChain(event) {
    if(event){
      if(event.key !== "Escape") {
        return;
      } else {
        this.showHideUI(false)
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
  play(animationNumber, playAll) {
    this.stopAnimationChain();

    this.camera.animations = [];
    let frames = this.buildAnimationFrames(this.animations[animationNumber]);

    let callback = false;

    if(playAll) {
      callback = () => {
        this.nextAnimationTimeout = setTimeout(() => {
          var autoLoopIndex = this.autoLoopSequence.indexOf(animationNumber);
          var nextAnimation = this.autoLoopSequence[autoLoopIndex + 1];
          if(nextAnimation) {
            this.play(nextAnimation, true)
          } else {
            this.play(this.autoLoopSequence[0], true)
          }
        }, 10000)
      }
    }

    this.activeAnimation = this.scene.beginAnimation(this.camera, 0, frames[frames.length - 1] + this.startDelay, false, 1, callback);
    this.showHideUI();
    document.removeEventListener('keydown', this.stopAnimationChain.bind(this))
    document.addEventListener('keydown', this.stopAnimationChain.bind(this));
  }
  showHideUI(hide = true) {
    var controls = document.body.querySelectorAll(".ui-hide");
    for(var el of controls) {
      if(hide) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    }
  }
}

export default CinemaCamera;