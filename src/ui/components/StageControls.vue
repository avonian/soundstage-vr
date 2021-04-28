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
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="cubeTexture" @change="$emit('changeCubeTexture')">
                <option :value="cubeTexture" v-for="cubeTexture of Object.keys(cubeTextures)" :key="cubeTexture">{{ cubeTexture }}</option>
            </select>
            <select class="bg-white text-sm text-black mr-3 rounded-md" id="fogSetting" @change="$emit('changeFog')">
                <option :value="setting" v-for="setting of Object.keys(fogSettings)" :key="setting">{{ setting }}</option>
            </select>
            <a class="cursor-pointer glow-dark flex items-center justify-center px-2 py-1 text-sm rounded-lg text-white mr-3"
               :class="DJSpotLightIntensity > 0 ? 'gradient-ultra' : 'bg-gray-500'"
               @click="$emit('changeDjSpotLightIntensity', DJSpotLightIntensity > 0 ? 0 : 0.5)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                </svg>
            </a>
        </div>
    </div>
</template>

<script>
    export default {
      name: "StageControls",
      props: ['showStageControls', 'activeVideo', 'world', 'videos', 'cubeTextures', 'fogSettings', 'moodSets', 'showingUserVideos', 'DJSpotLightIntensity']
    }
</script>