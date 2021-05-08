<template>
    <div class="ui-hide">
        <div class="flex items-stretch justify-end pl-12 pb-12 absolute left-0 bottom-0">
            <a href="#"
               class="gradient-ultra glow-dark flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-4"
               @click="$emit('showSettingsPanel')">
                <svg xmlns="http://www.w3.org/2000/svg" height="30" width="30" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </a>

            <a href="#"
               class="bg-gray-500 glow-dark flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-4 ml-6"
               @click="$emit('toggleDebug')" v-if="debugging">
                Debug
            </a>

            <a href="#"
               class="bg-gray-500 glow-dark flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-4 ml-6"
               @click="$emit('startRecording')" v-if="debugging">
                <span v-if="!recording">Record Audio</span>
                <span v-else>Stop Recording</span>
            </a>

            <InstrumentationPanel v-if="showInstrumentation"
                    :world="world"
                    :debugging="debugging"/>
        </div>

        <div class="flex items-stretch justify-end pb-12 absolute right-12 bottom-0">

            <div class="flex flex-col items-center justify-center text-sm font-medium rounded-lg text-white mr-6" v-if="useComputerSound && enableStereo">
                Send Music (F9)
                <label class="toggle-switch mt-1">
                    <input type="checkbox" :checked="userSettings.sendingMusic" @change="$emit('toggleSendingMusic', $event.target.checked)">
                    <span class="toggle-switch-slider round"></span>
                </label>
            </div>
            <AudioMixer
                    class="absolute right-0 bottom-32"
                    :userSettings="userSettings"
                    @setVolume="$emit('setVolume', $event)"
            />

            <a
                    href="#"
                    class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-6"
                    @click="$emit('rotationOnOff')">
                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas"
                     data-icon="webcam" class="svg-inline--fa fa-transporter fa-w-16" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" v-if="userSettings.trackRotation">
                    <path class="fa-secondary" fill="currentColor"
                          d="M509.789,44.43164,480.00684,32.01172,467.58458,2.22656a3.99473,3.99473,0,0,0-7.15647,0L448.00586,32.01172,418.2237,44.43164a3.99921,3.99921,0,0,0,0,7.1543l29.78216,12.41992L460.42811,93.791a3.9963,3.9963,0,0,0,7.15647,0l12.42226-29.78516L509.789,51.58594a3.99921,3.99921,0,0,0,0-7.1543ZM63.99023,96,51.57189,66.21484a3.99473,3.99473,0,0,0-7.15647,0L31.99316,96,2.211,108.41992a3.99921,3.99921,0,0,0,0,7.1543l29.78216,12.41992L44.41542,157.7793a3.9963,3.9963,0,0,0,7.15647,0l12.41834-29.78516L93.7763,115.57422a3.99921,3.99921,0,0,0,0-7.1543Z"
                          opacity="0.4"></path>
                    <path class="fa-primary" fill="currentColor"
                          d="M255.957,96l.01953-.00195L255.99609,96a48,48,0,1,0,0-96l-.01953.002L255.957,0a48,48,0,1,0,0,96ZM384,448H327.99829V238.7793l31.42283,37.70508a31.9958,31.9958,0,0,0,49.15776-40.96875L338.1861,151.03125A63.84343,63.84343,0,0,0,289.01273,128H222.97946a63.78806,63.78806,0,0,0-49.15775,23.03125l-70.4084,84.48438a31.99579,31.99579,0,0,0,49.15775,40.96875L183.9939,238.7793V448H127.99219a31.99832,31.99832,0,0,0-32.001,32v32H416.001V480A31.99832,31.99832,0,0,0,384,448Zm-120.00366,0H247.99585V320h16.00049Z"></path>
                </svg>
                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas"
                     data-icon="webcam-slash" class="svg-inline--fa fa-webcam-slash fa-w-20" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" v-else>
                    <path fill="currentColor"
                          d="M372.32386,192H139.68l-26.66683,32H398.98679ZM263.99829,416h64.002V384h-64.002Zm64.002-96h-64.002v32h64.002Zm31.42284-43.51562a31.98515,31.98515,0,0,0,45.06387,4.09374A31.45531,31.45531,0,0,0,415.57323,256h-73.221ZM255.99805,0l-.01954.002L255.959,0a47.95186,47.95186,0,0,0-45.0502,32h90.13947A47.95186,47.95186,0,0,0,255.99805,0ZM255.959,96l.01953-.00195L255.99805,96a47.87741,47.87741,0,0,0,45.06-32H210.899A47.87741,47.87741,0,0,0,255.959,96Zm82.22908,55.03125A63.84341,63.84341,0,0,0,289.01468,128H222.98141a63.78806,63.78806,0,0,0-49.15775,23.03125L166.34883,160H345.66094ZM247.9978,320h-64.002v32h64.002ZM152.573,276.48438,169.64385,256h-73.221a31.45534,31.45534,0,0,0,11.08628,24.57812A32.00632,32.00632,0,0,0,152.573,276.48438ZM384.002,448H127.99414a31.99957,31.99957,0,0,0-32.001,32v32H416.00293V480A31.99957,31.99957,0,0,0,384.002,448ZM328.00024,256H183.99585v32H328.00024ZM183.99585,416h64.002V384h-64.002ZM509.791,44.43164,480.00488,32.01172,467.58458,2.22656a3.99315,3.99315,0,0,0-7.15451,0l-12.4203,29.78516L418.2237,44.43164a3.99921,3.99921,0,0,0,0,7.1543l29.78607,12.41992L460.43007,93.791a3.99472,3.99472,0,0,0,7.15451,0l12.4203-29.78516L509.791,51.58594a4.00079,4.00079,0,0,0,0-7.1543ZM63.99023,352.00391,51.56993,322.2207a3.99315,3.99315,0,0,0-7.15451,0l-12.4203,29.78321L2.20905,364.42383a4.00237,4.00237,0,0,0,0,7.15625L31.99512,384l12.4203,29.7832a3.99315,3.99315,0,0,0,7.15451,0L63.99023,384,93.7763,371.58008a4.00079,4.00079,0,0,0,0-7.15625Z"></path>
                </svg>
            </a>

            <a
                    id="btn-webcam"
                    href="#"
                    class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-6"
                    @click="$emit('cameraOnOff')" v-if="userSettings.enableWebcamFeeds && videoDevices.length > 0">
                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas"
                     data-icon="webcam" class="svg-inline--fa fa-webcam fa-w-14" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" v-if="webcamEnabled">
                    <path fill="currentColor"
                          d="M402.29 438.6l-49.19-30.75c58.11-40.46 96.23-107.66 96.23-183.85 0-123.71-100.29-224-224-224s-224 100.29-224 224c0 76.19 38.12 143.39 96.23 183.85L48.37 438.6a32 32 0 0 0-15 27.14V480a32 32 0 0 0 32 32h320a32 32 0 0 0 32-32v-14.26a32 32 0 0 0-15.08-27.14zm-177-54.6a160 160 0 1 1 160-160 160 160 0 0 1-159.96 160zm0-288a128 128 0 1 0 128 128A128 128 0 0 0 225.33 96zm0 80a48.05 48.05 0 0 0-48 48 16 16 0 0 1-32 0 80.09 80.09 0 0 1 80-80 16 16 0 1 1 0 32z"></path>
                </svg>
                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas"
                     data-icon="webcam-slash" class="svg-inline--fa fa-webcam-slash fa-w-14" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" v-else>
                    <path fill="currentColor"
                          d="M163.46 256.92l-66.53-51.41c-.5 6.11-.93 12.25-.93 18.49 0 76.19 38.12 143.39 96.23 183.85L143 438.6a32 32 0 0 0-15 27.14V480a32 32 0 0 0 32 32h320a31.58 31.58 0 0 0 10.7-2.16L327 383.3c-83.42 3.7-148.41-54.1-163.54-126.38zM633.82 458.1L500.7 355.21c27-36.85 43.3-82 43.3-131.21C544 100.29 443.71 0 320 0a223.48 223.48 0 0 0-173 81.8L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zM320 176a47.78 47.78 0 0 0-33.46 13.69l-25.3-19.55A79.57 79.57 0 0 1 320 144a16 16 0 0 1 0 32zm130.12 140.12l-25.23-19.5A126 126 0 0 0 448 224a127.86 127.86 0 0 0-224.93-83.36l-24.65-19C227.56 86.62 270.85 64 320 64a160 160 0 0 1 160 160 157.21 157.21 0 0 1-29.88 92.12z"></path>
                </svg>
            </a>

            <a
                    id="btn-microphone"
                    href="#"
                    class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-8"
                    @click="$emit('microphoneOnOff')">

                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas"
                     data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" v-if="micEnabled">
                    <path fill="currentColor"
                          d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path>
                </svg>

                <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="far"
                     data-icon="microphone-slash" class="svg-inline--fa fa-microphone-slash fa-w-20" role="img"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" v-else>
                    <path fill="currentColor"
                          d="M633.99 471.02L36 3.51C29.1-2.01 19.03-.9 13.51 6l-10 12.49C-2.02 25.39-.9 35.46 6 40.98l598 467.51c6.9 5.52 16.96 4.4 22.49-2.49l10-12.49c5.52-6.9 4.41-16.97-2.5-22.49zM496 256v-48c0-8.84-7.16-16-16-16h-16c-8.84 0-16 7.16-16 16v48c0 2.75-.69 5.31-.86 8.01l43.21 33.78c3.32-13.47 5.65-27.31 5.65-41.79zm-96 208h-56v-33.77c20.68-2.84 40.14-9.43 57.9-18.81l-43.1-33.69c-16.09 5.14-33.46 7.42-51.59 5.65C240.72 376.89 192 317.11 192 250.3v-2.98l-48-37.53v38.37c0 89.64 63.97 169.55 152 181.69V464h-56c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zM272 96c0-26.47 21.53-48 48-48s48 21.53 48 48v106.14l48 37.53V96c0-53.02-42.98-96-96-96-50.97 0-92.26 39.85-95.4 90.03l47.4 37.05V96z"></path>
                </svg>
            </a>

            <a href="#"
               class="gradient-ultra glow-dark flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-8"
               @click="$emit('cycleCamera')">
                {{ cameraMode ? cameraMode[1] : '' }}
            </a>
            <img class="cursor-pointer h-14 w-14" src="../../assets/images/slightly-smiling-face.png"
                 @click="$emit('emojiMenuOnOff')"/>
        </div>

        <div id="emojis" class="grid p-4 gap-4 grid-cols-6 w-80 absolute bottom-32 right-12 bg-black-200"
             v-show="showEmojiMenu" @click="$emit('focusCanvas')"></div>

    </div>
</template>

<script>
    import InstrumentationPanel from './InstrumentationPanel'
    import AudioMixer from './AudioMixer'

    export default {
      name: "UserControls",
      components: { InstrumentationPanel, AudioMixer },
      props: ['debugging', 'cameraMode', 'recording', 'userSettings', 'videoDevices', 'webcamEnabled', 'micEnabled', 'showEmojiMenu', 'showInstrumentation', 'world', 'enableStereo', 'useComputerSound', 'sendingMusic'],
      mounted() {
        document.addEventListener('keydown', (e) => {
          if(e.code === "F9" && this.enableStereo && this.useComputerSound) {
            this.$emit('toggleSendingMusic', !this.sendingMusic)
          }
        });
      }
    }
</script>