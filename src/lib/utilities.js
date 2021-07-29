export default {
  preloadRequest: false,
  async preloadVideo(video) {
    var self = this;
    return new Promise((resolve, reject) => {
      self.preloadRequest = new XMLHttpRequest()
      self.preloadRequest.open('GET', video.url, true)
      self.preloadRequest.responseType = 'blob'
      self.preloadRequest.onload = function () {
        // Onload is triggered even on 404
        // so we need to check the status code
        if (this.status === 200) {
          var videoBlob = this.response
          video.url = URL.createObjectURL(videoBlob) // IE10+
          resolve(video.url)
        }
      }
      self.preloadRequest.onerror = function () {
        // Error
      }
      self.preloadRequest.send()
    })
  },
  showHideUI(hide = true) {
    var controls = document.body.querySelectorAll(".ui-hide");
    for(var el of controls) {
      if(hide) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    }
  },
  bindMeshAction(scene, camera, mesh, onFocus, onBlur, onClick, overrideDestinationPosition) {
    mesh.isPickable = true;
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            var dest = new BABYLON.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
            if(overrideDestinationPosition) {
              dest = new BABYLON.Vector3(overrideDestinationPosition.x, overrideDestinationPosition.y, overrideDestinationPosition.z);
            }
            var pos = camera.position.clone();
            var distance = dest.subtract(pos).length();
            if (distance < 4) {
              scene.highlightLayer1.addMesh(pickedMesh, BABYLON.Color3.Teal());
              if(onFocus) {
                onFocus();
              }
            }
          })
      )
    mesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger, (event) => {
            let pickedMesh = event.meshUnderPointer;
            scene.highlightLayer1.removeMesh(pickedMesh, BABYLON.Color3.Teal());
            if(onBlur) {
              onBlur();
            }
          })
      )
    mesh.actionManager
      .registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger, (event) => {
            var dest = new BABYLON.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
            if(overrideDestinationPosition) {
              dest = new BABYLON.Vector3(overrideDestinationPosition.x, overrideDestinationPosition.y, overrideDestinationPosition.z);
            }
            var pos = camera.position.clone();
            var distance = dest.subtract(pos).length();
            if ( distance < 4 ) {
              onClick();
            }
          })
      )
  }
}