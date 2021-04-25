<template>
    <div class="fixed z-10 inset-0 overflow-y-auto min-h-screen">
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
                        <img src="../../assets/images/keyboard-map.png"/>
                    </div>
                </div>
                <div class="mt-5 sm:mt-6">
                    <button type="button"
                            class="gradient-ultra inline-flex justify-center w-full rounded-md px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            @click="$emit('continue')">Continue
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: "QuickStart"
}
</script>