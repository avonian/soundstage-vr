export class StageControls {
  constructor (displays, position, callback, userSettings, world) {
    this.displays = displays;
    this.callback = callback;
    this.videos = world.videos;
    this.userSettings = userSettings;
    this.world = world;
    this.userBeingCasted = false;
  }
  init () {
    if (this.callback) {
      this.callback(this);
    }
  }
  executeAndSend(event) {
    this.execute(event);
    this.world.worldManager.VRSPACE.sendMy('properties', {stageEvent: event});
  }
  play( videoIndex ) {
    let playTableEvent = { action: 'playVideo', target: "WindowVideo", videoIndex: videoIndex };
    this.executeAndSend(playTableEvent);

    let playWindowEvent = { action: 'playVideo', target: "DJTableVideo", videoIndex: videoIndex };
    this.executeAndSend(playWindowEvent);
  }
  cast( userId ) {
    let castUserEvent = { action: 'castUser', target: "WindowVideo", userId: userId };
    this.executeAndSend(castUserEvent);
  }
  fetchPeerVideoElement(peerid) {
    let videos = document.querySelectorAll('video')
    for(var video of videos) {
      if(video.getAttribute('peerid') === peerid) {
        return video;
      }
    }
    return false;
  }
  async execute( event ) {
    if(!this.userSettings.enableVisuals) {
      return;
    }
    /* If a user was being casted continue playing the video element since initializeDisplays will have paused it when disposing previous textures */
    let resumeUserPlayback = this.userBeingCasted;

    switch(event.action) {
      case 'playVideo':
        this.world.initializeDisplays(this.videos[event.videoIndex].url, [event.target]);
        this.userBeingCasted = false;
        break;
      case "castUser":
        let video = this.fetchPeerVideoElement(event.userId);
        if(video) {
          this.world.initializeDisplays(video, [event.target]);
          this.userBeingCasted = event.userId;
        }
        break;
    }

    if(resumeUserPlayback) {
      let video = this.fetchPeerVideoElement(resumeUserPlayback);
      if(video) {
        video.play();
      }
    }
  }
}

export default StageControls;