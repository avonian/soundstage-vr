<template>
    <div class="stage ui-hide">
        <div class="flex items-stretch justify-end pl-12 pt-6 absolute left-0 top-0 z-40">
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="videoTarget">
                <option value='all'>All Displays</option>
                <option value='DJTableVideo'>DJ Table</option>
                <option value='WindowVideo'>Big Screen</option>
            </select>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20"
               :class="activeVideo === i ? 'gradient-ultra' : 'bg-gray-500'"
               v-for="(video, i) of videos" @click="$emit('activateVideo', i)" :key="video">
                {{ video.label }}
            </a>
        </div>
        <div class="flex items-stretch justify-end pl-12 pt-16 absolute left-0 top-0 z-30">
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
               :class="showingUserVideos ? 'gradient-ultra' : 'bg-gray-500'"
               @click="$emit('toggleUserVideos')">
                Casting Panel
            </a>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20"
               :class="playingIntro ? 'cursor-not-allowed gradient-ultra' : 'bg-purple-700'"
               @click="playIntro">
               {{ playingIntro ? 'Playing...' : 'Play Intro' }}
            </a>
            <div id="environmentControls" class="inline-flex" :class="playingIntro ? 'opacity-50' : ''">
                <select class="bg-white text-sm text-black mr-3 rounded-md" id="moodSet" @change="$emit('changeMood')">
                    <option :value=null>None</option>
                    <option :value="moodSet" v-for="moodSet of Object.keys(moodSets)" :key="moodSet">{{ moodSet }}</option>
                </select>
                <select class="bg-white text-sm text-black mr-3 rounded-md hidden" id="cubeTexture" @change="$emit('changeCubeTexture')">
                    <option :value="cubeTexture" v-for="cubeTexture of Object.keys(cubeTextures)" :key="cubeTexture">{{ cubeTexture }}</option>
                </select>
                <select class="bg-white text-sm text-black mr-3 rounded-md" id="DJSpotLightIntensity" @change="$emit('changeDJSpotLightIntensity', $event.target.value)">
                    <option :value="setting" v-for="setting of [0, 0.1, 0.2, 0.5]" :selected="setting === DJSpotLightIntensity" :key="setting">{{ setting }}</option>
                </select>
                <select class="bg-white text-sm text-black mr-3 rounded-md" id="fogSetting" @change="$emit('changeFog')" v-if="fogSettingConfigs">
                    <option :value="setting" v-for="setting of Object.keys(fogSettingConfigs)" :key="setting">{{ setting }}</option>
                </select>
                <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
                   id="tunnelLight"
                   :class="tunnelLightsOn ? 'gradient-ultra' : 'bg-gray-500'"
                   @click="$emit('toggleTunnelLights')">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </a>
                <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
                   :class="gridFloorOn ? 'gradient-ultra' : 'bg-gray-500'"
                   @click="$emit('toggleGridFloor')">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </a>
                <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
                   :class="moodParticlesOn ? 'gradient-ultra' : 'bg-gray-500'"
                   @click="$emit('toggleMoodParticles')">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </a>
                <div class="flex items-center text-lg">Save state: <input type="checkbox" id="saveState" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded ml-2"></div>
            </div>
        </div>
        <div class="flex items-stretch justify-end pl-12 pt-16 absolute left-0 top-12 z-20">
            <div class="flex items-center text-lg">Freecam Sound: <select class="bg-white text-sm text-black mr-3 rounded-md ml-2" id="freeCamSpatialAudio">
                    <option value="stage" selected>Stage</option>
                    <option value="freecam">Freecam</option>
                    <option value="avatar">Avatar</option>
                </select>
            </div>
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="easing">
                <option value="">No easing</option>
                <option value="PowerEase">Power Ease</option>
                <option value="CubicEase">Cubic Ease</option>
                <option value="SineEase">Sine Ease</option>
            </select>
            <span class="inline-flex" v-if="world && world.cineCam">
                <input type="text" class="rounded-lg mr-3 text-black" value="0,1,2,3,4,5,6,7,8,9" id="autoloop-sequence" style="width: 100px;"/>
                <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 bg-indigo-500"
                   @click="$emit('playCameraAnimations', i)"
                   v-for="i in Object.keys(world.cineCam.animations)" :key="i">
                    {{ i }}
                </a>
            </span>
        </div>
        <div class="flex items-center text-lg pl-12 pt-16 absolute left-0 top-24 z-10">
            <div class="inline-flex mr-3 items-center justify-center" v-if="mixerConnected">
                Ambient Audio: <select class="bg-white text-sm text-black mr-3 rounded-md ml-2" :value="activeAudioTrack" :disabled="waitingForMixer && 'disabled'" @change="switchAudioTrack">
                    <option value=false>None</option>
                    <option v-for="audioTrack of audioTracks" :key="audioTrack">{{ audioTrack }}</option>
                </select>
                <div v-if="waitingForMixer">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <div class="flex items-center text-lg" v-else>Loop Mode: <input type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded ml-2" :checked="loop" @click="toggleLooping"></div>
            </div>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20 bg-indigo-500"
               @click="teleport({ x: 8.3985268, y: -3.4950000, z: -17.364640 })">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg> Outside
            </a>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20 bg-indigo-500"
               @click="teleport({ x:5.006, y: -2.509445424, z: 34.471093 })">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg> VIP
            </a>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20 bg-indigo-500"
               @click="teleport({ x:11.4346767, y: 0.64357063, z: -7.233532 })">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg> Entrance
            </a>
            <a class="glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20"
               @click="toggleAttenuation" :class="attenuation === 0.00001 ? 'gradient-ultra' : 'bg-gray-500'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg> Acoustics Boost
            </a>
        </div>
    </div>
