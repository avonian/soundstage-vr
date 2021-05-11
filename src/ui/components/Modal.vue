<!-- This example requires Tailwind CSS v2.0+ -->
<template>
    <Dialog as="div" static class="fixed z-10 inset-0 overflow-y-auto" :open="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"/>

            <!-- This element is to trick the browser into centering the modal contents. -->
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                <div class="flex flex-col items-center">
                    <div class="text-center w-full">
                        <DialogTitle as="h3" class="text-lg leading-6 font-medium text-white">
                            {{ title }}
                        </DialogTitle>
                        <div class="mt-4">
                            <div class="text-left" v-html="body">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3" :class="confirmCallback ? 'flex flex-row': ''">
                    <template v-if="confirmCallback">
                        <button type="button" class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-500 text-base font-medium text-white hover:bg-gray-700 focus:outline-none sm:text-sm mr-2"
                            @click="handleCancel">
                            No
                        </button>
                        <button type="button" class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm" @click="confirmCallback">
                            Yes
                        </button>
                    </template>
                    <button type="button" class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm" @click="$emit('close')" v-else>
                        Ok
                    </button>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script>
import {
    Dialog,
    DialogOverlay,
    DialogTitle
} from '@headlessui/vue'

export default {
  props: ['title', 'body', 'confirmCallback', 'cancelCallback'],
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
  },
  methods: {
    handleCancel() {
      if(this.cancelCallback) {
        this.cancelCallback();
      } else {
        this.$emit('close');
      }
    }
  }
}
</script>