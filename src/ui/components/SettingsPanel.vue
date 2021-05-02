<template>
    <div class="fixed inset-0 overflow-hidden z-10">
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
                        <div class="settings-title px-4 sm:px-6">
                            <div class="flex items-start justify-between">
                                <h2 id="slide-over-heading" class="text-lg font-medium text-white">
                                    Settings
                                </h2>
                                <div class="ml-3 h-7 flex items-center">
                                    <button class="bg-alt-primary rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            @click="$emit('cancel')">
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
                        <div class="settings-body relative flex-1 px-4 sm:px-6">
                            <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div class="col-span-2">
                                    <label for="audioDevice"
                                           class="block text-sm font-medium leading-5 text-white">
                                        Audio Input Device (Microphone)
                                    </label>
                                    <div class="mt-1 flex rounded-md shadow-sm">
                                        <select v-if="audioDevices.length > 0"
                                                id="audioDevice"
                                                class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                @change="$emit('setUserSettings', { key: 'selectedAudioDeviceId', value: $event.target.value })">
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
                                                <input id="useComputerSound" name="useComputerSound" type="checkbox"
                                                       class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                       @click="$emit('requestComputerSound')"
                                                       :checked="userSettings.useComputerSound"
                                                       @change="$emit('setUserSettings', { key: 'useComputerSound', value: $event.target.checked })">
                                            </div>
                                            <div class="ml-3 text-sm">
                                                <label for="includeAudioInputInMix" class="font-medium text-white">Share computer sound</label>
                                                <p class="text-white">Use this if you are playing music from a DAW or DJ'ing software.</p>
                                                <div class="mt-3" v-if="userSettings.useComputerSound">
                                                    <input id="includeAudioInputInMix" name="includeAudioInputInMix" type="checkbox"
                                                           class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                           :checked="userSettings.includeAudioInputInMix"
                                                           @change="$emit('setUserSettings', { key: 'includeAudioInputInMix', value: $event.target.checked })"> <label for="includeAudioInputInMix" class="font-medium text-white ml-2"> Mix in with audio input device.</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-span-2" v-if="canBroadcast">
                                    <div class="space-y-4">
                                        <div class="relative flex items-start">
                                            <div class="flex items-center h-5">
                                                <input id="enableStereo" name="enableStereo" type="checkbox"
                                                       class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                       :checked="userSettings.enableStereo"
                                                       @change="$emit('setUserSettings', { key: 'enableStereo', value: $event.target.checked })">
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
                                               :value="parseInt(userSettings.stereoGainBoost)"
                                               @change="$emit('setUserSettings', { key: 'stereoGainBoost', value: $event.target.value })">
                                        <span class="w-12 text-center">{{ userSettings.stereoGainBoost }}%</span>
                                    </div>
                                </div>
                                <div class="col-span-2" v-show="playbackDevices.length > 0">
                                    <label for="audioDevice"
                                           class="block text-sm font-medium leading-5 text-white">
                                        Playback Device (Speakers/Headsets)
                                    </label>
                                    <div class="mt-1 flex rounded-md shadow-sm">
                                        <select v-if="playbackDevices.length > 0"
                                                id="playbackDevice"
                                                class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                v-model="userSettings.selectedPlaybackDeviceId"
                                                @change="$emit('setUserSettings', { key: 'selectedPlaybackDeviceId', value: $event.target.value })">
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
                                        <select v-if="videoDevices.length > 0"
                                                id="videoDevice"
                                                class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                @change="$emit('setUserSettings', { key: 'selectedVideoDeviceId', value: $event.target.value })">
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
                                    <label for="graphicsQuality"
                                           class="block text-sm font-medium leading-5 text-white">
                                        Graphics Quality
                                    </label>
                                    <div class="mt-1 flex rounded-md shadow-sm">
                                        <select id="graphicsQuality"
                                                class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                @change="$emit('setUserSettings', { key: 'graphicsQuality', value: $event.target.value })">
                                            <option v-for="option of graphicsOptions"
                                                    :value='option.value'
                                                    :selected="option.value === userSettings.graphicsQuality"
                                                    :key="option">
                                                {{ option.label }}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-sm font-medium leading-5 text-white">
                                        Video Settings
                                    </label>
                                    <div class="mt-4 space-y-4">
                                        <div class="relative flex items-start">
                                            <div class="flex items-center h-5">
                                                <input id="enableWebcamFeeds" name="enableWebcamFeeds"
                                                       type="checkbox"
                                                       class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                       :checked="userSettings.enableWebcamFeeds"
                                                       @change="$emit('setUserSettings', { key: 'enableWebcamFeeds', value: $event.target.checked })">
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
                                                       :checked="userSettings.enableVisuals"
                                                       @change="$emit('setUserSettings', { key: 'enableVisuals', value: $event.target.checked })">
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
                        <div class="settings-footer flex-shrink-0 px-4 py-4 flex justify-end absolute bottom-0 right-10 w-full bg-alt-primary">
                            <button type="button"
                                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    @click="$emit('cancel')">
                                Cancel
                            </button>
                            <button type="submit"
                                    class="ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    @click="$emit('save')">
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
export default {
  name: "SettingsPanel",
  props: ['audioDevices', 'canBroadcast', 'playbackDevices', 'videoDevices', 'initialUserSettings', 'graphicsOptions'],
  data() {
    return {
      userSettings: false
    }
  },
  mounted() {
    this.userSettings = this.initialUserSettings;
  }
}
</script>