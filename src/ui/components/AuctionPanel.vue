<template>
    <!-- This example requires Tailwind CSS v2.0+ -->
    <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16 transition delay-150 duration-300 ease-in-out z-50 opacity-0" id="auction-panel">
        <!--
          Slide-over panel, show/hide based on slide-over state.

          Entering: "transform transition ease-in-out duration-500 sm:duration-700"
            From: "translate-x-full"
            To: "translate-x-0"
          Leaving: "transform transition ease-in-out duration-500 sm:duration-700"
            From: "translate-x-0"
            To: "translate-x-full"
        -->
        <div class="w-screen max-w-md">
            <div class="h-full flex flex-col bg-alt-primary shadow-xl overflow-y-scroll">
                <div class="px-4 py-6 sm:px-6">
                    <div class="flex items-start justify-between">
                        <h2 id="slide-over-heading" class="text-lg font-medium text-white">
                            NFT Showcase
                        </h2>
                        <div class="ml-3 h-7 flex items-center">
                            <button class="rounded-md text-white">
                                <span class="sr-only">Close panel</span>
                                <!-- Heroicon name: outline/x -->
                                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Main -->
                <div>
                    <div class="pb-1 sm:pb-6">
                        <div>
                            <div class="relative h-80">
                                <img class="absolute h-full w-full object-cover" src="https://assets.soundstage.fm/vr/cryptowaves/Protons_Neutrons.png" alt="">
                            </div>
                            <div class="mt-6 px-4 sm:mt-8 sm:flex sm:items-end sm:px-6">
                                <div class="sm:flex-1">
                                    <div>
                                        <div class="flex items-center">
                                            <h3 class="font-bold text-xl text-white sm:text-2xl">Protons & Neutrons</h3>
                                        </div>
                                        <p class="text-sm text-purple-700">@luigitasso</p>
                                    </div>
                                    <div class="flex items-center"><div class="font-normal text-white mt-3">Current Bid: <span class="font-bold">0.15 ETH</span></div></div>
                                    <div class="mt-4 flex flex-wrap space-y-3 sm:space-y-0 sm:space-x-3">
                                        <button type="button" class="flex-shrink-0 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:flex-1">
                                            Place a Bid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="px-4 pt-5 pb-5 sm:px-0 sm:pt-0">
                        <dl class="space-y-8 px-4 sm:px-6 sm:space-y-6">
                            <div>
                                <dt class="font-medium text-white sm:w-40 sm:flex-shrink-0">
                                    Description
                                </dt>
                                <dd class="mt-1 text-gray-200 sm:col-span-2">
                                    <p>
                                        Protons & Neutrons is an audiovisual NFT from Luigi Tasso that's being auctioned off this month as part of a larger effort to raise awareness on environmental issues. Visit the live auction to learn more.
                                    </p>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
}
</script>