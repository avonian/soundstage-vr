<template>
    <div class="min-h-screen">
        <div class="splash"></div>

        <div class="w-full h-full">
            <div class="w-full flex-shrink-0 flex items-center justify-center pt-16">
                <img class="block h-8 sm:h-10 w-auto" src="../../assets/images/logo-badge.svg">
                <img class="block h-4 sm:h-5 w-auto ml-2" src="../../assets/images/logo-text.svg">
            </div>
            <div class="z-10 inset-0 overflow-y-auto">
                <div class="flex items-end justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6"
                         role="dialog"
                         aria-modal="true"
                         aria-labelledby="modal-headline">
                        <UnsupportedBrowser v-if="!browserSupported"/>
                        <form v-else>
                            <div>
                                <h3 class="text-lg leading-6 font-medium text-white">
                                    Before connecting, please choose your settings:
                                </h3>
                            </div>
                            <div class="mt-6 grid grid-cols-2 gap-y-6 gap-x-4" v-if="userSettings">
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
                                    <label for="audioDevice"
                                           class="block text-sm font-medium leading-5 text-white">
                                        Audio Input Device (Microphone)
                                    </label>
                                    <div class="mt-1 flex rounded-md shadow-sm">
                                        <select id="audioDevice"
                                                class="form-select block w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-alt-primary border rounded-md text-lg p-1"
                                                @change="$emit('setUserSettings', { key: 'selectedAudioDeviceId', value: $event.target.value })"
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
                                                @change="$emit('setUserSettings', { key: 'selectedPlaybackDeviceId', value: $event.target.value })"
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
                                                @change="$emit('setUserSettings', { key: 'selectedVideoDeviceId', value: $event.target.value })"
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
                            <div class="mt-5 sm:mt-6">
                                    <span class="flex w-full rounded-md shadow-sm sm:col-start-2">
                                      <button type="button"
                                              class="gradient-ultra inline-flex justify-center w-full rounded-md px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                              @click="$emit('connect')">
                                        Connect
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

<script>
    import UnsupportedBrowser from './UnsupportedBrowser'
    export default {
      name: "WelcomeScreen",
      components: { UnsupportedBrowser },
      props: ['browserSupported','userSettings', 'audioDevices', 'playbackDevices', 'videoDevices', 'graphicsOptions'],
    }
</script>