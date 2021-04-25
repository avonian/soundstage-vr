<template>
    <InvalidEvent v-if="invalidAccess"/>
    <IncompatibleDevice v-else-if="deviceType === 'mobile'"/>
    <WelcomeScreen v-else-if="!entered"
        :browser-supported="browserSupported"
        :graphics-options="graphicsOptions"
        :user-settings="userSettings"
        :audio-devices="audioDevices"
        :playback-devices="playbackDevices"
        :video-devices="videoDevices"
        @setUserSettings="setUserSettings($event)"
        @connect="apply"/>
    <!-- Main app start -->
    <div class="min-h-screen" v-else>
        <QuickStart v-if="showHelp"
                @continue="showHelp = false"/>
        <LocalCamera v-show="webcamEnabled === true && cameraMode !== null && cameraMode[0] === '1p' && videoDevices.length > 0"
                :showStageControls="showStageControls"
                @castSelf="castSelf"/>
        <SettingsPanel v-if="showSettings"
                :graphics-options="graphicsOptions"
                :audio-devices="audioDevices"
                :can-broadcast="canBroadcast"
                :playback-devices="playbackDevices"
                :video-devices="videoDevices"
                :initial-user-settings="userSettings"
                @setUserSettings="setUserSettings($event)"
                @requestComputerSound="requestComputerSound"
                @cancel="revertSettings"
                @save="saveSettings"/>
        <LoadingScreen/>
        <canvas id="renderCanvas" touch-action="none" :class="mouseIsDown ? 'cursor-none' : ''"></canvas>
        <StageControls v-show="showControls"
                :show-stage-controls="showStageControls"
                :active-video="activeVideo"
                :world="world"
                :videos="videos"
                :cube-textures="cubeTextures"
                :mood-sets="moodSets"
                :fog-settings="fogSettings"
                :showing-user-videos="showUserVideosPanel"
                @toggleUserVideos="showUserVideosPanel = !showUserVideosPanel"
                @activateVideo="activateVideo($event)"
                @playCameraAnimations="playCameraAnimations($event)"
                @changeMood="changeMood"
                @changeCubeTexture="changeCubeTexture"
                @changeFog="changeFog"/>
        <UserControls v-show="showControls"
                :debugging="debugging"
                :recording="recording"
                :user-settings="userSettings"
                :camera-mode="cameraMode"
                :video-devices="videoDevices"
                :webcam-enabled="webcamEnabled"
                :mic-enabled="micEnabled"
                :show-emoji-menu="showEmojiMenu"
                :show-instrumentation="showInstrumentation"
                :world="world"
                @showSettingsPanel="showSettings = true"
                @toggleDebug="debugOnOff"
                @startRecording="recordPerformance"
                @rotationOnOff="rotationOnOff"
                @cameraOnOff="cameraOnOff"
                @microphoneOnOff="microphoneOnOff"
                @cycleCamera="cycleCamera"
                @emojiMenuOnOff="emojiMenuOnOff"
                @focusCanvas="focusCanvas"/>
    </div>
    <div id="videos" class="flex flex-row" :class="!showUserVideosPanel ? 'hidden' : 'fixed bottom-0 overflow-x-auto'">
        <audio id='audioOutput' class="hidden" controls autoplay></audio>
    </div>
    <!-- Main app end -->
</template>

