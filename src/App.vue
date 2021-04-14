<template>
    <InvalidEvent v-if="invalidAccess"></InvalidEvent>
    <template v-else>
        <div class="fixed z-10 inset-0 overflow-y-auto min-h-screen" v-if="showHelp">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div class="absolute inset-0 bg-gray-800 opacity-75"></div>
                </div>

                <!-- This element is to trick the browser into centering the modal contents. -->
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-2xl sm:p-6"
                     role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                    <div>
                        <div class="text-center">
                            <h3 class="text-2xl leading-6 font-medium text-white" id="modal-headline">
                                Welcome to the SoundStage VR Venue
                            </h3>
                            <p class="text-xl text-white mt-3 mb-3">
                                Here's a quick guide on how to move around in this space:
                            </p>
                            <img src="./assets/images/keyboard-map.png"/>
                        </div>
                    </div>
                    <div class="mt-5 sm:mt-6">
                        <button type="button"
                                class="gradient-ultra inline-flex justify-center w-full rounded-md px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                @click="showHelp = false">Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="min-h-screen" v-if="deviceType === 'mobile'">
            <div class="splash"></div>

            <div class="w-full h-full">
                <div class="w-full flex-shrink-0 flex items-center justify-center pt-16">
                    <img class="block h-8 sm:h-10 w-auto" src="./assets/images/logo-badge.svg">
                    <img class="block h-4 sm:h-5 w-auto ml-2" src="./assets/images/logo-text.svg">
                </div>
                <div class="z-10 inset-0 overflow-y-auto">
                    <div class="flex items-end justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6"
                             role="dialog"
                             aria-modal="true"
                             aria-labelledby="modal-headline">
                            <div class="text-white">
                                <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="laptop"
                                     class="svg-inline--fa fa-laptop w-20 fa-w-20 text-gray-400 mx-auto" role="img"
                                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                    <path fill="currentColor"
                                          d="M624 352h-48V64c0-35.2-28.8-64-64-64H128C92.8 0 64 28.8 64 64v288H16c-8.8 0-16 7.2-16 16v48c0 52.8 43.2 96 96 96h448c52.8 0 96-43.2 96-96v-48c0-8.8-7.2-16-16-16zM112 64c0-8.67 7.33-16 16-16h384c8.67 0 16 7.33 16 16v288H112V64zm480 352c0 26.47-21.53 48-48 48H96c-26.47 0-48-21.53-48-48v-16h180.9c5.57 9.39 15.38 16 27.1 16h128c11.72 0 21.52-6.61 27.1-16H592v16z"></path>
                                </svg>
                                <h3 class="text-3xl font-medium mt-6 w-full text-center mb-6">
                                    Please switch to a laptop/desktop.
                                </h3>
                                <p class="text-lg mb-4 leading-relaxed">
                                    Mobile support is coming soon but is not available at this time.
                                </p>
                                <p class="text-lg mb-4 leading-relaxed">
                                    We apologize for the inconvenience and invite you to try again from a laptop or desktop
                                    computer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template v-else>
            <div class="min-h-screen" v-if="entered">

                <div class="fixed w-64 h-48 right-12 top-12 rounded-lg"
                     v-show="webcamEnabled === true && cameraMode !== null && cameraMode[0] === '1p' && videoDevices.length > 0">
                    <div class="absolute top-0 right-0 bg-indigo-500 mt-2 mr-2 px-3 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer"
                         @click="castSelf" v-show="showStageControls">CAST
                    </div>
                    <video playsinline autoplay class="vid local rounded-lg" id="localVideo"></video>
                </div>

                <!-- This example requires Tailwind CSS v2.0+ -->
                <div class="fixed inset-0 overflow-hidden z-10" v-if="showSettings">
                    <div class="absolute inset-0 overflow-hidden">
                        <!--
                          Background overlay, show/hide based on slide-over state.

                          Entering: "ease-in-out duration-500"
                            From: "opacity-0"
                            To: "opacity-100"
                          Leaving: "ease-in-out duration-500"
                            From: "opacity-100"
                            To: "opacity-0"
                        -->
                        <div class="absolute inset-0 bg-gray-800 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <section class="absolute inset-y-0 left-0 pr-10 max-w-full flex"
                                 aria-labelledby="slide-over-heading">
                            <!--
                              Slide-over panel, show/hide based on slide-over state.

                              Entering: "transform transition ease-in-out duration-500 sm:duration-700"
                                From: "translate-x-full"
                                To: "translate-x-0"
                              Leaving: "transform transition ease-in-out duration-500 sm:duration-700"
                                From: "translate-x-0"
                                To: "translate-x-full"
                            -->
                            <div class="w-screen max-w-md">
                                <div class="h-full flex flex-col py-6 bg-alt-primary shadow-xl">
                                    <div class="px-4 sm:px-6">
                                        <div class="flex items-start justify-between">
                                            <h2 id="slide-over-heading" class="text-lg font-medium text-white">
                                                Settings
                                            </h2>
                                            <div class="ml-3 h-7 flex items-center">
                                                <button class="bg-alt-primary rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        @click="showSettings = false">
                                                    <span class="sr-only">Close panel</span>
                                                    <!-- Heroicon name: outline/x -->
                                                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                         viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                              stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-6 relative flex-1 px-4 sm:px-6">
                                        <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                                            <div class="col-span-2">
                                                <label for="audioDevice"
                                                       class="block text-sm font-medium leading-5 text-white">
                                                    Audio Input Device (Microphone)
                                                </label>
                                                <div class="mt-1 flex rounded-md shadow-sm">
                                                    <select id="audioDevice"
                                                            class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                            v-model="userSettings.selectedAudioDeviceId"
                                                            v-if="audioDevices.length > 0">
                                                        <option v-for="device in audioDevices" :key="device"
                                                                :value='device.deviceId'
                                                                :selected="device.deviceId === userSettings.selectedAudioDeviceId">
                                                            {{ device.label }}
                                                        </option>
                                                    </select>
                                                    <span class="text-gray-400" v-else>No audio input devices found</span>
                                                </div>
                                            </div>
                                            <div class="col-span-2" v-if="canBroadcast">
                                                <div class="space-y-4">
                                                    <div class="relative flex items-start">
                                                        <div class="flex items-center h-5">
                                                            <input id="enableStereo" name="enableStereo" type="checkbox"
                                                                   class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                                   v-model="userSettings.enableStereo">
                                                        </div>
                                                        <div class="ml-3 text-sm">
                                                            <label for="enableStereo" class="font-medium text-white">Broadcast
                                                                in Stereo</label>
                                                            <p class="text-white">Turn this on when you are ready to perform
                                                                for the venue.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-span-2" v-if="canBroadcast">
                                                <label for="gainBoost"
                                                       class="block text-sm font-medium leading-5 text-white">
                                                    Gain Boost (when Broadcasting)
                                                </label>
                                                <div class="mt-1 flex rounded-md shadow-sm w-full">
                                                    <input id="gainBoost" type="range" min="0" max="200"
                                                           class="slider flex-grow"
                                                           v-model="userSettings.stereoGainBoost"
                                                    >
                                                    <span class="w-12 text-center">{{ userSettings.stereoGainBoost }}%</span>
                                                </div>
                                            </div>
                                            <div class="col-span-2" v-show="playbackDevices.length > 0">
                                                <label for="audioDevice"
                                                       class="block text-sm font-medium leading-5 text-white">
                                                    Playback Device (Speakers/Headsets)
                                                </label>
                                                <div class="mt-1 flex rounded-md shadow-sm">
                                                    <select id="playbackDevice"
                                                            class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                            v-model="userSettings.selectedPlaybackDeviceId"
                                                            v-if="playbackDevices.length > 0">
                                                        <option v-for="device in playbackDevices" :key="device"
                                                                :value='device.deviceId'
                                                                :selected="device.deviceId === userSettings.selectedPlaybackDeviceId">
                                                            {{ device.label }}
                                                        </option>
                                                    </select>
                                                    <span class="text-gray-400" v-else>No playback devices found</span>
                                                </div>
                                            </div>
                                            <div class="col-span-2">
                                                <label for="audioDevice"
                                                       class="block text-sm font-medium leading-5 text-white">
                                                    Video Device
                                                </label>
                                                <div class="mt-1 flex rounded-md shadow-sm">
                                                    <select id="videoDevice"
                                                            class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                            v-model="userSettings.selectedVideoDeviceId"
                                                            v-if="videoDevices.length > 0">
                                                        <option v-for="device in videoDevices" :key="device"
                                                                :value='device.deviceId'
                                                                :selected="device.deviceId === userSettings.selectedVideoDeviceId">
                                                            {{ device.label }}
                                                        </option>
                                                    </select>
                                                    <span class="text-gray-400" v-else>No video devices found</span>
                                                </div>
                                            </div>
                                            <div class="col-span-2">
                                                <label for="audioDevice"
                                                       class="block text-sm font-medium leading-5 text-white">
                                                    Visual Settings
                                                </label>
                                                <div class="mt-4 space-y-4">
                                                    <div class="relative flex items-start">
                                                        <div class="flex items-center h-5">
                                                            <input id="enableWebcamFeeds" name="enableWebcamFeeds"
                                                                   type="checkbox"
                                                                   class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                                   v-model="userSettings.enableWebcamFeeds">
                                                        </div>
                                                        <div class="ml-3 text-sm">
                                                            <label for="enableWebcamFeeds" class="font-medium text-white">Enable
                                                                Webcam Feeds</label>
                                                            <p class="text-white">Turning this off will disable webcam feeds
                                                                and may improve performance on older computers.</p>
                                                        </div>
                                                    </div>
                                                    <div class="relative flex items-start">
                                                        <div class="flex items-center h-5">
                                                            <input id="enableVisuals" name="enableVisuals" type="checkbox"
                                                                   class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                                   v-model="userSettings.enableVisuals">
                                                        </div>
                                                        <div class="ml-3 text-sm">
                                                            <label for="enableVisuals" class="font-medium text-white">Enable
                                                                Visuals</label>
                                                            <p class="text-white">Turning off visuals can improve
                                                                performance on olders computers.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-shrink-0 px-4 py-4 flex justify-end">
                                        <button type="button"
                                                class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                @click="revertSettings">
                                            Cancel
                                        </button>
                                        <button type="submit"
                                                class="ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                @click="saveSettings">
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div class="fixed top-0 left-0 w-full min-h-screen z-10 bg-alt-primary" id="progress-splash">
                    <div class="splash"></div>

                    <div class="w-full min-h-screen flex flex-col items-center justify-center">
                        <div class="w-full flex flex-col items-center">
                            <img class="block h-24 w-auto" src="./assets/images/logo-badge.svg">
                            <div class="mt-8 h-5 w-96 text-sm text-center m-auto rounded-lg progress-bar-wrapper relative">
                                <div class="absolute top-0 left-0 h-5 text-sm m-auto  rounded-lg inline-block"
                                     id="main-progress-bar">
                                </div>
                                <div class="absolute top-0 left-0 w-96 text-gray-300">Loading...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <canvas id="renderCanvas" touch-action="none" :class="mouseIsDown ? 'cursor-none' : ''"></canvas>

                <div v-show="showControls" class="stage">
                    <div class="flex items-stretch justify-end pl-12 pt-6 absolute left-0 top-0" v-if="showStageControls">
                        <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20"
                           :class="activeVideo === i ? 'gradient-ultra' : 'bg-gray-500'" :bind="visual"
                           v-for="(video, i) of videos" @click="activateVideo(i)" :key="video">
                            {{ video.label }}
                        </a>
                    </div>
                    <div class="flex items-stretch justify-end pl-12 pt-16 absolute left-0 top-0" v-if="showStageControls">
                        <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
                           :class="showingVideos ? 'gradient-ultra' : 'bg-gray-500'"
                           @click="showingVideos = !showingVideos">
                            Casting Panel
                        </a>
                        <select class="bg-white text-sm text-black mr-3 rounded-md" id="freeCamSpatialAudio">
                            <option value="true" selected>Freecam sound tracking</option>
                            <option value="false">Avatar sound tracking</option>
                        </select>
                        <select class="bg-white text-sm text-black mr-3 rounded-md" id="easing">
                            <option value="">No easing</option>
                            <option value="PowerEase">Power Ease</option>
                            <option value="CubicEase">Cubic Ease</option>
                            <option value="SineEase">Sine Ease</option>
                        </select>
                        <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20 bg-indigo-500"
                           @click="cameraMode = cameraModes[2]; world.playCameraAnimation(i);"
                           v-for="i in [0,1,2,3,4,5,6,7,8,9]" :key="i">
                            A{{ i+1 }}
                        </a>
                        <select class="bg-white text-sm text-black mr-3 rounded-md" id="moodSet" @change="changeMood">
                            <option :value=null>None</option>
                            <option :value="moodSet" v-for="moodSet of Object.keys(moodSets)" :key="moodSet">{{ moodSet }}</option>
                        </select>
                        <select class="bg-white text-sm text-black mr-3 rounded-md" id="cubeTexture" @change="changeCubeTexture">
                            <option :value="cubeTexture" v-for="cubeTexture of Object.keys(cubeTextures)" :key="cubeTexture">{{ cubeTexture }}</option>
                        </select>
                    </div>
                </div>

                <div v-show="showControls">
                    <div class="flex items-stretch justify-end pl-12 pb-12 absolute left-0 bottom-0">
                        <a href="#"
                           class="gradient-ultra glow-dark flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-4"
                           @click="showSettings = true">
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
                           @click="debugOnOff" v-if="debugging">
                            Debug
                        </a>

                        <a href="#"
                           class="bg-gray-500 glow-dark flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-4 ml-6"
                           @click="recordPerformance" v-if="debugging">
                            <span v-if="!recording">Record Audio</span>
                            <span v-else>Stop Recording</span>
                        </a>

                    </div>

                    <div class="flex items-stretch justify-end pb-12 absolute right-12 bottom-0">

                        <a
                                href="#"
                                class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-6"
                                @click="rotationOnOff">
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
                                href="#"
                                class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-6"
                                @click="cameraOnOff" v-if="userSettings.enableWebcamFeeds && videoDevices.length > 0">
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
                                href="#"
                                class="bg-indigo-500 glow-dark flex flex items-center justify-center px-6 py-2 sm:px-8 sm:py-3 text-base font-medium rounded-lg text-white md:py-3 md:text-lg md:px-8 mr-8"
                                @click="microphoneOnOff">

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
                           @click="cycleCamera">
                            {{ cameraMode ? cameraMode[1] : '' }}
                        </a>
                        <img class="cursor-pointer h-14 w-14" src="./assets/images/slightly-smiling-face.png"
                             @click="emojiMenuOnOff"/>

                    </div>

                    <div id="emojis" class="grid p-4 gap-4 grid-cols-6 w-80 absolute bottom-32 right-12 bg-black-200"
                         v-show="showEmojiMenu" @click="focusCanvas"></div>

                </div>
            </div>

            <div class="min-h-screen" v-else>
                <div class="splash"></div>

                <div class="w-full h-full">
                    <div class="w-full flex-shrink-0 flex items-center justify-center pt-16">
                        <img class="block h-8 sm:h-10 w-auto" src="./assets/images/logo-badge.svg">
                        <img class="block h-4 sm:h-5 w-auto ml-2" src="./assets/images/logo-text.svg">
                    </div>
                    <div class="z-10 inset-0 overflow-y-auto">
                        <div class="flex items-end justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6"
                                 role="dialog"
                                 aria-modal="true"
                                 aria-labelledby="modal-headline">
                                <div v-if="!browserSupported" class="text-white">
                                    <h3 class="text-3xl font-medium mt-3 w-full text-center mb-6">
                                        Unsupported browser
                                    </h3>
                                    <p class="text-lg mb-4 leading-relaxed">
                                        We are still working to improve cross-browser support.
                                    </p>
                                    <p class="text-lg mb-4 leading-relaxed">
                                        To ensure an adequate experience we ask that you please reconnect with one of the following web browsers:
                                    </p>
                                    <ul class="text-lg list-disc mt-3 mb-4 ml-8 leading-relaxed">
                                        <li class="mt-3 font-medium"> Google Chrome</li>
                                        <li class="mt-3 font-medium"> Microsoft Edge</li>
                                        <li class="mt-3 font-medium"> Brave</li>
                                    </ul>
                                    <p class="text-lg mb-4 leading-relaxed">
                                        We apologize for the inconvenience.
                                    </p>
                                </div>
                                <form v-else>
                                    <div>
                                        <h3 class="text-lg leading-6 font-medium text-white">
                                            {{ entered ? 'Device Settings' : 'Before connecting, please select your devices:'}}
                                        </h3>
                                    </div>
                                    <div class="mt-6 grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div class="col-span-2">
                                            <label for="audioDevice"
                                                   class="block text-sm font-medium leading-5 text-white">
                                                Audio Input Device (Microphone)
                                            </label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <select id="audioDevice"
                                                        class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                        v-model="userSettings.selectedAudioDeviceId"
                                                        v-if="audioDevices.length > 0">
                                                    <option v-for="device in audioDevices" :key="device"
                                                            :value='device.deviceId'
                                                            :selected="device.deviceId === userSettings.selectedAudioDeviceId">
                                                        {{ device.label }}
                                                    </option>
                                                </select>
                                                <span class="text-gray-400" v-else>No audio input devices found</span>
                                            </div>
                                        </div>
                                        <div class="col-span-2" v-show="playbackDevices.length > 0">
                                            <label for="audioDevice"
                                                   class="block text-sm font-medium leading-5 text-white">
                                                Playback Device (Speakers/Headsets)
                                            </label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <select id="playbackDevice"
                                                        class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                        v-model="userSettings.selectedPlaybackDeviceId"
                                                        v-if="playbackDevices.length > 0">
                                                    <option v-for="device in playbackDevices" :key="device"
                                                            :value='device.deviceId'
                                                            :selected="device.deviceId === userSettings.selectedPlaybackDeviceId">
                                                        {{ device.label }}
                                                    </option>
                                                </select>
                                                <span class="text-gray-400" v-else>No playback devices found</span>
                                            </div>
                                        </div>
                                        <div class="col-span-2">
                                            <label for="audioDevice"
                                                   class="block text-sm font-medium leading-5 text-white">
                                                Video Device
                                            </label>
                                            <div class="mt-1 flex rounded-md shadow-sm">
                                                <select id="videoDevice"
                                                        class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                        v-model="userSettings.selectedVideoDeviceId"
                                                        v-if="videoDevices.length > 0">
                                                    <option v-for="device in videoDevices" :key="device"
                                                            :value='device.deviceId'
                                                            :selected="device.deviceId === userSettings.selectedVideoDeviceId">
                                                        {{ device.label }}
                                                    </option>
                                                </select>
                                                <span class="text-gray-400" v-else>No video devices found</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-5 sm:mt-6"
                                         :class="entered ? 'sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense' : ''">
                                    <span class="flex w-full rounded-md shadow-sm sm:col-start-2">
                                      <button type="button"
                                              class="cursor-pointer gradient-ultra inline-flex justify-center w-full rounded-md px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                              @click="apply">
                                        {{ entered ? 'Apply' : 'Connect' }}
                                      </button>
                                    </span>
                                        <span class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:col-start-1"
                                              v-if="entered">
                                      <button type="button"
                                              class="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                              @click="cancel">
                                        Cancel
                                      </button>
                                    </span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- element required for OpenVidu streaming -->
        <div id="videos" class="flex flex-row" :class="!showingVideos ? 'hidden' : 'fixed bottom-0 overflow-x-auto'">
            <audio id='audioOutput' class="hidden" controls autoplay></audio>
        </div>
    </template>

