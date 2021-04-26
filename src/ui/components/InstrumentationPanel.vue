<template>
    <div class="fixed left-12 bottom-32">
        <table border="0">
            <tr>
                <td class="font-medium pr-2">Total Meshes</td>
                <td id="info-total-meshes"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Total Materials</td>
                <td id="info-total-materials"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Total Textures</td>
                <td id="info-total-textures"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Total Video Textures</td>
                <td id="info-total-videotextures"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Total Animations</td>
                <td id="info-total-animations"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Draw Calls</td>
                <td id="info-draw-calls"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Scene Frame Time</td>
                <td id="info-frame-time"></td>
                <td id="info-frame-time-max"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Delta Time</td>
                <td id="info-frame-delta-time"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Active Meshes Eval Time</td>
                <td id="info-eval-time"></td>
                <td id="info-eval-time-max"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Particles Render Time</td>
                <td id="info-particles-time"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Inter Frame Time</td>
                <td id="info-inter-frame"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">GPU Frame Time</td>
                <td id="info-gpuframe-time"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Shader Compilation Time</td>
                <td id="info-shader-time"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Total Compiled Shaders</td>
                <td id="info-compiled-shaders"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Frame Render Time</td>
                <td id="info-render-time"></td>
                <td class="font-medium pr-2">Heap Used</td>
                <td id="info-heap-size"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">Camera Render Time</td>
                <td id="info-camera-time"></td>
                <td class="font-medium pr-2">Heap Total</td>
                <td id="info-heap-total"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">RenderTargets Time</td>
                <td id="info-targets-time"></td>
                <td class="font-medium pr-2">Heap Limit </td>
                <td id="info-heap-limit"></td>
            </tr>
            <tr>
                <td class="font-medium pr-2">FPS </td>
                <td id="info-fps-time"></td>
            </tr>
        </table>
        <table border="0">
            <tr>
                <td class="font-medium pr-2">Dummies</td>
                <td>
                    <select class="text-black bg-white" v-model="dummyCount" @click="createDummies">
                        <option>0</option>
                        <option>5</option>
                        <option>10</option>
                        <option>15</option>
                        <option>20</option>
                        <option>25</option>
                        <option>30</option>
                        <option>35</option>
                        <option>40</option>
                    </select>
                    <select class="text-black bg-white ml-2" v-model="dummyQuality" @click="createDummies">
                        <option value="qvga-15">QVGA 15 FPS (320)</option>
                        <option value="vga-15">VGA 15 FPS (480)</option>
                        <option value="hd-15">HD 15 FPS (720)</option>
                        <option value="hd-30">HD 30 FPS (720)</option>
                    </select>
                </td>
            </tr>
            <tr v-if="showCameraPosition">
                <td class="font-medium pr-2">Camera Position</td>
                <td id="info-camera-position"><input type="text" size="30" class="cursor-pointer text-black" @click="copyMe($event)"></td>
            </tr>
            <tr v-else>
                <td class="font-medium pr-2" colspan="2"><button class="bg-gray-500 cursor-pointer rounded-md px-2 py-1 mt-1" @click="showCameraPosition = true">Show camera position</button></td>
            </tr>
        </table>
    </div>
</template>