<script>
  import Nightclub from '../world.js'
  import InvalidEvent from './components/InvalidEvent';
  import QuickStart from './components/QuickStart';
  import IncompatibleDevice from './components/IncompatibleDevice'
  import LocalCamera from './components/LocalCamera'
  import SettingsPanel from './components/SettingsPanel'
  import LoadingScreen from './components/LoadingScreen'
  import StageControls from './components/StageControls'
  import UserControls from './components/UserControls'
  import WelcomeScreen from './components/WelcomeScreen'
  import browser from 'browser-detect';

  // variables required to use babylon.js:
  var canvas
  var engine

  // implementation specific variables
  var scene // only used for debug button
  // vrspace specific variables:
  var world

  // soundstage specific variables
  var userName = 'N/A'
  var camDevice = null
  var micDevice = null

  // world variables
  var worldName = 'NightClub'
  var fps = 5

  let userSettings

  // Default user settings
  var defaultUserSettings = {
    graphicsQuality: 'medium',
    enableStereo: false,
    stereoGainBoost: 0,
    enableWebcamFeeds: true,
    enableVisuals: true,
    selectedAudioDeviceId: null,
    selectedPlaybackDeviceId: null,
    selectedVideoDeviceId: null,
    trackRotation: true,
    schema: 0.1,
    useComputerSound: false
  }

  const urlParams = new URLSearchParams(window.location.search)

  export default {
    name: 'App',
    components: {
      InvalidEvent,
      QuickStart,
      IncompatibleDevice,
      LocalCamera,
      SettingsPanel,
      LoadingScreen,
      StageControls,
      UserControls,
      WelcomeScreen
    },
    data () {
      return {
        browserSupported: true,
        invalidAccess: false,
        eventConfig: false,
        audioDevices: [],
        playbackDevices: [],
        videoDevices: [],
        entered: false,
        cameraMode: null,
        webcamEnabled: false,
        micEnabled: false,
        canBroadcast: false,
        debugging: urlParams.get('debug'),
        showStageControls: false,
        freeCamSpeed: 0.1,
        freeCamSensibility: 8000,
        recording: false,
        mediaRecorder: false,
        cameraModes: [
          ['1p', '1st Person'],
          ['3p', '3rd Person']
        ],
        showEmojiMenu: false,
        showSettings: false,
        deviceType: 'desktop',
        mouseIsDown: false,
        showHelp: false,
        videos: null,
        activeVideo: 0,
        world: null,
        userSettings: null,
        cachedUserSettings: null,
        alreadyVisited: false,
        castingUserId: '',
        castingUser: false,
        showUserVideosPanel: false,
        cubeTextures: [],
        moodSets: [],
        fogSettings: [],
        showInstrumentation: false,
        graphicsOptions: [
          {
            label: "Very Low",
            value: "very-low"
          },
          {
            label: "Low",
            value: "low"
          },
          {
            label: "Medium",
            value: "medium"
          },
          {
            label: "High",
            value: "high"
          }
        ]
      }
    },
    computed: {
      showControls () {
        if (this.cameraMode) {
          return this.cameraMode[0] !== 'free' || !this.mouseIsDown
        } else {
          return true
        }
      }
    },
    mounted: async function () {

      /* Check browser */
      if(browser().name === 'safari') {
        this.browserSupported = false;
        return;
      }

      /* Set event configuration */
      await this.initConfig();
      if(!this.eventConfig) {
        return;
      }
      this.canBroadcast = this.eventConfig.permissions['broadcast'] === true;
      if (this.eventConfig.permissions['stage_controls']) {
        this.showStageControls = true;
        this.cameraModes.push(['free', 'Free Cam'])
      }
      this.videos = this.eventConfig.videos;

      this.deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'other'
      if (this.deviceType === 'mobile') {
        return
      }

      if(!this.eventConfig) {
        return;
      }
      /* Preload default video only (just so it's ready on scene start) */
      this.preloadVideos(this.eventConfig.videos, true)

      /* Retrieve values from local storage */
      if(process.env.VUE_APP_SKIP_WELCOME === 'true') {
        this.alreadyVisited = true;
      } else {
        this.alreadyVisited = await localStorage.getItem('alreadyVisited')
      }

      userSettings = await localStorage.getItem('userSettings')
      userSettings = userSettings ? JSON.parse(userSettings) : defaultUserSettings
      for (var setting of Object.keys(defaultUserSettings)) {
        if (userSettings[setting] === undefined) {
          userSettings[setting] = defaultUserSettings[setting]
        }
      }
      /* Always start stereo flag false just in case */
      userSettings.enableStereo = false
      userSettings.useComputerSound = false
      userSettings.computerAudioStream = false
      this.userSettings = JSON.parse(JSON.stringify(userSettings))
      this.cachedUserSettings = JSON.parse(JSON.stringify(userSettings))

      /* Detects when devices are plugged/unplugged */
      if(process.env.VUE_APP_SKIP_WELCOME === 'true') {
        this.apply()
      } else {
        navigator.mediaDevices.ondevicechange = () => {
          this.pollForDevices()
        }
      }

      this.pollForDevices()
    },
    methods: {
      async initConfig() {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          this.eventConfig = JSON.parse(process.env.VUE_APP_DEMO_CONFIG);
          if(!this.eventConfig.videos) {
            this.eventConfig.videos = [{"url": "https://assets.soundstage.fm/vr/Default.mp4", "label": "Default"}];
          }
          return;
        }
        let jwt = document.cookie.indexOf("jwt") !== -1 ? document.cookie
          .split('; ')
          .find(row => row.startsWith('jwt='))
          .split('=')[1] : false;
        if(jwt) {
          let response = await fetch(`${process.env.VUE_APP_API_URL}/events/${urlParams.get('e')}/verify`, {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              'Accept': 'application/json',
              "Authorization": `Bearer ${jwt}`
            }
          });
          let data = await response.json();
          if(data.success) {
            this.eventConfig = data['event_config'];
            if(!this.eventConfig.videos) {
              this.eventConfig.videos = Videos;
            }
          } else {
            this.invalidAccess = true;
          }
        } else {
          this.invalidAccess = true;
        }
      },
      apply: async function () {
        if (!this.entered) {
          this.enterWorld()
          if (!this.alreadyVisited) {
            this.showHelp = true
            await localStorage.setItem('alreadyVisited', true)
            this.alreadyVisited = true
          }
        }
      },
      setUserSettings({ key, value }) {
        this.userSettings[key] = value;
      },
      preloadVideos: async (videos, loadDefault = false) => {

        function preloadVideo (video) {
          return new Promise((resolve, reject) => {

            var req = new XMLHttpRequest()
            req.open('GET', video.url, true)
            req.responseType = 'blob'

            req.onload = function () {
              // Onload is triggered even on 404
              // so we need to check the status code
              if (this.status === 200) {
                var videoBlob = this.response
                video.url = URL.createObjectURL(videoBlob) // IE10+
                resolve()
              }
            }
            req.onerror = function () {
              // Error
            }
            req.send()
          })
        }

        for (let video of videos) {
          if (loadDefault && video.label !== 'Default') {
            continue
          } else if (!loadDefault && video.label === 'Default') {
            continue
          }
          await preloadVideo(video)
        }
      },
      enterWorld: async function () {

        this.entered = true

        this.$nextTick(async () => {
          this.cameraMode = this.cameraModes[0]

          // variables required to use babylon.js:
          canvas = document.getElementById('renderCanvas') // Get the canvas element
          //engine = await new BABYLON.Engine(canvas, true) // Generate the BABYLON 3D engine
          engine = await new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
          })

          canvas.addEventListener('pointerdown', () => {
            this.mouseIsDown = true
          })

          canvas.addEventListener('pointerup', () => {
            this.mouseIsDown = false
          })

          // webcam/mic UI should be set up before 3D world, i.e. desired device ID has to be known
          this.world = world = await new Nightclub(this.eventConfig, this.userSettings);

          // Apply any settings adjustments from initial welcome screen
          this.saveSettings(true);

          world.userSettings = userSettings
          world.onProgress = (evt) => {
            if (evt.lengthComputable) {
              var loaded = evt.loaded / evt.total
              document.querySelector('#main-progress-bar').setAttribute('style', `width: ${loaded * 100}%`)
            }
          }
          world.afterLoad = () => {
            setTimeout(() => {
              document.querySelector('#progress-splash').remove()
            }, 2000)
          }
          // by default, World loads scene.gltf from current directory
          // specify other file here, like
          //world.file = 'Night_Club.glb'
          //world.baseUrl = 'location';
          world.init(engine, worldName, null, () => {

            world.cameraFree.speed = this.freeCamSpeed
            world.cameraFree.angularSensibility = this.freeCamSensibility

            this.webcamEnabled = userSettings.enableWebcamFeeds
            this.micEnabled = true

            // Check if they have permission to go backstage
            if(this.eventConfig.permissions['access_backstage']) {
              scene.getMeshByName('curtains').checkCollisions = false;
            }

            /* Cache user settings again */
            userSettings.selectedAudioDeviceId = this.userSettings.selectedAudioDeviceId
            userSettings.selectedVideoDeviceId = this.userSettings.selectedVideoDeviceId
            userSettings.selectedPlaybackDeviceId = this.userSettings.selectedPlaybackDeviceId
            this.userSettings = JSON.parse(JSON.stringify(userSettings))
            this.cachedUserSettings = JSON.parse(JSON.stringify(userSettings))
            localStorage.setItem('userSettings', JSON.stringify(this.userSettings))

            if (this.userSettings.enableWebcamFeeds) {
              world.startVideo(this.userSettings.selectedVideoDeviceId)
            } else {
              world.stopVideo()
            }
            world.startAudio(this.userSettings.selectedAudioDeviceId)
            world.loadEmojis((emojis) => {
              for (var i = 0; i < emojis.emojis.length; i++) {
                var emoji = emojis.emojis[i]

                var img = document.createElement('img')
                img.classList.add('cursor-pointer')
                img.setAttribute('name', emoji.name)
                img.src = `../assets/emojis/${emoji.name}.png`
                img.onclick = (e) => {
                  var name = e.target.name
                  emojis.play(name)
                  canvas.focus() // don't forget
                }

                document.getElementById('emojis').appendChild(img)
              }
            })

            world.initStageControls((config) => {
              this.moodSets = this.world.stageControls.moodSets;
              this.cubeTextures = this.world.stageControls.cubeTextures;
              this.fogSettings = this.world.stageControls.fogSettings;

              if(this.eventConfig['permissions']['stage_controls']) {
                this.world.startSavingState();
              }
            })

            world.connect(
              userName,
              fps,
              this.userSettings.selectedAudioDeviceId,
              this.userSettings.selectedPlaybackDeviceId,
              () => {
                /* Preload remaining videos */
                world.adjustGraphicsQuality(userSettings.graphicsQuality);
                this.preloadVideos(this.eventConfig.videos)
              }
            );

            if(this.debugging) {
              this.showInstrumentation = true;
              document.addEventListener('keydown', this.world.HDRControl.bind(world));
            }

          }).then((s) => {
            scene = s
            // Apply graphics quality settings from welcome screen
            world.showVideo(this.eventConfig.avatar ? this.eventConfig.avatar : "https://assets.soundstage.fm/vr/avatar_default.png") // initialize own avatar
            world.customize();
          })

          // Watch for browser/canvas resize events
          window.addEventListener('resize', function () {
            engine.resize()
          })
        })

      },
      changeMic: function (select) {
        console.log('Selected mic:' + select.selectedIndex + ': ' + select.value)
        if ('Off' === select.value) {
          world.stopAudio()
        } else {
          micDevice = select.value
          world.startAudio(select.value)
        }
        // make sure to move focus to canvas, or HTML UI keeps control of keyboard input
        canvas.focus()
      },
      revertSettings: async function () {
        userSettings = JSON.parse(JSON.stringify(this.cachedUserSettings))
        this.userSettings = JSON.parse(JSON.stringify(this.cachedUserSettings))
        this.showSettings = false
      },
      saveSettings: async function (saveOnly = false) {
        var needsRefresh = false
        var needsAudioRenegotiation = false

        if (this.cachedUserSettings.enableVisuals !== this.userSettings.enableVisuals) {
          needsRefresh = true
        }
        if (this.cachedUserSettings.enableWebcamFeeds !== this.userSettings.enableWebcamFeeds) {
          needsRefresh = true
        }
        if (this.cachedUserSettings.enableStereo !== this.userSettings.enableStereo) {
          needsAudioRenegotiation = true
        }
        if (this.cachedUserSettings.selectedAudioDeviceId !== this.userSettings.selectedAudioDeviceId) {
          needsAudioRenegotiation = true
        }
        if (this.cachedUserSettings.selectedPlaybackDeviceId !== this.userSettings.selectedPlaybackDeviceId) {
          needsAudioRenegotiation = true
        }
        if (this.cachedUserSettings.stereoGainBoost !== this.userSettings.stereoGainBoost) {
          needsAudioRenegotiation = true
        }
        if (this.cachedUserSettings.selectedVideoDeviceId !== this.userSettings.selectedVideoDeviceId) {
          needsRefresh = true
        }
        if (this.cachedUserSettings.useComputerSound !== this.userSettings.useComputerSound) {
          needsAudioRenegotiation = true
          if(this.userSettings.useComputerSound === false) {
            this.userSettings.computerAudioStream = false;
          }
        }

        if (world.scene && needsRefresh) {
          var confirmed = confirm('To apply these changes we need to restart the application, do you want to continue?')
          if (confirmed) {
            /* Always save enableStereo false to localStorage */
            await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false } }))
            window.location.reload()
          }
        } else {
          /* Always save enableStereo false and useComputerSound false to localStorage */
          await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false, computerAudioStream: false, useComputerSound: false } }))
          console.log('saved', await localStorage.getItem('userSettings'))
          userSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.cachedUserSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.world.userSettings = this.userSettings;

          if(saveOnly === true) {
            return;
          }

          /* Reconnect to hifi after everythings settled */
          if (needsAudioRenegotiation) {
            world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.computerAudioStream, this.userSettings.selectedPlaybackDeviceId)
          }

          this.showSettings = false;
          world.adjustGraphicsQuality(this.userSettings.graphicsQuality);
        }
      },
      cycleCamera: function () {
        var nextCameraIndex = (this.cameraModes.findIndex((c) => c[0] === this.cameraMode[0])) + 1
        if (nextCameraIndex >= this.cameraModes.length) {
          nextCameraIndex = 0
        }
        this.cameraMode = this.cameraModes[nextCameraIndex]
        console.log('Activating camera ' + this.cameraMode[1])
        world.activateCamera(this.cameraMode[0])
        // make sure to move focus to canvas, or HTML UI keeps control of keyboard input
        canvas.focus()
      },
      debugOnOff: function () {
        console.log('Debug: ' + scene.debugLayer.isVisible())
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide()
        } else {
          scene.debugLayer.show()
        }
      },
      enter: function () {
        userName = document.getElementById('userName').value
        // make sure to move focus to canvas, or HTML UI keeps control of keyboard input
        canvas.focus()
      },
      emojiMenuOnOff: function () {
        this.showEmojiMenu = this.showEmojiMenu === false
        canvas.focus()
      },
      focusCanvas: function () {
        canvas.focus()
      },
      microphoneOnOff: async function () {
        // make sure to move focus to canvas, or HTML UI keeps control of keyboard input
        canvas.focus()
        if (this.micEnabled) {
          await world.hifi.setInputAudioMuted(true)
          this.micEnabled = false
        } else {
          // await world.hifi.setInputAudioMuted(false);
          world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.computerAudioStream ,this.userSettings.selectedPlaybackDeviceId)
          this.micEnabled = true
        }
      },
      cameraOnOff: function () {
        // make sure to move focus to canvas, or HTML UI keeps control of keyboard input
        canvas.focus()
        if (this.webcamEnabled) {
          window.roomClient.disableWebcam()
          world.stopVideo()
          this.webcamEnabled = false
        } else {
          window.roomClient.enableWebcam()
          world.startVideo(this.userSettings.selectedVideoDeviceId)
          this.webcamEnabled = true
        }
      },
      rotationOnOff: function () {
        this.userSettings.trackRotation = !this.userSettings.trackRotation
        this.cachedUserSettings = this.userSettings
        world.trackAvatarRotations(this.userSettings.trackRotation)
      },
      async requestComputerSound() {
        if(!document.querySelector('#useComputerSound').checked) {
          return;
        }
        try {
          this.userSettings.computerAudioStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              sampleRate: 44100
            }
          });
          this.userSettings.useComputerSound = true;
          this.userSettings.enableStereo = true;
        } catch (err) {
          this.userSettings.computerAudioStream = false
          this.userSettings.useComputerSound = false;
        }
      },
      pollForDevices: async function () {
          let audioDevices = []
          let playbackDevices = []
          let videoDevices = []

          try {
            await navigator.mediaDevices.getUserMedia({
              audio: true
            });
          } catch (err) {
            this.audioDevices = []
          }
          try {
            await navigator.mediaDevices.getUserMedia({
              video: true
            });
          } catch (err) {
            this.audioDevices = []
          }

          var devices = await navigator.mediaDevices.enumerateDevices()
          for (var idx = 0; idx < devices.length; ++idx) {
            if (devices[idx].kind === 'videoinput') {
              videoDevices.push(devices[idx])
            } else if (devices[idx].kind === 'audioinput') {
              audioDevices.push(devices[idx])
            } else if (devices[idx].kind === 'audiooutput') {
              playbackDevices.push(devices[idx])
            }
          }
          this.audioDevices = audioDevices
          this.playbackDevices = playbackDevices
          this.videoDevices = videoDevices
          if (!this.userSettings.selectedAudioDeviceId && this.audioDevices.length > 0) {
            this.userSettings.selectedAudioDeviceId = this.audioDevices[0].deviceId
          }
          if (!this.userSettings.selectedPlaybackDeviceId && this.playbackDevices.length > 0) {
            this.userSettings.selectedPlaybackDeviceId = this.playbackDevices[0].deviceId
          }
          if (!this.userSettings.selectedVideoDeviceId && this.videoDevices.length > 0) {
            this.userSettings.selectedVideoDeviceId = this.videoDevices[0].deviceId
          }
      },
      /* For audio diagnostics purposes */
      recordPerformance (seconds) {

        if (!this.recording) {

          if (document.querySelector('#recorded-audio')) {
            document.querySelector('#recorded-audio').remove()
          }

          this.recording = true
        } else {
          this.mediaRecorder.stop()
          this.recording = false
        }

        var chunks = []
        this.mediaRecorder = new MediaRecorder(window.audioStream)

        this.mediaRecorder.start()

        this.mediaRecorder.onstop = function () {
          var clipContainer = document.createElement('article')
          clipContainer.id = 'recorded-audio'

          clipContainer.classList.add('clip')
          var audio = document.createElement('audio')
          audio.setAttribute('controls', '')
          audio.setAttribute('class', 'absolute bottom-32 left-12')

          clipContainer.appendChild(audio)
          document.body.appendChild(clipContainer)

          audio.controls = true
          var blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' })
          chunks = []
          var audioURL = URL.createObjectURL(blob)
          audio.src = audioURL
        }

        this.mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data)
        }
      },
      activateVideo (videoIndex) {
        this.activeVideo = videoIndex
        this.castingUser = false
        this.castingUserId = ''
        this.world.stageControls.play(videoIndex)
      },
      castSelf () {
        this.castUser(document.querySelector('#localVideo').getAttribute('peerid'))
      },
      castUser (userId) {
        if (userId !== '') {
          this.activeVideo = null
          world.stageControls.cast(`${userId}`)
        }
      },
      changeMood () {
        let stageEvent = { action: 'changeMood', moodSet: document.querySelector('#moodSet').value };
        world.stageControls.executeAndSend(stageEvent);
      },
      changeCubeTexture () {
        document.querySelector('#moodSet').selectedIndex = 0;
        let stageEvent = { action: 'changeCubeTexture', cubeTexture: document.querySelector('#cubeTexture').value };
        world.stageControls.executeAndSend(stageEvent);
      },
      changeFog () {
        let stageEvent = { action: 'changeFog', fogSetting: document.querySelector('#fogSetting').value };
        world.stageControls.executeAndSend(stageEvent);
      },
      playCameraAnimations(i) {
        this.cameraMode = this.cameraModes[2];
        world.activateCamera('free');
        world.cineCam.play(i);
      }
    }
  }
</script>

<style>
    .splash {
        width: 100%;
        height: 100vh;
        position: absolute;
        background-size: cover;
        background-image: url('../assets/images/splash.jpg');
        opacity: 0.1;
        z-index: -1;
    }

</style>