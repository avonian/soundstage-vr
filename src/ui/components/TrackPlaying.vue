<template>
    <div class="fixed flex justify-center items-center h-14 bottom-0 w-full transform transition ease-in-out duration-500 sm:duration-700 z-50 -translate-y-12 ui-hide translate-y-full" id="track-panel">
        <!--
          Slide-over panel, show/hide based on slide-over state.

          Entering: "transform transition ease-in-out duration-500 sm:duration-700"
            From: "translate-x-full"
            To: "translate-x-0"
          Leaving: "transform transition ease-in-out duration-500 sm:duration-700"
            From: "translate-x-0"
            To: "translate-x-full"
        -->
        <div class="flex flex-row shadow-xl overflow-y-hidden w-full gradient-ultra p-1 rounded-lg">
            <div class="flex flex-col flex-grow p-1 px-2 bg-alt-primary text-lg">
                <span class="font-bold">Currently playing</span>
                <span>{{ currentTrack.name }}</span>
            </div>
            <div class="flex flex-row p-1 px-2 gap-x-6 bg-alt-primary items-center pr-6">
                <a :href="link.url" target="_blank" v-for="link of currentTrack.links" :key="link"><img :src="'/assets/icons/icon_' + link.name + '.png'" class="h-8"></a>
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    props: ['currentTrack']
  }
</script>

<style>
    #track-panel {
        width: 700px;
        left: calc((100% - 700px) / 2);
    }
</style>