<script>
    export default {
      name: "InstrumentationPanel",
      props: ['debugging', 'world'],
      data() {
        return {
          dummyCount: 0,
          dummyQuality: 'qvga-15',
          showCameraPosition: false
        }
      },
      mounted() {
        var world = this.world;
        var scene = world.scene;
        var engine = world.engine;
        // Instrumentation debugging tool
        let sceneInstrumentation = new BABYLON.SceneInstrumentation(scene);
        sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
        sceneInstrumentation.captureFrameTime = true;
        sceneInstrumentation.captureParticlesRenderTime = true;
        sceneInstrumentation.captureRenderTime = true;
        sceneInstrumentation.captureCameraRenderTime = true;
        sceneInstrumentation.captureRenderTargetsRenderTime = true;
        sceneInstrumentation.captureInterFrameTime = true;
        let engineInstrumentation = new BABYLON.EngineInstrumentation(engine);
        engineInstrumentation.captureGPUFrameTime = true;
        engineInstrumentation.captureShaderCompilationTime = true;
        function videoTextureCount() {
          let videoTextureCounter = 0;
          for (let i = 0; i < scene.textures.length; i++) {
            if (scene.textures[i].video) {
              videoTextureCounter++;
            }
          }
          return videoTextureCounter;
        }
        function checkDeltaTime() {
          if (scene.deltaTime) {
            return scene.deltaTime.toFixed();
          }
        }
        scene.registerAfterRender(() => {
          document.querySelector('#info-total-meshes').innerHTML = scene.meshes.length;
          document.querySelector('#info-total-materials').innerHTML = scene.materials.length;
          document.querySelector('#info-total-textures').innerHTML = scene.textures.length;
          document.querySelector('#info-total-videotextures').innerHTML = videoTextureCount().toString();
          document.querySelector('#info-total-animations').innerHTML = scene.animatables.length;
          document.querySelector('#info-draw-calls').innerHTML = sceneInstrumentation.drawCallsCounter.current;
          document.querySelector('#info-frame-time').innerHTML = sceneInstrumentation.frameTimeCounter.current.toFixed();
          document.querySelector('#info-frame-time-max').innerHTML = sceneInstrumentation.frameTimeCounter.lastSecAverage.toFixed(2);
          document.querySelector('#info-frame-delta-time').innerHTML = checkDeltaTime();
          document.querySelector('#info-eval-time').innerHTML = sceneInstrumentation.activeMeshesEvaluationTimeCounter.current.toFixed();
          document.querySelector('#info-eval-time-max').innerHTML = sceneInstrumentation.activeMeshesEvaluationTimeCounter.lastSecAverage.toFixed(2);
          document.querySelector('#info-particles-time').innerHTML = sceneInstrumentation.particlesRenderTimeCounter.current.toFixed(2);
          document.querySelector('#info-inter-frame').innerHTML = sceneInstrumentation.interFrameTimeCounter.lastSecAverage.toFixed();
          document.querySelector('#info-gpuframe-time').innerHTML = (engineInstrumentation.gpuFrameTimeCounter.average * 0.000001).toFixed(2);
          document.querySelector('#info-shader-time').innerHTML = engineInstrumentation.shaderCompilationTimeCounter.current.toFixed(2);
          document.querySelector('#info-compiled-shaders').innerHTML = engineInstrumentation.shaderCompilationTimeCounter.count;
          document.querySelector('#info-render-time').innerHTML = sceneInstrumentation.renderTimeCounter.current.toFixed();
          document.querySelector('#info-camera-time').innerHTML = sceneInstrumentation.cameraRenderTimeCounter.current.toFixed();
          document.querySelector('#info-targets-time').innerHTML = sceneInstrumentation.renderTargetsRenderTimeCounter.current.toFixed();
          document.querySelector('#info-fps-time').innerHTML = engine.getFps().toFixed() + " fps";
          document.querySelector('#info-heap-size').innerHTML = ((performance.memory.usedJSHeapSize / 1024) / 1024).toFixed() + " Mb";
          document.querySelector('#info-heap-total').innerHTML = ((performance.memory.totalJSHeapSize / 1024) / 1024).toFixed() + " Mb";
          document.querySelector('#info-heap-limit').innerHTML = ((performance.memory.jsHeapSizeLimit / 1024) / 1024).toFixed() + " Mb";

          if(this.showCameraPosition) {
            let cameraVars = {
              '1p': 'camera1',
              '3p':  'camera3',
              'free': 'cameraFree'
            }
            var camPosition = world[cameraVars[world.activeCameraType]].position;
            var simplifiedCamPos = {};
            simplifiedCamPos._x = camPosition._x.toFixed(2);
            simplifiedCamPos._y = camPosition._y.toFixed(2);
            simplifiedCamPos._z = camPosition._z.toFixed(2);
            delete camPosition._isDirty;
            document.querySelector('#info-camera-position input').value = JSON.stringify(simplifiedCamPos);
          }
        });
      },
      methods: {
        createDummies() {
          this.world.createDummies(this.dummyCount, this.dummyQuality)
        },
        copyMe(event) {
          event.target.select();
          document.execCommand("copy")
        }
      }
    }
</script>