<template>
    <Modal v-if="modal"
           :title="modal.title"
           :body="modal.body"
           :confirmCallback="modal.confirmCallback"
           :cancelCallback="modal.cancelCallback"
           :size="modal.size"
           @close="hideModal"
    />
    <ModalIframe v-if="modalIframe"
        :url="modalIframe.url"
        :close-label="modalIframe.closeLabel"
        :withOverlay="modalIframe.withOverlay"
        :size="modalIframe.size"
        @close="modalIframe = false"
    />
    <InvalidEvent v-if="invalidAccess"/>
    <Banned v-else-if="userBanned"/>
    <IncompatibleDevice v-else-if="deviceType === 'mobile'"/>
    <WelcomeScreen v-else-if="!entered && !skipWelcome"
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
        <Showcase/>
        <QuickStart v-if="showHelp"
                @continue="showHelp = false"/>
        <LocalCamera v-show="webcamEnabled === true && cameraMode !== null && cameraMode[0] === '1p' && videoDevices.length > 0"
                :enableStageControls="enableStageControls"
        />
        <AvatarMenu v-if="avatarMenuClientId"
            :world="world"
            :client-id="avatarMenuClientId"
            :follows="spaceConfig.follows"
            :mutelist="spaceConfig.mutelist"
            :canModerate="spaceConfig.permissions.moderator"
            @close="avatarMenuClientId = false"
            @followUser="followUser($event)"
            @muteUser="muteUser($event)"
            @blockUser="blockUser($event)"
            @adminToggleMicrophone="adminToggleMicrophone($event)"
            @adminOpenChatbox="adminOpenChatbox($event)"
            @adminToggleWebcam="adminToggleWebcam($event)"
            @adminKickUser="adminKickUser($event)"
            @adminBanUser="adminBanUser($event)"
        />
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
        <StageControls
                v-if="enableStageControls"
                v-show="stageControlsVisible"
                :active-video="activeVideo"
                :world="world"
                :videos="videos"
                :cube-textures="cubeTextures"
                :mood-sets="moodSets"
                :fogSettingConfigs="fogSettingConfigs"
                :showing-user-videos="showUserVideosPanel"
                :DJSpotLightIntensity="DJSpotLightIntensity"
                :tunnelLightsOn="tunnelLightsOn"
                :gridFloorOn="gridFloorOn"
                :moodParticlesOn="moodParticlesOn"
                :space-config="spaceConfig"
                :attenuation="attenuation"
                @toggleUserVideos="showUserVideosPanel = !showUserVideosPanel"
                @playVideo="(videoId) => world.stageControls.emitPlayVideo(videoId)"
                @playCameraAnimations="playCameraAnimations($event)"
                @changeMood="changeMood"
                @changeCubeTexture="changeCubeTexture"
                @changeFog="changeFog"
                @changeDJSpotLightIntensity="changeDJSpotLightIntensity($event)"
                @toggleTunnelLights="toggleTunnelLights"
                @toggleGridFloor="toggleGridFloor"
                @toggleMoodParticles="toggleMoodParticles"
                @applyAcoustics="applyAcoustics($event)"
                @resetWalls="world.stageControls.emitResetWalls()"
                @rescaleSkybox="(scale) => world.stageControls.emitRescaleSkybox(scale)"
                @lockSpace="lockSpace"
                @toggleDisplayConfigTarget="(display) => world.displayConfig[display].target = world.displayConfig[display].target !== true"
                @teleportUsers="teleportUsers($event)"
                />
        <Chat class="absolute top-12 left-12"
               :world="world"
               :class="showStageControls ? 'top-64 mt-4' : 'top-12'"
               :chat-log="chatLog"
               v-show="hideDuringFreecam"
        />
        <UserControls v-show="hideDuringFreecam"
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
                :enable-stereo="userSettings.enableStereo"
                :enable-stage-controls="enableStageControls"
                :use-computer-sound="userSettings.useComputerSound"
                :sending-music="userSettings.sendingMusic"
                @toggleSendingMusic="toggleSendingMusic($event)"
                @setVolume="setVolume($event)"
                @showSettingsPanel="showSettings = true"
                @toggleDebug="debugOnOff"
                @startRecording="recordPerformance"
                @rotationOnOff="rotationOnOff"
                @cameraOnOff="cameraOnOff"
                @microphoneOnOff="microphoneOnOff"
                @cycleCamera="cycleCamera"
                @emojiMenuOnOff="emojiMenuOnOff"
                @focusCanvas="focusCanvas"
                @toggleStageControls="showStageControls = showStageControls === false"
                />
    </div>
    <div id="videos" :class="!showUserVideosPanel ? 'hidden' : 'flex fixed bottom-0 overflow-x-auto w-full overflow-x-auto'">
        <audio id='audioOutput' class="hidden" controls autoplay></audio>
    </div>
    <!-- Main app end -->
