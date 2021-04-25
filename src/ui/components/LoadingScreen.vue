<template>
    <div class="fixed top-0 left-0 w-full min-h-screen z-10 bg-alt-primary" id="progress-splash">
        <div class="splash"></div>

        <div class="w-full min-h-screen flex flex-col items-center justify-center">
            <div class="w-full flex flex-col items-center">
                <img class="block h-24 w-auto" src="../../assets/images/logo-badge.svg">
                <div class="mt-8 h-5 w-96 text-sm text-center m-auto rounded-lg progress-bar-wrapper relative">
                    <div class="absolute top-0 left-0 h-5 text-sm m-auto  rounded-lg inline-block"
                         id="main-progress-bar">
                    </div>
                    <div class="absolute top-0 left-0 w-96 text-gray-300">Loading...</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: "LoadingScreen"
}
</script>