</template>

<script>
  import Nightclub from './world.js'
  import InvalidEvent from './components/InvalidEvent';
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
    enableStereo: false,
    stereoGainBoost: 0,
    enableWebcamFeeds: true,
    enableVisuals: true,
    selectedAudioDeviceId: null,
    selectedPlaybackDeviceId: null,
    selectedVideoDeviceId: null,
    trackRotation: true,
    schema: 0.1
  }

  const urlParams = new URLSearchParams(window.location.search)

  let Videos = [
    { label: 'Default', url: 'https://assets.soundstage.fm/vr/Default.mp4' },
    { label: 'Intro', url: 'https://assets.soundstage.fm/vr/Intro.mp4' },
    { label: 'Abyss', url: 'https://assets.soundstage.fm/vr/Abyss.mp4' },
    { label: 'Beat Swiper', url: 'https://assets.soundstage.fm/vr/beat-swiper.mp4' },
    { label: 'Disco 1', url: 'https://assets.soundstage.fm/vr/Disco-1.mp4' },
    { label: 'Disco 2', url: 'https://assets.soundstage.fm/vr/Disco-2.mp4' },
    { label: 'Flamboyant Lines', url: 'https://assets.soundstage.fm/vr/flamboyant-lines.mp4' },
    { label: 'Loop 1', url: 'https://assets.soundstage.fm/vr/Loop-1.mp4' },
    { label: 'Megapixel', url: 'https://assets.soundstage.fm/vr/Megapixel.mp4' },
    { label: 'Neon Beams', url: 'https://assets.soundstage.fm/vr/Neon.mp4' },
    { label: 'Reactor', url: 'https://assets.soundstage.fm/vr/Reactor.mp4' },
    { label: 'Waves', url: 'https://assets.soundstage.fm/vr/Retro-1.mp4' },
    { label: 'Retro', url: 'https://assets.soundstage.fm/vr/Retro-2.mp4' },
    { label: 'Split Sphere', url: 'https://assets.soundstage.fm/vr/split-sphere.mp4' },
    { label: 'Tiler', url: 'https://assets.soundstage.fm/vr/Color-Tiler.mp4' },
    { label: 'Trails', url: 'https://assets.soundstage.fm/vr/Cube-Trails.mp4' },
    { label: 'Ultra', url: 'https://assets.soundstage.fm/vr/Ultra.mp4' },
  ]

  export default {
    name: 'App',
    components: {
      InvalidEvent
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
        showingVideos: false,
        cubeTextures: [],
        moodSets: []
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
      if(browser().name !== 'chrome') {
        this.browserSupported = false;
        return;
      }

      /* Set event configuration */
      await this.initConfig();
      if(this.eventConfig) {
        this.canBroadcast = this.eventConfig.permissions['broadcast'] === true;
        if (this.eventConfig.permissions['stage_controls']) {
          this.showStageControls = true;
          this.cameraModes.push(['free', 'Free Cam'])
        }
      }

      this.deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'other'
      if (this.deviceType === 'mobile') {
        return
      }

      if(!this.eventConfig) {
        return;
      }
      /* Preload default video only (just so it's ready on scene start) */
      this.preloadVideos(true)

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
      preloadVideos: async (loadDefault = false) => {

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

        for (let video of Videos) {
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
                img.src = `/assets/emojis/${emoji.name}.png`
                img.onclick = (e) => {
                  var name = e.target.name
                  emojis.play(name)
                  canvas.focus() // don't forget
                }

                document.getElementById('emojis').appendChild(img)
              }
            })

            world.initStageControls((config) => {
              this.videos = config.videos
              this.moodSets = this.world.stageControls.moodSets;
              this.cubeTextures = this.world.stageControls.cubeTextures;
            })

            world.connect(
              userName, fps, this.userSettings.selectedAudioDeviceId, this.userSettings.selectedPlaybackDeviceId, () => {
                /* Preload remaining videos */
                this.preloadVideos()
              })

          }).then((s) => {
            scene = s
            world.showVideo(this.eventConfig.avatar ? this.eventConfig.avatar : "https://assets.soundstage.fm/vr/avatar_default.png") // initialize own avatar
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
      saveSettings: async function () {
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

        if (needsRefresh) {
          var confirmed = confirm('To apply these changes we need to restart the application, do you want to continue?')
          if (confirmed) {
            /* Always save enableStereo false to localStorage */
            await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false } }))
            window.location.reload()
          }
        } else {
          /* Always save enableStereo false to localStorage */
          await localStorage.setItem('userSettings', JSON.stringify({ ...this.userSettings, ...{ enableStereo: false } }))
          console.log('saved', await localStorage.getItem('userSettings'))
          userSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.cachedUserSettings = JSON.parse(JSON.stringify(this.userSettings))
          this.world.userSettings = this.userSettings;

          /* Reconnect to hifi after everythings settled */
          if (needsAudioRenegotiation) {
            world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.selectedPlaybackDeviceId)
          }

          this.showSettings = false
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
          world.connectHiFi(this.userSettings.selectedAudioDeviceId, this.userSettings.selectedPlaybackDeviceId)
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
        background-image: url('./assets/images/splash.jpg');
        opacity: 0.1;
        z-index: -1;
    }

</style>