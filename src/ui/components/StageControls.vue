<template>
    <div class="stage ui-hide">
        <div class="flex items-stretch justify-end pl-12 pt-6 absolute left-0 top-0" v-if="showStageControls">
            <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20"
               :class="activeVideo === i ? 'gradient-ultra' : 'bg-gray-500'"
               v-for="(video, i) of videos" @click="$emit('activateVideo', i)" :key="video">
                {{ video.label }}
            </a>
        </div>
        <div class="flex items-stretch justify-end pl-12 pt-16 absolute left-0 top-0" v-if="showStageControls">
            <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
               :class="showingUserVideos ? 'gradient-ultra' : 'bg-gray-500'"
               @click="$emit('toggleUserVideos')">
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
            <span class="inline-flex" v-if="world && world.cineCam">
                        <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3 z-20 bg-indigo-500"
                           @click="$emit('playCameraAnimations', i)"
                           v-for="i in Object.keys(world.cineCam.animations)" :key="i">
                            {{ i }}
                        </a>
                    </span>
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="moodSet" @change="$emit('changeMood')">
                <option :value=null>None</option>
                <option :value="moodSet" v-for="moodSet of Object.keys(moodSets)" :key="moodSet">{{ moodSet }}</option>
            </select>
            <select class="bg-white text-sm text-black mr-3 rounded-md hidden" id="cubeTexture" @change="$emit('changeCubeTexture')">
                <option :value="cubeTexture" v-for="cubeTexture of Object.keys(cubeTextures)" :key="cubeTexture">{{ cubeTexture }}</option>
            </select>
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="fogSetting" @change="$emit('changeFog')">
                <option :value="setting" v-for="setting of Object.keys(fogSettings)" :key="setting">{{ setting }}</option>
            </select>
            <select class="bg-white text-sm text-black mr-3 rounded-md" @change="$emit('changeDJSpotLightIntensity', $event.target.value)">
                <option :value="setting" v-for="setting of [0, 0.1, 0.2, 0.5]" :selected="setting === DJSpotLightIntensity" :key="setting">{{ setting }}</option>
            </select>
            <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
               :class="tunnelLightsOn ? 'gradient-ultra' : 'bg-gray-500'"
               @click="$emit('toggleTunnelLights')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </a>
            <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
               :class="gridFloorOn ? 'gradient-ultra' : 'bg-gray-500'"
               @click="$emit('toggleGridFloor')">
                Grid Floor
            </a>
            <div class="flex items-center text-lg">Save state: <input type="checkbox" id="saveState" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded ml-2"></div>
        </div>
    </div>
</template>

<script>
    export default {
      name: "StageControls",
      props: ['showStageControls', 'activeVideo', 'world', 'videos', 'cubeTextures', 'fogSettings', 'moodSets', 'showingUserVideos', 'DJSpotLightIntensity', 'tunnelLightsOn', 'gridFloorOn']
    }
</script>