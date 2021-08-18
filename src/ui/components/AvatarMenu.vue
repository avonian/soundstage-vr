<!-- This example requires Tailwind CSS v2.0+ -->
<template>
    <Dialog as="div" static class="fixed z-10 inset-0 overflow-y-auto" :open="open">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"/>

            <!-- This element is to trick the browser into centering the modal contents. -->
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-alt-primary rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xs sm:w-full sm:p-6">
                <div class="flex flex-col items-center">
                    <img :src="avatar" class="mx-auto h-32 w-32 rounded-full border-4 border-purple-600" aria-hidden="true" />
                    <div class="text-center mt-3 w-full">
                        <DialogTitle as="h3" class="text-lg leading-6 font-medium text-white">
                            {{ soundStageUserAlias }}
                        </DialogTitle>
                        <button type="button" class="inline-flex justify-center items-center w-full rounded-md shadow-sm px-4 py-2 gradient-ultra text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" data-v-3a75c4a2="" tabindex="-1" @click="$emit('followUser', { user: soundStageUserId, value: is_following !== true })" v-if="is_following">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="white" viewBox="0 0 24 24" stroke="currentColor" data-v-3a75c4a2="">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" data-v-3a75c4a2=""></path>
                            </svg> Following
                        </button>
                        <button type="button" class="inline-flex justify-center items-center w-full rounded-md border border-2 shadow-sm px-4 py-2 bg-alt-primary text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" data-v-3a75c4a2="" tabindex="-1" @click="$emit('followUser', { user: soundStageUserId, value: follows[soundStageUserId] !== true })" v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-v-3a75c4a2="">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" data-v-3a75c4a2=""></path>
                            </svg> Follow
                        </button>
                        <div class="mt-2">
                            <div class="text-left">
                                <ul class="mt-2 divide-y divide-gray-200">
                                    <SwitchGroup as="li" class="py-4 flex justify-between">
                                        <div class="flex flex-col">
                                            <SwitchLabel as="p" class="text-sm font-medium text-white" passive>
                                                Mute User
                                            </SwitchLabel>
                                            <SwitchDescription class="text-sm text-white">
                                                Disable any sounds coming from this user.
                                            </SwitchDescription>
                                        </div>
                                        <Switch :value="is_muted" @click="$emit('muteUser', { user: soundStageUserId, value: is_muted !== true })" :class="[is_muted ? 'bg-red-600' : 'bg-gray-200', 'ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-blue-500']" tabindex="-1">
                                            <span class="sr-only">Use setting</span>
                                            <span aria-hidden="true" :class="[is_muted ? 'translate-x-5' : 'translate-x-0', 'inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200']" />
                                        </Switch>
                                    </SwitchGroup>
                                    <SwitchGroup as="li" class="py-4 flex justify-between">
                                        <div class="flex flex-col">
                                            <SwitchLabel as="p" class="text-sm font-medium text-white" passive>
                                                Block User
                                            </SwitchLabel>
                                            <SwitchDescription class="text-sm text-white">
                                                Stop seeing or hearing this user in this and any other events.
                                            </SwitchDescription>
                                        </div>
                                        <Switch @click="$emit('blockUser', soundStageUserId)" class="bg-gray-200 ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-blue-500" tabindex="-1">
                                            <span class="sr-only">Use setting</span>
                                            <span aria-hidden="true" class="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
                                        </Switch>
                                    </SwitchGroup>
                                    <div class="flex flex-col" v-if="canModerate">
                                        <button type="button" class="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-purple-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" @click="$emit('adminOpenChatbox', soundStageUserId)" tabindex="-1">
                                            Open Chatbox
                                        </button>
                                        <button type="button" class="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-purple-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" @click="$emit('adminToggleMicrophone', soundStageUserId)" tabindex="-1">
                                            Toggle Microphone
                                        </button>
                                        <button type="button" class="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-purple-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" @click="$emit('adminToggleWebcam', soundStageUserId)" tabindex="-1">
                                            Toggle Webcam
                                        </button>
                                        <button type="button" class="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-purple-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" @click="$emit('adminKickUser', soundStageUserId)" tabindex="-1">
                                            Kick User
                                        </button>
                                        <button type="button" class="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-purple-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm mt-3" @click="$emit('adminBanUser', soundStageUserId)" tabindex="-1">
                                            Ban User
                                        </button>
                                    </div>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <button type="button" class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm" @click="$emit('close')">
                        Close
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
    DialogTitle,
    Switch,
    SwitchGroup,
    SwitchLabel,
    SwitchDescription
} from '@headlessui/vue'

export default {
    components: {
        Dialog,
        DialogOverlay,
        DialogTitle,
        Switch,
        SwitchGroup,
        SwitchLabel,
        SwitchDescription
    },
    props: ['world', 'clientId', 'follows', 'mutelist', 'canModerate'],
    data() {
        return {
            soundStageUserAlias: '',
            soundStageUserId: '',
            soundStageUserRole: '',
            avatar: '',
            open: true
        }
    },
    computed: {
      is_following() {
        return this.follows.indexOf(this.soundStageUserId) !== -1;
      },
      is_muted() {
        return this.mutelist.indexOf(this.soundStageUserId) !== -1;
      }
    },
    mounted() {
        this.world.worldManager.VRSPACE.scene.forEach(c => {
            if (c.className === "Client" && parseInt(c.id) === parseInt(this.clientId)) {
                    this.soundStageUserId = c.properties.soundStageUserId;
                    this.soundStageUserAlias = c.properties.soundStageUserAlias;
                    this.soundStageUserRole = c.properties.soundStageUserRole;
                    this.avatar = c.properties.altImage;
                }
            });
        }
    }
</script>

<style scoped>
    #avatar-menu {
        height: 200px;
        width: 300px;
        left: calc(50% - 150px);
        top: calc(50% - 100px);
        box-shadow: 0px 0px 15px 8px #5a1aa0;
    }
</style>