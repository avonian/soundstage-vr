export class StageControls {
  constructor (displays, callback, userSettings, world) {
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
    this.world.worldManager.VRSPACE.sendMy('stageEvent', event);
  }
  play( videoIndex ) {
    let playTableEvent = { action: 'playVideo', target: "WindowVideo", videoIndex: videoIndex };
    this.world.properties.WindowVideo = videoIndex;
    this.executeAndSend(playTableEvent);

    let playWindowEvent = { action: 'playVideo', target: "DJTableVideo", videoIndex: videoIndex };
    this.world.properties.DJTableVideo = videoIndex;
    this.executeAndSend(playWindowEvent);
    this.world.shareProperties();
  }
  cast( userId ) {
    let castUserEvent = { action: 'castUser', target: "WindowVideo", userId: userId };
    this.world.properties.castUser = userId;
    this.executeAndSend(castUserEvent);
    this.world.shareProperties();
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
      } else {
        console.log("WARNING - can't stream video of "+userId);
      }
    }
  }
  playUserVideo(userId, target) {
    let video = this.fetchPeerVideoElement(userId);
    if(video) {
      this.world.initializeDisplays(video, [target]);
      this.userBeingCasted = userId;
      console.log("streaming video of "+userId);
    } else {
      console.log("WARNING - can't stream video of "+userId);
    }
  }
}

export default StageControls;