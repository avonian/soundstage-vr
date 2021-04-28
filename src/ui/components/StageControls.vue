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
            <select class="bg-white text-sm text-black mr-3 rounded-md" @change="$emit('changeDjSpotLightIntensity', $event.target.value)">
                <option :value="setting" v-for="setting of [0, 0.1, 0.2, 0.5]" :selected="setting === DJSpotLightIntensity" :key="setting">{{ setting }}</option>
            </select>
        </div>
    </div>
</template>

<script>
    export default {
      name: "StageControls",
      props: ['showStageControls', 'activeVideo', 'world', 'videos', 'cubeTextures', 'fogSettings', 'moodSets', 'showingUserVideos', 'DJSpotLightIntensity']
    }
</script>