</template>

<script>
    import { VRSPACEUI } from '../../vrspace/index-min'

    export default {
      name: "StageControls",
      props: ['activeVideo', 'world', 'spaceConfig', 'videos', 'cubeTextures', 'fogSettingConfigs', 'moodSets', 'showingUserVideos', 'DJSpotLightIntensity', 'tunnelLightsOn', 'gridFloorOn', 'moodParticlesOn', 'attenuation'],
      data() {
        return {
          playingIntro: false,
          mixerConnected: false,
          audioTracks: false,
          activeAudioTrack: false,
          waitingForMixer: false,
          loop: false,
          attenuationOptions: [
            {
              value: 0.00001,
              label: 'Boost Energy',
            },
            {
              value: 0.5,
              label: 'Normal',
            }
          ],
          mixerUrl: process.env.VUE_APP_MIXER_URL ? process.env.VUE_APP_MIXER_URL : this.spaceConfig.mixerUrl,
          mixerToken: process.env.VUE_APP_MIXER_URL ? process.env.VUE_APP_MIXER_TOKEN : this.spaceConfig.mixerToken,
        }
      },
      mounted() {
        setTimeout(this.connectToMixer, 5000);
        document.addEventListener('keydown', (e) => {
          if(e.code === "F8") {
            this.toggleAttenuation();
          }
        });
      },
      methods: {
        async connectToMixer() {
          try {
            let response = await fetch(`${this.mixerUrl}/connect`, {
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                'Accept': 'application/json'
              },
              'method': 'POST',
              'body': JSON.stringify({
                token:  this.mixerToken,
                spaceId: this.spaceConfig.highFidelity.spaceId
              }),
            });
            // Set next poll interval
            setTimeout(this.connectToMixer, 5000);
            // If we have a mixer transition in effect return immediately and poll later
            if(this.waitingForMixer) {
              return;
            }
            // If no active transition in effect it's afe to update the mixer status with what's being reported back
            let data = await response.json();
            if(data.success) {
              this.audioTracks = data.tracks;
              this.mixerConnected = true;
              this.activeAudioTrack = data.activeTrack;
              this.loop = data.loop;
            }
          } catch(err) {
            console.log(err);
          }
        },
        async playIntro() {
          if(this.playingIntro) {
            return;
          }
          this.playingIntro = true;

          if(!document.querySelector("#saveState").checked) {
            document.querySelector("#saveState").click();
          }

          //let stop = this.stopAudioTrack();

          setTimeout(() => {
            console.log('Dimming lights');
            document.querySelector('#moodSet').value = 'Dim Lights'
            this.$emit('changeMood', 'Dim Lights')
          }, 0);

          setTimeout(async () => {
            await this.switchAudioTrack("Kill-Paris-Intro.mp3", true);
            setTimeout(() => {
              console.log('Playing audio/video');
              this.$emit('activateVideo', 1);
            }, 0);

            setTimeout(() => {
              console.log('Turning on spotlight');
              document.querySelector('#DJSpotLightIntensity').value = '0.5';
              this.$emit('changeDJSpotLightIntensity', 0.5)
            }, 20000);

            setTimeout(() => {
              console.log('Adding purple fog');
              document.querySelector('#fogSetting').value = 'purple';
              this.$emit('changeFog')
            }, 24000);

            setTimeout(() => {
              console.log('Turning on tunnel light');
              document.querySelector('#tunnelLight').click();
            }, 37000);

            setTimeout(() => {
              console.log('Adding indigo fog');
              document.querySelector('#fogSetting').value = 'indigo';
              this.$emit('changeFog')
            }, 60000);

            /*
            setTimeout(() => {
              console.log('Back to default video');
              this.$emit('activateVideo', 0);
            }, 70000);
            */

            setTimeout(() => {
              console.log('Adding purple fog');
              document.querySelector('#fogSetting').value = 'purple';
              this.$emit('changeFog')
            }, 90000);

            setTimeout(() => {
              console.log("Intro sequence complete");
              this.playingIntro = false;
            }, 100000);

          }, 0);
        },
        async stopAudioTrack() {
          return new Promise(async (resolve) => {
            try {
              let response = await fetch(`${this.mixerUrl}/stop`, {
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  'Accept': 'application/json'
                },
                'method': 'POST',
                'body': JSON.stringify({
                  token: this.mixerToken,
                  spaceId: this.spaceConfig.highFidelity.spaceId
                }),
              });
              resolve();
            } catch(err) {
              console.log(err);
              resolve();
            }
          })
        },
        async startAudioTrack(broadcast = false) {
          return new Promise(async (resolve) => {
            try {
              let response = await fetch(`${this.mixerUrl}/start`, {
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  'Accept': 'application/json'
                },
                'method': 'POST',
                'body': JSON.stringify({
                  token: this.mixerToken,
                  spaceId: this.spaceConfig.highFidelity.spaceId,
                  audioTrack: this.activeAudioTrack,
                  broadcast: broadcast,
                  loop: this.loop
                }),
              });
              resolve();
            } catch(err) {
              console.log(err);
              resolve();
            }
          })
        },
        async toggleLooping() {
          this.loop = this.loop !== true;
          return new Promise(async (resolve) => {
            try {
              let response = await fetch(`${this.mixerUrl}/update`, {
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  'Accept': 'application/json'
                },
                'method': 'POST',
                'body': JSON.stringify({
                  token: this.mixerToken,
                  spaceId: this.spaceConfig.highFidelity.spaceId,
                  loop: this.loop
                }),
              });
              resolve();
            } catch(err) {
              console.log(err);
              resolve();
            }
          })
        },
        async switchAudioTrack(event, broadcast = false) {
          let audioTrack = typeof(event) === 'string' ? event : event.target.value;
          return new Promise(async (resolve) => {
            this.activeAudioTrack = audioTrack;
            this.waitingForMixer = true;
            await this.stopAudioTrack();
            if(this.activeAudioTrack !== 'false') {
              await this.startAudioTrack(broadcast);
            }
            this.waitingForMixer = false;
            resolve();
          });
        },
        teleport(location) {
          this.animateCamera = VRSPACEUI.createAnimation(this.world.camera1, "position", 100);
          VRSPACEUI.updateAnimation(this.animateCamera, this.world.camera1.position.clone(), new BABYLON.Vector3(location.x, location.y, location.z));
          setTimeout(() => {
            this.animateCamera = false;
          }, 100);
        },
        toggleAttenuation() {
          this.$emit('applyAcoustics', this.attenuation === 0.00001 ? 0.5 : 0.00001)
        }
      }
    }
</script>