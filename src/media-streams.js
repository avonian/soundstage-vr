import mediasoup from './mediasoup';
import { MediaStreams } from './vrspace-babylon.js';

export class MediaSoup extends MediaStreams {

  constructor(scene, htmlElementName, userSettings, eventConfig) {
    super(scene, htmlElementName);
    this.userSettings = userSettings;
    this.eventConfig = eventConfig;
  }

  addANewVideoElement(track, isLocal, peerId= false) {
    if (isLocal) {
      document.querySelector("#localVideo").srcObject = new MediaStream([track]);
      document.querySelector("#localVideo").setAttribute('peerId', this.worldManager.VRSPACE.me.id);
    } else {

      let videoElement = document.querySelector(`video[peerid='${peerId}']`);
      if(videoElement) {
        // Video element already exists no need to create one (this is the case when users pause/resume video)
        videoElement.srcObject = new MediaStream([track]);
        return;
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
      videoDiv.classList.add("relative");
      if(peerId) {
        newVideoElement.setAttribute('peerId', peerId);
      }
      let badge = document.createElement('div');
      badge.setAttribute('class','absolute top-0 right-0 bg-indigo-500 mt-2 mr-2 px-3 py-2 rounded-lg text-sm font-medium z-20 cursor-pointer');
      badge.innerHTML = 'CAST';
      badge.addEventListener('click', () => {
        document.querySelector("#app").__vue_app__._component.methods.castUser(peerId)
      })
      videoDiv.appendChild(badge)
      videoDiv.appendChild(newVideoElement);
      mainVideoContainer.appendChild(videoDiv);
    }
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
      baseUrl: this.eventConfig.mediaSoup['url'], // FIXME use property
      // modes: VIDEO_ONLY, AUDIO_ONLY, AUDIO_AND_VIDEO
      mode: mediasoup.MODES.VIDEO_ONLY,
      useSimulcast: false,
      forceH264: false,
      resolution: this.role === 'artist' ? 'uhd' : 'qvga'
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