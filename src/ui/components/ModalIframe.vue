<template>
    <div class="modal-iframe fixed z-10 inset-0 overflow-y-auto min-h-screen">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

            <div class="fixed inset-0 transition-opacity" aria-hidden="true" v-if="withOverlay">
                <div class="absolute inset-0 bg-gray-800 opacity-75"></div>
            </div>

            <!-- This element is to trick the browser into centering the modal contents. -->
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-top w-full max-w-6xl mt-6">
                <div class="bg-alt-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all p-3"
                     role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                    <iframe width="100%" height="100%" :src="url"></iframe>
                </div>
                <button type="button"
                        class="mt-6 bg-indigo-800 inline-flex justify-center rounded-md px-4 py-2 text-2xl leading-6 text-medium text-white shadow-sm"
                        @click="$emit('close')">
                    {{ closeLabel ? closeLabel : 'Close' }}
                </button>
            </div>

        </div>
    </div>
</template>

<script>
  export default {
    name: "ModalIframe",
    props: ['url', 'withOverlay', 'closeLabel'],
    mounted() {
      document.querySelector('.modal-iframe iframe').focus();
    },
    unmounted () {
      document.getElementById('renderCanvas').focus();
    }
  }
</script>

<style scoped>
iframe {
    height: 85vh;
}
</style>