export class AdminControls {
  constructor (world) {
    this.world = world;
  }
  toggleUserMic(soundStageUserId) {
    let event = { action: 'toggleUserMic', soundStageUserId: soundStageUserId };
    this.world.worldManager.VRSPACE.sendMy('adminEvent', event);
  }
  toggleUserWebcam(soundStageUserId) {
    let event = { action: 'toggleUserWebcam', soundStageUserId: soundStageUserId };
    this.world.worldManager.VRSPACE.sendMy('adminEvent', event);
  }
  async execute( event ) {
    switch(event.action) {
      case 'toggleUserMic':
        if(event.soundStageUserId === this.world.eventConfig.user_id) {
          if(document.querySelector("#app")._vnode.component.data.micEnabled) {
            document.querySelector("#app")._vnode.component.data.modal = {
              title: "You've been muted.",
              body: "<p class='mb-4'>A moderator has muted your microphone to prevent contaminating the audio space - you may unmute yourself at your discretion.</p><p class='mb-4'>In the future, please be mindful of your volume levels and/or consider muting your microphone when you step away from the computer.</p>"
            }
          }
          document.querySelector("#btn-microphone").click();
        }
        break;
      case 'toggleUserWebcam':
        if(event.soundStageUserId === this.world.eventConfig.user_id) {
          if(document.querySelector("#app")._vnode.component.data.webcamEnabled) {
            document.querySelector("#app")._vnode.component.data.modal = {
              title: "Webcam deactivated.",
              body: "<p class='mb-4'>A moderator has temporarily deactivated your webcam - you may reactivate it at your discretion.</p>"
            }
          }
          document.querySelector("#btn-webcam").click();
        }
        break;
    }
  }
}

export default AdminControls;