<template>
    <div class="fixed w-64 h-48 right-12 top-12 rounded-lg ui-hide">
        <div class="absolute top-0 right-0 bg-indigo-500 mt-2 mr-2 px-3 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer"
             @click="$emit('castSelf')" v-show="showStageControls">CAST
        </div>
        <video playsinline autoplay class="vid local rounded-lg" id="localVideo"></video>
    </div>
</template>

<script>
export default {
  name: "LocalCamera",
  props: ['showStageControls']
}
</script>