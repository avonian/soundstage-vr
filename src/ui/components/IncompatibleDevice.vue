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
                        <div class="text-white">
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="laptop"
                                 class="svg-inline--fa fa-laptop w-20 fa-w-20 text-gray-400 mx-auto" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                <path fill="currentColor"
                                      d="M624 352h-48V64c0-35.2-28.8-64-64-64H128C92.8 0 64 28.8 64 64v288H16c-8.8 0-16 7.2-16 16v48c0 52.8 43.2 96 96 96h448c52.8 0 96-43.2 96-96v-48c0-8.8-7.2-16-16-16zM112 64c0-8.67 7.33-16 16-16h384c8.67 0 16 7.33 16 16v288H112V64zm480 352c0 26.47-21.53 48-48 48H96c-26.47 0-48-21.53-48-48v-16h180.9c5.57 9.39 15.38 16 27.1 16h128c11.72 0 21.52-6.61 27.1-16H592v16z"></path>
                            </svg>
                            <h3 class="text-3xl font-medium mt-6 w-full text-center mb-6">
                                Please switch to a laptop/desktop.
                            </h3>
                            <p class="text-lg mb-4 leading-relaxed">
                                Mobile support is coming soon but is not available at this time.
                            </p>
                            <p class="text-lg mb-4 leading-relaxed">
                                We apologize for the inconvenience and invite you to try again from a laptop or desktop
                                computer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
      name: "IncompatibleDevice"
    }
</script>