</template>

<script>
  import Worlds from '../lib/worlds'
  import InvalidEvent from './components/InvalidEvent';
  import Banned from './components/Banned';
  import QuickStart from './components/QuickStart';
  import IncompatibleDevice from './components/IncompatibleDevice'
  import LocalCamera from './components/LocalCamera'
  import SettingsPanel from './components/SettingsPanel'
  import LoadingScreen from './components/LoadingScreen'
  import StageControls from './components/StageControls'
  import UserControls from './components/UserControls'
  import WelcomeScreen from './components/WelcomeScreen'
  import AvatarMenu from './components/AvatarMenu'
  import Modal from './components/Modal'
  import ModalIframe from './components/ModalIframe'
  import Showcase from './components/Showcase'
  import Chat from './components/Chat'

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
    useComputerSound: false,
    includeAudioInputInMix: false,
    sendingMusic: false,
    voiceVolume: 50,
    musicVolume: 50,
    soundOnJoin: false
  }

  const urlParams = new URLSearchParams(window.location.search)

  export default {
    name: 'App',
    components: {
      InvalidEvent,
      Banned,
      QuickStart,
      IncompatibleDevice,
      LocalCamera,
      SettingsPanel,
      LoadingScreen,
      StageControls,
      UserControls,
      WelcomeScreen,
      AvatarMenu,
      Showcase,
      Modal,
      ModalIframe,
      Chat
    },
    data () {
      return {
        jwt: '',
        browserSupported: true,
        invalidAccess: false,
        spaceConfig: false,
        audioDevices: [],
        playbackDevices: [],
        videoDevices: [],
        entered: false,
        cameraMode: null,
        webcamEnabled: false,
        micEnabled: false,
        canBroadcast: false,
        debugging: urlParams.get('debug'),
        enableStageControls: false,
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
        world: null,
        userSettings: null,
        cachedUserSettings: null,
        alreadyVisited: false,
        showUserVideosPanel: false,
        cubeTextures: [],
        moodSets: [],
        fogSettingConfigs: [],
        DJSpotLightIntensity: 0,
        tunnelLightsOn: false,
        gridFloorOn: false,
        moodParticlesOn: false,
        showInstrumentation: false,
        avatarMenuClientId: false,
        userKicked: window.location.href.indexOf("kicked") !== -1,
        userBanned: window.location.href.indexOf("banned") !== -1,
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
          },
          {
            label: "Ultra-High",
            value: "ultra-high"
          }
        ],
        modal: false,
        modalIframe: false,
        app_url: process.env.VUE_APP_API_URL,
        attenuation: '',
        chatLog: [],
        skipWelcome: false
      }
    },
    computed: {
      hideDuringFreecam () {
        if (this.cameraMode) {
          return this.cameraMode[0] !== 'free' || !this.mouseIsDown
        } else {
          return true
        }
      },
      stageControlsVisible () {
        return this.showStageControls && this.hideDuringFreecam;
      }
    },
    mounted: async function () {

      this.skipWelcome = await sessionStorage.getItem('skipWelcome');

      if(this.userKicked) {
        this.showModal("You've been removed from the space.", "<p class='mb-4'>A moderator has deemed it necessary to temporarily remove you from this event.</p><p class='mb-4'>You are allowed to rejoin, but we ask that you please be mindful of your behavior moving forward.</p>");
        window.history.replaceState({},window.document.title,window.location.href.replace("&kicked","").replace("?kicked",""));
      }

      if(this.userBanned) {
        window.history.replaceState({},window.document.title,window.location.href.replace("&banned","").replace("?banned",""));
        return;
      }

      this.jwt = document.cookie.indexOf("jwt") !== -1 ? document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1] : false;

      /* Check browser */
      if(browser().name === 'safari') {
        this.browserSupported = false;
        return;
      }

      /* Set event configuration */
      await this.initConfig();
      if(!this.spaceConfig) {
        return;
      }

      this.canBroadcast = this.spaceConfig.permissions['broadcast'] === true;
      if (this.spaceConfig.permissions['stage_controls']) {
        this.enableStageControls = true;
      }
      if(this.spaceConfig.permissions['stage_controls'] || this.spaceConfig.role === 'artist') {
        this.cameraModes.push(['free', 'Free Cam'])
      }
      this.videos = this.spaceConfig.videos;

      this.deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'other'
      if (this.deviceType === 'mobile') {
        return
      }

      if(!this.spaceConfig) {
        return;
      }

      /* Preload default video only (just so it's ready on scene start) */
      this.preloadVideos(this.spaceConfig.videos, true)

      /* Retrieve values from local storage */
      if(process.env.VUE_APP_SKIP_WELCOME === 'true' || this.skipWelcome) {
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
      userSettings.includeAudioInputInMix = false
      userSettings.computerAudioStream = false
      userSettings.soundOnJoin = false
      this.userSettings = JSON.parse(JSON.stringify(userSettings))
      this.cachedUserSettings = JSON.parse(JSON.stringify(userSettings))

      /* Detects when devices are plugged/unplugged */
      if(process.env.VUE_APP_SKIP_WELCOME === 'true' || this.skipWelcome) {
        this.apply()
      } else {
        navigator.mediaDevices.ondevicechange = () => {
          this.pollForDevices()
        }
      }

      this.skipWelcome = false;
      await sessionStorage.removeItem('skipWelcome');

      this.pollForDevices()
    },
    methods: {
      async initConfig() {
        var baseConfig = require('../configs/_config.js').default;
        baseConfig = {...baseConfig, ...require(`../configs/_config.${baseConfig.world.replace(/([A-Z])/g, "-$1").substring(1).toLowerCase()}`).default}
        if(process.env.VUE_APP_DEMO_CONFIG) {
          var customConfig = require(`../configs/${process.env.VUE_APP_DEMO_CONFIG}`).default;
          this.spaceConfig = {...baseConfig, ...customConfig};
          this.spaceConfig.highFidelity.token = process.env.VUE_APP_HIGH_FIDELITY_TOKEN;
          this.spaceConfig.highFidelity.spaceId = process.env.VUE_APP_HIGH_FIDELITY_SPACE_ID;
          return;
        }
        if(this.jwt) {
          let response = await fetch(`${process.env.VUE_APP_API_URL}/spaces/${urlParams.get('s')}/verify`, {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              'Accept': 'application/json',
              "Authorization": `Bearer ${this.jwt}`
            }
          });
          let data = await response.json();
          if(data.success) {
            this.spaceConfig = data['space_config'];
            if(this.spaceConfig.send_back) {
              window.history.back();
            }
            if(!this.spaceConfig.videos) {
              this.spaceConfig.videos = baseConfig.videos;
            }
          } else {
            this.invalidAccess = true;
          }
        } else {
          this.invalidAccess = true;
        }
      },
      apply: async function () {
        if (this.entered) {
          return;
        }

        var enterCallback = async () => {
          this.enterWorld()
          if (!this.alreadyVisited) {
            this.showHelp = true
            await localStorage.setItem('alreadyVisited', true)
            this.alreadyVisited = true
          }
        }

        if(this.spaceConfig.warnRecording) {
          let confirmCallback = () => {
            this.modal = false;
            enterCallback();
          }
          let cancelCallback = () => {
            this.modal = false;
          }
          this.showModal(
            "Important notice - you may appear in recordings of this event.",
            `<p class='mb-4'>Today's event will be broadcast in an internet live stream and images will be recorded for use in future promotional materials for SoundStage.</p><p class='mb-4'>By accessing this event you accept that your video and/or audio feeds may be captured and used by SoundStage for the aforementioned purposes.</p><p class='mb-4'>Although it is not our intention to record you specifically, it is possible that you might appear in recordings as any other audience member.</p><p class='mb-4'>Please note that even after connecting, you still have the ability to turn off your webcam and/or microphone to avoid appearing in these recordings.</p><p class='mb-4'>If this is not agreeable, please <a href="${this.app_url}/contact-us" class="text-magenta" tabindex="-1">contact us</a> and we will be happy to issue a refund for your ticket.</p><p class='mb-4'>Would you like to continue?</p>`,
            confirmCallback,
            cancelCallback,
            'sm:max-w-xl'
          );
        } else {
          enterCallback();
        }

      },
      async setVolume({ key, value }) {
        this.userSettings[key + 'Volume'] = value;
        world.userSettings[key + 'Volume'] = value;
        this.saveSettings(true);
        for(let peer of Object.keys(world.hifi.peers)) {
          world.hifi.updatePeerVolume(world.hifi.peers[peer])
        }
      },
      setUserSettings({ key, value }) {
        this.userSettings[key] = value;
      },
      toggleSendingMusic(value) {
        this.userSettings['sendingMusic'] = value;
        world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.computerAudioStream, this.userSettings.selectedPlaybackDeviceId);
        document.getElementById('audioOutput').volume = value === false ? 1 : 0;
        console.log('setting to ', document.getElementById('audioOutput').volume)
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

        if(process.env.NODE_ENV === 'production') {
          window.dataLayer = window.dataLayer || [];
          var spaceConfig = this.spaceConfig;
          function gtag () {
            dataLayer.push(arguments);
          }
          gtag('js', new Date());
          gtag('config', 'UA-144046919-1');
        }

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

          // construct desired world
          this.world = world = await new Worlds[this.spaceConfig.world](this.spaceConfig, this.userSettings);

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
              canvas.setAttribute('tabindex', '-1')
              canvas.focus()
              world.initAfterLoad();
            }, 2000)
          }
          // by default, World loads scene.gltf from current directory
          // specify other file here, like
          //world.file = 'Night_Club.glb'
          //world.baseUrl = 'location';
          world.init(engine, this.spaceConfig.space_slug, null, () => {

            world.cameraFree.speed = this.freeCamSpeed
            world.cameraFree.angularSensibility = this.freeCamSensibility

            this.webcamEnabled = userSettings.enableWebcamFeeds
            this.micEnabled = true

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
              this.fogSettingConfigs = this.world.stageControls.fogSettingConfigs;

              world.adjustGraphicsQuality(this.userSettings.graphicsQuality);
              if(this.world.DJSpotLight) {
                this.DJSpotLightIntensity = this.world.DJSpotLight.intensity;
              }

              if(this.spaceConfig['permissions']['stage_controls']) {
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
                this.preloadVideos(this.spaceConfig.videos)
              }
            );

            if(this.debugging) {
              this.showInstrumentation = true;
              document.addEventListener('keydown', this.world.HDRControl.bind(world));
            }

          }).then((s) => {
            scene = s
            // Apply graphics quality settings from welcome screen
            world.showVideo(this.spaceConfig.avatar ? this.spaceConfig.avatar : "https://assets.soundstage.fm/vr/avatar_default.png") // initialize own avatar
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
          if(this.userSettings.enableStereo === false) {
            this.userSettings.sendingMusic = false;
          }
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
        if (this.cachedUserSettings.includeAudioInputInMix !== this.userSettings.includeAudioInputInMix) {
          needsAudioRenegotiation = true
        }

        if (world.scene && needsRefresh) {
          var confirmed = confirm('To apply these changes we need to restart the application, do you want to continue?')
          if (confirmed) {
            /* Always save enableStereo false to localStorage */
            await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false } }))
            window.location.reload()
          }
        } else {
          /* Always save broadcasting related settings as false localStorage */
          await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false, computerAudioStream: false, useComputerSound: false, includeAudioInputInMix: false } }))
          console.log('saved', await localStorage.getItem('userSettings'))
          userSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.cachedUserSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.world.userSettings = this.userSettings;

          if(saveOnly === true) {
            return;
          }

          /* Reconnect to hifi after everythings settled */
          if (needsAudioRenegotiation) {
            world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.computerAudioStream, this.userSettings.selectedPlaybackDeviceId, !this.micEnabled)
          }

          this.showSettings = false;
          world.adjustGraphicsQuality(this.userSettings.graphicsQuality, () => this.world.applyState());
        }
      },
      cycleCamera: function () {
        var nextCameraIndex = (this.cameraModes.findIndex((c) => c[0] === this.cameraMode[0])) + 1
        if (nextCameraIndex >= this.cameraModes.length) {
          nextCameraIndex = 0
        }
        // If switching out of free cam unmute microphone and untoggle billboard mode
        if(this.cameraMode[1] === "Free Cam" && !this.micEnabled) {
          this.microphoneOnOff();
        }
        if(this.cameraMode[1] === "Free Cam" && !this.userSettings.trackRotation) {
          this.rotationOnOff();
        }
        this.cameraMode = this.cameraModes[nextCameraIndex]
        console.log('Activating camera ' + this.cameraMode[1])
        // If switching to free cam mute microphone and toggle billboard mode
        if(this.cameraMode[1] === "Free Cam" && this.micEnabled) {
          this.microphoneOnOff();
        }
        if(this.cameraMode[1] === "Free Cam" && this.userSettings.trackRotation) {
          this.rotationOnOff();
        }
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
          this.userSettings.includeAudioInputInMix = true;
          this.userSettings.enableStereo = true;
          this.userSettings.sendingMusic = false;
        } catch (err) {
          this.userSettings.computerAudioStream = false
          this.userSettings.useComputerSound = false;
          this.userSettings.includeAudioInputInMix = false;
          this.userSettings.sendingMusic = false;
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
      changeDJSpotLightIntensity (value) {
        this.DJSpotLightIntensity = value;
        let stageEvent = { action: 'changeDJSpotLightIntensity', intensity: value };
        world.stageControls.executeAndSend(stageEvent);
      },
      toggleTunnelLights () {
        this.tunnelLightsOn = this.tunnelLightsOn !== true;
        let stageEvent = { action: 'toggleTunnelLights', value: this.tunnelLightsOn };
        world.stageControls.executeAndSend(stageEvent);
      },
      toggleGridFloor () {
        this.gridFloorOn = this.gridFloorOn !== true;
        let stageEvent = { action: 'toggleGridFloor', value: this.gridFloorOn, transitionInterval: 100 };
        world.stageControls.executeAndSend(stageEvent);
      },
      toggleMoodParticles () {
        this.moodParticlesOn = this.moodParticlesOn !== true;
        let stageEvent = { action: 'toggleMoodParticles', value: this.moodParticlesOn };
        world.stageControls.executeAndSend(stageEvent);
      },
      playCameraAnimations(i) {
        this.cameraMode = this.cameraModes[2];
        world.activateCamera('free');
        if(this.micEnabled) {
          this.microphoneOnOff();
        }
        if(this.userSettings.trackRotation) {
          this.rotationOnOff();
        }
        world.cineCam.play(i);
      },
      async followUser({ user, value }) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }
        let response = await fetch(`${process.env.VUE_APP_API_URL}/profile/follow`, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            'Accept': 'application/json',
            "Authorization": `Bearer ${this.jwt}`
          },
          'method': 'POST',
          'body': JSON.stringify({
            target_user: user,
            follow: value
          }),
        });
        let data = await response.json();
        this.spaceConfig.follows = data.follows;
      },
      async muteUser({ user, value }) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }
        let response = await fetch(`${process.env.VUE_APP_API_URL}/profile/mute`, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            'Accept': 'application/json',
            "Authorization": `Bearer ${this.jwt}`
          },
          'method': 'POST',
          'body': JSON.stringify({
            target_user: user,
            mute: value
          }),
        });
        let data = await response.json();
        this.spaceConfig.mutelist = data.mutelist;
        for (let hashedVisitID of Object.keys(world.hifi.peers)) {
          let hiFiPeer = world.hifi.peers[hashedVisitID];
          if (parseInt(hiFiPeer.providedUserID) === user) {
            world.hifi.updatePeerVolume(hiFiPeer)
          }
        }
      },
      async blockUser(user) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }
        let clientId = this.avatarMenuClientId;
        this.avatarMenuClientId = false;

        let confirmCallback = async () => {
          let response = await fetch(`${process.env.VUE_APP_API_URL}/profile/block`, {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              'Accept': 'application/json',
              "Authorization": `Bearer ${this.jwt}`
            },
            'method': 'POST',
            'body': JSON.stringify({
              target_user: user,
              block: true
            }),
          });
          let data = await response.json();
          this.spaceConfig.blocklist = data.blocklist;

          // Mute user
          for (let hashedVisitID of Object.keys(world.hifi.peers)) {
            let hiFiPeer = world.hifi.peers[hashedVisitID];
            if (parseInt(hiFiPeer.providedUserID) === user) {
              world.hifi.updatePeerVolume(hiFiPeer)
            }
          }
          // Dispose avatar
          let VRSpaceClientID = Array.from(world.worldManager.VRSPACE.scene).find(client => client[1].properties.soundStageUserId === user)[0];
          let holoAvatar = world.worldManager.VRSPACE.scene.get(VRSpaceClientID).video;
          holoAvatar.dispose();
          this.avatarMenuClientId = false;
          setTimeout(() => {
            this.showModal("The user has been blocked.", "<p class='mb-4'>To undo this action visit your SoundStage profile area.</p>")
          }, 300);
        }

        let cancelCallback = () => {
          this.modal = false;
          this.avatarMenuClientId = clientId;
        }

        this.showModal(
          "Block User",
          "<p class='mb-4'>If you block this user you will no longer be able to see or hear them.</p><p class='mb-4'>Do you want to continue?</p>",
          confirmCallback,
          cancelCallback
        )
      },
      async adminToggleMicrophone(userId) {
        world.adminControls.toggleUserMic(userId)
        this.avatarMenuClientId = false;
        this.showModal("Microphone Toggled.", "<p class='mb-4'>The users microphone setting has been toggled.</p>")
      },
      async adminOpenChatbox(userId) {
        world.adminControls.openChatbox(userId)
        this.avatarMenuClientId = false;
        this.showModal("Chatbox Opened.", "<p class='mb-4'>The users chatbox is open.</p>")
        if(!document.querySelector("#chatbox")) {
          document.querySelector("#btn-chat").click();
        }
      },
      async adminToggleWebcam(userId) {
        world.adminControls.toggleUserWebcam(userId)
        this.avatarMenuClientId = false;
        this.showModal("Webcam Toggled.", "<p class='mb-4'>The users webcam setting has been toggled.</p>")
      },
      async adminKickUser(userId) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }

        let clientId = this.avatarMenuClientId;
        this.avatarMenuClientId = false;

        let confirmCallback = async () => {
          world.adminControls.kickUser(userId)
          this.avatarMenuClientId = false;
          this.showModal("User Kicked.", "<p class='mb-4'>The user has been removed from this event.</p>")
        }

        let cancelCallback = () => {
          this.modal = false;
          this.avatarMenuClientId = clientId;
        }

        this.showModal(
          "Kick User",
          "<p class='mb-4'>Are you sure you want to kick this user from this event?</p>",
          confirmCallback,
          cancelCallback
        )
      },
      async adminBanUser(userId) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }
        let clientId = this.avatarMenuClientId;
        this.avatarMenuClientId = false;

        let confirmCallback = async () => {
          world.adminControls.banUser(userId)
          this.avatarMenuClientId = false;
          let response = await fetch(`${process.env.VUE_APP_API_URL}/events/${urlParams.get('e')}/banUser`, {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              'Accept': 'application/json',
              "Authorization": `Bearer ${this.jwt}`
            },
            'method': 'POST',
            'body': JSON.stringify({
              target_user: userId
            }),
          });
          let data = await response.json();
          if(data.success) {
            this.showModal("User Banned.", "<p class='mb-4'>The user has been banned from this event.</p>")
          }
        }

        let cancelCallback = () => {
          this.modal = false;
          this.avatarMenuClientId = clientId;
        }

        this.showModal(
          "Ban User",
          "<p class='mb-4'>Are you sure you want to ban this user from this event?</p>",
          confirmCallback,
          cancelCallback
        )
      },
      showModal(title, body, confirmCallback = null, cancelCallback = null, size) {
        this.modal = {
          title,
          body,
          confirmCallback,
          cancelCallback,
          size
        }
      },
      hideModal() {
        this.modal = false;
      },
      async applyAcoustics(attenuation) {
        if(attenuation === '') {
          return;
        }
        this.attenuation = attenuation;
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }
        await fetch(`${process.env.VUE_APP_API_URL}/events/${this.spaceConfig.space_slug}/updateAudioSpace`, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            'Accept': 'application/json',
            "Authorization": `Bearer ${this.jwt}`
          },
          'method': 'POST',
          'body': JSON.stringify({
            spaceId: this.spaceConfig.highFidelity.spaceId,
            attenuation: attenuation
          }),
        });
      },
      async lockSpace(locked) {
        return new Promise(async (resolve) => {
          try {
            let response = await fetch(`${process.env.VUE_APP_API_URL}/spaces/${this.spaceConfig['space_slug']}/lock`, {
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                'Accept': 'application/json',
                "Authorization": `Bearer ${this.jwt}`
              },
              'method': 'POST',
              'body': JSON.stringify({
                locked: locked
              }),
            });
            resolve();
          } catch(err) {
            console.log(err);
            resolve();
          }
        })
      },
      async teleportUsers(slug) {
        if(process.env.VUE_APP_DEMO_CONFIG) {
          alert("Disabled in dev mode.");
          return;
        }

        let confirmCallback = async () => {
          let stageEvent = { action: 'switchSpace', space: slug };
          world.stageControls.executeAndSend(stageEvent);
          this.modal = false;
        }

        let cancelCallback = () => {
          this.modal = false;
          document.querySelector('#teleport-users').value = this.spaceConfig.space_slug;
        }

        this.showModal(
          "Teleport Users?",
          "<p class='mb-4'>Are you sure you want to teleport users to another space?</p>",
          confirmCallback,
          cancelCallback
        )
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