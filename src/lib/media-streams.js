import mediasoup from './mediasoup';
import { MediaStreams } from './vrspace/index-min';

export class MediaSoup extends MediaStreams {

  constructor(world, htmlElementName, userSettings, spaceConfig) {
    super(world.scene, htmlElementName);
    this.world = world;
    this.userSettings = userSettings;
    this.spaceConfig = spaceConfig;
  }

  addANewVideoElement(track, isLocal, peerId= false) {
    if (isLocal) {
      document.querySelector("#localVideo").srcObject = new MediaStream([track]);
      document.querySelector("#localVideo").setAttribute('peerId', this.worldManager.VRSPACE.me.id);
    }

    const newVideoElement = document.createElement("video");
    newVideoElement.muted = true;
    newVideoElement.playsInline = true;
    newVideoElement.autoplay = true;
    newVideoElement.controls = true;
    newVideoElement.srcObject = new MediaStream([track]);
    newVideoElement.classList.add("vid");
    const mainVideoContainer = document.getElementById(this.htmlElementName);
    const videoDiv = document.createElement('div');
    videoDiv.classList.add("cast-box");
    newVideoElement.setAttribute('peerId', isLocal ? this.worldManager.VRSPACE.me.id : peerId);
    if(!isLocal) {
      newVideoElement.setAttribute('soundStageUserAlias', this.world.worldManager.VRSPACE.scene.get("Client " + peerId).properties.soundStageUserAlias);
      newVideoElement.setAttribute('soundStageUserRole', this.world.worldManager.VRSPACE.scene.get("Client " + peerId).properties.soundStageUserRole);
      newVideoElement.setAttribute('soundStageUserId', this.world.worldManager.VRSPACE.scene.get("Client " + peerId).properties.soundStageUserId);
    }
    let buttonContainer = document.createElement('div');
    buttonContainer.setAttribute('class','absolute flex flex-row gap-x-2 mt-2 w-full px-2');

    var button = document.createElement('a');
    button.setAttribute('class','cast-window bg-indigo-500 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer w-full text-center');
    button.innerHTML = 'WINDOW';
    button.addEventListener('click', () => {
      let castButtons = document.querySelectorAll('a.cast-window');
      for(var button of castButtons) {
        button.classList.remove('gradient-ultra');
        button.classList.add('bg-indigo-500');
      }
      event.target.classList.remove('bg-indigo-500');
      event.target.classList.add('gradient-ultra');
      document.querySelector("#app").__vue_app__._component.methods.castUser(isLocal ? this.worldManager.VRSPACE.me.id : peerId)
    })
    buttonContainer.appendChild(button)

    var button = document.createElement('a');
    button.setAttribute('class','cast-walls bg-indigo-500 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer w-full text-center');
    button.innerHTML = 'SKYBOX';
    button.addEventListener('click', (event) => {
      let castButtons = document.querySelectorAll('a.cast-walls');
      for(var button of castButtons) {
        button.classList.remove('gradient-ultra');
        button.classList.add('bg-indigo-500');
      }
      event.target.classList.remove('bg-indigo-500');
      event.target.classList.add('gradient-ultra');
      this.world.stageControls.emitStartVisuals(isLocal ? this.worldManager.VRSPACE.me.id : peerId)
    });
    buttonContainer.appendChild(button)

    videoDiv.appendChild(buttonContainer)
    videoDiv.appendChild(newVideoElement);
    mainVideoContainer.appendChild(videoDiv);
  }

  async init( roomId, callback ) {
    if(!this.userSettings.enableWebcamFeeds) {
      return;
    }
    // Initializing connection to the server.
    let roomClient = new mediasoup.RoomClient({
      roomId: roomId,
      peerId: this.worldManager.VRSPACE.me.id,
      displayName: this.worldManager.VRSPACE.me.name,
      baseUrl: this.spaceConfig.mediaSoup['url'], // FIXME use property
      // modes: VIDEO_ONLY, AUDIO_ONLY, AUDIO_AND_VIDEO
      mode: mediasoup.MODES.VIDEO_ONLY,
      useSimulcast: false,
      forceH264: false,
      resolution: this.spaceConfig.role === 'artist' || this.spaceConfig.permissions['stage_controls'] ? 'uhd' : 'qvga'
    });
    await roomClient.join();
    // Listen for events on 'PRODUCER's. Local tracks.
    roomClient.on(mediasoup.EVENTS.PRODUCER.NEW_PRODUCER, (producer) => {
      const track = producer.track;
      // Producers are local tracks
      this.addANewVideoElement(track, true);
      console.log("New producer")
    });
    // Listen for events on 'CONSUMERS's. Local tracks.
    roomClient.on(mediasoup.EVENTS.CONSUMER.NEW_CONSUMER, (event) => {
      console.log("New consumer")
      console.log(event);
      const track = event.consumer.track;
      // Consumers are remote tracks
      this.addANewVideoElement(track, false, event.peerId);
      if ( callback ) {
        callback( event );
      }
    });
    roomClient.on(mediasoup.EVENTS.CONSUMER.REMOVE_CONSUMER, (event) => {
      console.log("Video stream stopped");
      var clientId = this.getClientId(event);
      var videoElement = document.querySelector(`video[peerid='${clientId}']`)
      if(videoElement) {
        videoElement.parentNode.remove();
      }
      for ( var i = 0; i < this.clients.length; i++ ) {
        if ( this.clients[i].id == clientId ) {
          var avatar = this.clients[i].video;
          avatar.displayAlt();
          break;
        }
      }
    });
    // Print all supported events
    console.log("Here's a list of mediasoup events supported.");
    console.log(mediasoup.EVENTS);
    //Subscribing to all events
    const eventGroups = Object.keys(mediasoup.EVENTS);
    for (const group of eventGroups) {
      let events = Object.keys(mediasoup.EVENTS[group]);
      for (const ev of events) {
        roomClient.on(ev, (data) => {
          console.log(`${group} Event: ${ev}`, data);
        });
      }
    }

    window.roomClient = roomClient;
  }

  async connect(roomId) {
    await this.init(roomId, (subscriber) => this.streamingStart(subscriber));
  }

  publish(htmlElementName) {
    console.log("Started publishing video/audio")
  }

  publishVideo(enabled) {
    console.log("TODO Publishing video: "+enabled);
  }

  publishAudio(enabled) {
    console.log("TODO Publishing audio: "+enabled);
  }

  getClientId(consumerEvent) {
    return parseInt(consumerEvent.peerId,10);
  }

  getStream(consumerEvent) {
    console.log(consumerEvent.consumer.track);
    return new MediaStream([consumerEvent.consumer.track]);
  }

  attachVideoStream(client, consumerEvent) {
    if ( client.video ) {
      console.log(consumerEvent);
      var mediaStream = this.getStream(consumerEvent);
      var videoTracks = mediaStream.getVideoTracks();
      if ( videoTracks && videoTracks.length > 0 ) {
        console.log("Attaching video stream to client "+client.id);
        client.video.displayStream(mediaStream);
      }
    }
  }

}

export default MediaSoup;