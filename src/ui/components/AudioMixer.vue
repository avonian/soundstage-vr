<template>
    <div class="flex flex-row px-3 py-4 faders rounded-lg">
        <div class="flex flex-col items-center mr-3">
            <input id="voiceVolume" type="range" min="0" max="100"
                   class="slider flex-grow"
                   :value="parseInt(userSettings.voiceVolume)"
                   @change="$emit('setVolume', { key: 'voice', value: $event.target.value });">
            <div class="font-medium mt-2">Voice</div>
        </div>
        <div class="flex flex-col items-center">
            <input id="musicVolume" type="range" min="0" max="100"
                   class="slider flex-grow"
                   :value="parseInt(userSettings.musicVolume)"
                   @change="$emit('setVolume', { key: 'music', value: $event.target.value });">
            <div class="font-medium mt-2">Music</div>
        </div>
    </div>
</template>
<script>
export default {
  name: "AudioMixer",
  props: ['userSettings', 'world']
}
</script>

<style scoped>
    input {
        -webkit-appearance: slider-vertical;
        width: 20px;
        height: 100px;
    }
    .faders {
        background-color: #27273e;
    }
    /*
    .faders {
        opacity: 0.4;
        transition-property: opacity, background-color;
        transition-timing-function: ease-in-out;
        transition-duration: 0.2s;
    }
    .faders:hover {
        background-color: #27273e;
        opacity: 1;
    }
    */
</style>