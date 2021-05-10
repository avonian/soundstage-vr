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
              <form>
                <div id="disclaimer">
                  <h3 class="text-2xl leading-6 font-medium text-white text-center">You've been banned from the space.</h3>
                  <p class="mt-6 leading-relaxed">A moderator has deemed it necessary to permanently remove you from this space. This was most likely due to conduct violations, but may also have happened at the moderators own discretion.</p>
                  <p class="mt-3 leading-relaxed">If you believe this was done in error or feel the need to dispute this action we ask that you please contact the event organizer(s).</p>
                </div>
                <div class="mt-5 sm:mt-6">
                      <span class="flex w-full rounded-md shadow-sm">
                        <a type="button"
                                class="cursor-pointer gradient-ultra inline-flex justify-center w-full rounded-md px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                                :href="app_url">
                          Return to SoundStage.fm
                        </a>
                      </span>
                </div>
              </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'Banned',
    data() {
      return {
        app_url: process.env.VUE_APP_API_URL
      }
    }
  }
</script>