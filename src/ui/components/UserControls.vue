<template>
    <div class="ui-hide absolute bottom-0 left-0 pl-12 pr-12 pb-12 w-full flex items-end gap-6">

        <AudioMixer
                class="absolute right-12 bottom-32"
                :userSettings="userSettings"
                @setVolume="$emit('setVolume', $event)"
        />

        <a class="btn-ui-primary gradient-ultra" @click="$emit('showSettingsPanel')">
            <svg xmlns="http://www.w3.org/2000/svg" height="30" width="30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
        </a>
        <a class="btn-ui-primary gradient-ultra" @click="$emit('toggleStageControls')">
            <svg height="30" width="30" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
                <g><g><path d="M50.701,7.379H13.299c-3.256,0-5.92,2.664-5.92,5.92v37.403c0,3.256,2.664,5.92,5.92,5.92h37.403 c3.256,0,5.92-2.664,5.92-5.92V13.299C56.621,10.043,53.957,7.379,50.701,7.379z M22.387,30.049c0,1.356-0.861,2.506-2.062,2.957    v13.507h-2V33.071c-1.31-0.389-2.273-1.589-2.273-3.023v-3.407c0-1.434,0.964-2.635,2.273-3.024v-8.288h2v8.354    c1.201,0.451,2.062,1.602,2.062,2.958V30.049z M35.168,39.938c0,1.395-0.913,2.569-2.168,2.99l0.004,3.245l-2,0.002l-0.004-3.248    c-1.254-0.422-2.167-1.595-2.167-2.99V36.53c0-1.39,0.906-2.56,2.154-2.986l-0.025-18.129l2-0.003l0.025,18.124    c1.262,0.417,2.181,1.594,2.181,2.994V39.938z M47.949,31.798c0,1.403-0.922,2.581-2.188,2.997v11.718h-2v-11.73    c-1.245-0.427-2.148-1.596-2.148-2.985v-3.407c0-1.388,0.903-2.558,2.148-2.985v-9.908h2v9.896    c1.265,0.416,2.188,1.594,2.188,2.997V31.798z"></path></g></g>
            </svg>
        </a>
        <a class="btn-ui-tertiary" @click="$emit('toggleDebug')" v-if="debugging">
            Debug
        </a>
        <a class="btn-ui-tertiary" @click="$emit('startRecording')" v-if="debugging">
            <span v-if="!recording">Record Audio</span>
            <span v-else>Stop Recording</span>
        </a>
        <InstrumentationPanel v-if="showInstrumentation" :world="world" :debugging="debugging"/>

        <div class="flex-grow flex justify-end">
            <!-- reserved space -->
        </div>

        <div class="btn-toggle" v-if="useComputerSound && enableStereo">
            Send Music (F9)
            <label class="toggle-switch mt-1">
                <input type="checkbox" :checked="userSettings.sendingMusic" @change="$emit('toggleSendingMusic', $event.target.checked)">
                <span class="toggle-switch-slider round"></span>
            </label>
        </div>

        <a id="btn-chat" class="btn-ui-secondary" @click="$emit('toggleChat')" v-if="!chatOpen">
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="far" data-icon="comments" class="svg-inline--fa fa-comments fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                <path fill="currentColor" d="M416 192c0-88.4-93.1-160-208-160S0 103.6 0 192c0 34.3 14.1 65.9 38 92-13.4 30.2-35.5 54.2-35.8 54.5-2.2 2.3-2.8 5.7-1.5 8.7S4.8 352 8 352c36.6 0 66.9-12.3 88.7-25 32.2 15.7 70.3 25 111.3 25 114.9 0 208-71.6 208-160zm122 220c23.9-26 38-57.7 38-92 0-66.9-53.5-124.2-129.3-148.1.9 6.6 1.3 13.3 1.3 20.1 0 105.9-107.7 192-240 192-10.8 0-21.3-.8-31.7-1.9C207.8 439.6 281.8 480 368 480c41 0 79.1-9.2 111.3-25 21.8 12.7 52.1 25 88.7 25 3.2 0 6.1-1.9 7.3-4.8 1.3-2.9.7-6.3-1.5-8.7-.3-.3-22.4-24.2-35.8-54.5z"></path>
            </svg>
        </a>
        <a id="btn-webcam" class="btn-ui-secondary" @click="$emit('cameraOnOff')" v-if="userSettings.enableWebcamFeeds && videoDevices.length > 0">
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="webcam" class="svg-inline--fa fa-webcam fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" v-if="webcamEnabled">
                <path fill="currentColor" d="M402.29 438.6l-49.19-30.75c58.11-40.46 96.23-107.66 96.23-183.85 0-123.71-100.29-224-224-224s-224 100.29-224 224c0 76.19 38.12 143.39 96.23 183.85L48.37 438.6a32 32 0 0 0-15 27.14V480a32 32 0 0 0 32 32h320a32 32 0 0 0 32-32v-14.26a32 32 0 0 0-15.08-27.14zm-177-54.6a160 160 0 1 1 160-160 160 160 0 0 1-159.96 160zm0-288a128 128 0 1 0 128 128A128 128 0 0 0 225.33 96zm0 80a48.05 48.05 0 0 0-48 48 16 16 0 0 1-32 0 80.09 80.09 0 0 1 80-80 16 16 0 1 1 0 32z"></path>
            </svg>
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="webcam-slash" class="svg-inline--fa fa-webcam-slash fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" v-else>
                <path fill="currentColor" d="M163.46 256.92l-66.53-51.41c-.5 6.11-.93 12.25-.93 18.49 0 76.19 38.12 143.39 96.23 183.85L143 438.6a32 32 0 0 0-15 27.14V480a32 32 0 0 0 32 32h320a31.58 31.58 0 0 0 10.7-2.16L327 383.3c-83.42 3.7-148.41-54.1-163.54-126.38zM633.82 458.1L500.7 355.21c27-36.85 43.3-82 43.3-131.21C544 100.29 443.71 0 320 0a223.48 223.48 0 0 0-173 81.8L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zM320 176a47.78 47.78 0 0 0-33.46 13.69l-25.3-19.55A79.57 79.57 0 0 1 320 144a16 16 0 0 1 0 32zm130.12 140.12l-25.23-19.5A126 126 0 0 0 448 224a127.86 127.86 0 0 0-224.93-83.36l-24.65-19C227.56 86.62 270.85 64 320 64a160 160 0 0 1 160 160 157.21 157.21 0 0 1-29.88 92.12z"></path>
            </svg>
        </a>
        <a id="btn-microphone" class="btn-ui-secondary" @click="$emit('microphoneOnOff')">
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="microphone" class="svg-inline--fa fa-microphone fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" v-if="micEnabled">
                <path fill="currentColor" d="M176 352c53.02 0 96-42.98 96-96V96c0-53.02-42.98-96-96-96S80 42.98 80 96v160c0 53.02 42.98 96 96 96zm160-160h-16c-8.84 0-16 7.16-16 16v48c0 74.8-64.49 134.82-140.79 127.38C96.71 376.89 48 317.11 48 250.3V208c0-8.84-7.16-16-16-16H16c-8.84 0-16 7.16-16 16v40.16c0 89.64 63.97 169.55 152 181.69V464H96c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16h-56v-33.77C285.71 418.47 352 344.9 352 256v-48c0-8.84-7.16-16-16-16z"></path>
            </svg>
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="far" data-icon="microphone-slash" class="svg-inline--fa fa-microphone-slash fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" v-else>
                <path fill="currentColor" d="M633.99 471.02L36 3.51C29.1-2.01 19.03-.9 13.51 6l-10 12.49C-2.02 25.39-.9 35.46 6 40.98l598 467.51c6.9 5.52 16.96 4.4 22.49-2.49l10-12.49c5.52-6.9 4.41-16.97-2.5-22.49zM496 256v-48c0-8.84-7.16-16-16-16h-16c-8.84 0-16 7.16-16 16v48c0 2.75-.69 5.31-.86 8.01l43.21 33.78c3.32-13.47 5.65-27.31 5.65-41.79zm-96 208h-56v-33.77c20.68-2.84 40.14-9.43 57.9-18.81l-43.1-33.69c-16.09 5.14-33.46 7.42-51.59 5.65C240.72 376.89 192 317.11 192 250.3v-2.98l-48-37.53v38.37c0 89.64 63.97 169.55 152 181.69V464h-56c-8.84 0-16 7.16-16 16v16c0 8.84 7.16 16 16 16h160c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zM272 96c0-26.47 21.53-48 48-48s48 21.53 48 48v106.14l48 37.53V96c0-53.02-42.98-96-96-96-50.97 0-92.26 39.85-95.4 90.03l47.4 37.05V96z"></path>
            </svg>
        </a>
        <a class="btn-ui-primary" @click="$emit('cycleCamera')">
            {{ cameraMode ? cameraMode[1] : '' }}
        </a>
        <img class="cursor-pointer h-14 w-14" src="../../assets/images/slightly-smiling-face.png" @click="$emit('emojiMenuOnOff')"/>

    </div>
    <div id="emojis" class="grid p-4 gap-4 grid-cols-6 w-80 absolute bottom-32 right-12 bg-black-200"
         v-show="showEmojiMenu" @click="$emit('focusCanvas')"></div>
</template>

<script>
    import InstrumentationPanel from './InstrumentationPanel'
    import AudioMixer from './AudioMixer'

    export default {
      name: "UserControls",
      components: { InstrumentationPanel, AudioMixer }, // eslint-disable-line
      props: ['debugging', 'cameraMode', 'recording', 'userSettings', 'videoDevices', 'webcamEnabled', 'micEnabled', 'showEmojiMenu', 'showInstrumentation', 'world', 'enableStereo', 'useComputerSound', 'sendingMusic', 'chatOpen'],
      mounted() {
        document.addEventListener('keydown', (e) => {
          if(e.code === "F9" && this.enableStereo && this.useComputerSound) {
            this.$emit('toggleSendingMusic', !this.sendingMusic)
          }
        });
      }
    }
</script>