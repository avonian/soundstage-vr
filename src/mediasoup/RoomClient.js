import protooClient from "protoo-client";
import * as mediasoupClient from "mediasoup-client";
import Logger from "./Logger";
import { EventEmitter } from "eventemitter3";

const VIDEO_CONSTRAINS = {
  qvga: { width: { ideal: 320 }, height: { ideal: 240 } },
  vga: { width: { ideal: 640 }, height: { ideal: 480 } },
  hd: { width: { ideal: 1280 }, height: { ideal: 720 } },
};

const PC_PROPRIETARY_CONSTRAINTS = {
  optional: [{ googDscp: true }],
};

// Used for simulcast webcam video.
const WEBCAM_SIMULCAST_ENCODINGS = [
  { scaleResolutionDownBy: 4, maxBitrate: 500000 },
  { scaleResolutionDownBy: 2, maxBitrate: 1000000 },
  { scaleResolutionDownBy: 1, maxBitrate: 5000000 },
];

// Used for VP9 webcam video.
const WEBCAM_KSVC_ENCODINGS = [{ scalabilityMode: "S3T3_KEY" }];

// Used for simulcast screen sharing.
const SCREEN_SHARING_SIMULCAST_ENCODINGS = [
  { dtx: true, maxBitrate: 1500000 },
  { dtx: true, maxBitrate: 6000000 },
];

// Used for VP9 screen sharing.
const SCREEN_SHARING_SVC_ENCODINGS = [{ scalabilityMode: "S3T3", dtx: true }];

const logger = new Logger("RoomClient");

export const EVENTS = {
  // Room events
  ROOM: {
    CLOSED: "CLOSED",
    CONNECTING: "CONNECTING",
    CONNECTED: "CONNECTED",
  },
  // Peer events
  PEER: {
    NEW_PEERS: "NEW_PEERS",
    REMOVE_PEER: "REMOVE_PEER",
    PEER_DISPLAY_NAME_CHANGED: "PEER_DISPLAY_NAME_CHANGED",
  },
  // Consumer events
  CONSUMER: {
    NEW_CONSUMER: "NEW_CONSUMER",
    REMOVE_CONSUMER: "REMOVE_CONSUMER",
    NEW_DATA_CONSUMER: "NEW_DATA_CONSUMER",
    REMOVE_DATA_CONSUMER: "REMOVE_DATA_CONSUMER",
    NEW_CHAT_MESSAGE: "NEW_CHAT_MESSAGE",
    CONSUMER_PAUSED: "CONSUMER_PAUSED",
    CONSUMER_RESUMED: "CONSUMER_RESUMED",
    CONSUMER_LAYERS_CHANGED: "CONSUMER_LAYERS_CHANGED",
    CONSUMER_SCORE: "CONSUMER_SCORE",
    SET_CONSUMER_PREFERRED_LAYERS: "SET_CONSUMER_PREFFERED_LAYERS",
    SET_CONSUMER_PRIORITY: "SET_CONSUMER_PRIORITY",
  },
  // Producer events
  PRODUCER: {
    NEW_PRODUCER: "NEW_PRODUCER",
    REMOVE_PRODUCER: "REMOVE_PRODUCER",
    NEW_DATA_PRODUCER: "NEW_DATA_PRODUCER",
    PRODUCER_SCORE: "PRODUCER_SCORE",
    PRODUCER_PAUSED: "PRODUCER_PAUSED",
    PRODUCER_RESUMED: "PRODUCER_RESUMED",
    SET_PRODUCER_TRACK: "SET_PRODUCER_TRACK",
  },
  // Misc events
  MISC: {
    MIC_DISCONNECTED: "MIC_DISCONNECTED",
    CAN_CHANGE_WEBCAM: "CAN_CHANGE_WEBCAM",
    MEDIA_CAPABILITIES: "MEDIA_CAPABILITIES",
    AUDIO_MUTED: "AUDIO_MUTED",
  },
  ERROR: "ERROR",
};

export const MODES = {
  AUDIO_AND_VIDEO: "AV",
  AUDIO_ONLY: "A",
  VIDEO_ONLY: "V",
};

function getProtooUrl({ baseUrl, roomId, peerId }) {
  return `${baseUrl}?roomId=${roomId}&peerId=${peerId}`;
}

export default class RoomClient extends EventEmitter {
  constructor({
    roomId,
    peerId,
    displayName,
    baseUrl,
    useSimulcast = true,
    forceTcp = false,
    // If false will not produce
    produce = true,
    // If false will not consume
    consume = true,
    // If true H264 will be forced
    forceH264 = false,
    // If true VP9 will be forced
    forceVP9 = false,
    // If true SVC will be used, only possible if codec is VP9.
    svc = false,
    // Weather to use datachannels or not.
    datachannel = false,
    // set mode of operation.
    mode = MODES.AUDIO_AND_VIDEO,
  }) {
    super();
    logger.debug(
      'constructor() [roomId:"%s", peerId:"%s", displayName:"%s"]',
      roomId,
      peerId,
      displayName
    );

    this._roomId = roomId;

    if (!Object.values(MODES).includes(mode)) {
      throw Error(`Invalid mode. Has to be one of mediasoup.MODES`);
    }
    this._mode = mode;
    // Closed flag.
    // @type {Boolean}
    this._closed = false;

    // Display name.
    // @type {String}
    this._displayName = displayName;

    // Whether we want to force RTC over TCP.
    // @type {Boolean}
    this._forceTcp = forceTcp;

    // Whether we want to produce audio/video.
    // @type {Boolean}
    this._produce = produce;

    // Whether we should consume.
    // @type {Boolean}
    this._consume = consume;

    // Whether we want DataChannels.
    // @type {Boolean}
    this._useDataChannel = datachannel;

    // Force H264 codec for sending.
    this._forceH264 = Boolean(forceH264);

    // Force VP9 codec for sending.
    this._forceVP9 = Boolean(forceVP9);

    // Next expected dataChannel test number.
    // @type {Number}
    this._nextDataChannelTestNumber = 0;

    // Whether simulcast should be used.
    // @type {Boolean}
    this._useSimulcast = useSimulcast;

    // Whether simulcast should be used in desktop sharing.
    // @type {Boolean}
    this._useSharingSimulcast = useSimulcast;

    // Protoo URL.
    // @type {String}
    this._protooUrl = getProtooUrl({ baseUrl, roomId, peerId });

    // protoo-client Peer instance.
    // @type {protooClient.Peer}
    this._protoo = null;

    // mediasoup-client Device instance.
    // @type {mediasoupClient.Device}
    this._mediasoupDevice = null;

    // mediasoup Transport for sending.
    // @type {mediasoupClient.Transport}
    this._sendTransport = null;

    // mediasoup Transport for receiving.
    // @type {mediasoupClient.Transport}
    this._recvTransport = null;

    // Local mic mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._micProducer = null;

    // Local webcam mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._webcamProducer = null;

    // Local share mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._shareProducer = null;

    // Local chat DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._chatDataProducer = null;

    // Local bot DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._botDataProducer = null;

    // mediasoup Consumers.
    // @type {Map<String, mediasoupClient.Consumer>}
    this._consumers = new Map();

    // mediasoup DataConsumers.
    // @type {Map<String, mediasoupClient.DataConsumer>}
    this._dataConsumers = new Map();

    // Map of webcam MediaDeviceInfos indexed by deviceId.
    // @type {Map<String, MediaDeviceInfos>}
    this._webcams = new Map();

    // Local Webcam.
    // @type {Object} with:
    // - {MediaDeviceInfo} [device]
    // - {String} [resolution] - 'qvga' / 'vga' / 'hd'.
    this._webcam = {
      device: null,
      resolution: "hd",
    };

    // Set custom SVC scalability mode.
    if (svc) {
      WEBCAM_KSVC_ENCODINGS[0].scalabilityMode = `${svc}_KEY`;
      SCREEN_SHARING_SVC_ENCODINGS[0].scalabilityMode = svc;
    }

    // List of all the peers in the room.
    this._peers = [];
  }

  _addDataConsumerToPeer(peerId, consumer) {
    const peer = this._peers.find((p) => p.id === peerId);
    if (!peer) return;
    const consumerExists = peer.dataConsumers.find((c) => c.id === consumer.id);
    if (consumerExists) return;
    peer.dataConsumers.push(consumer);
  }

  _removeDataConsumerFromPeer(peerId, consumerId) {
    const peer = this._peers.find((p) => p.id === peerId);
    if (!peer) return;
    peer.dataConsumers = peer.dataConsumers.filter((c) => c.id !== consumerId);
  }

  _addConsumerToPeer(peerId, consumer) {
    const peer = this._peers.find((p) => p.id === peerId);
    if (!peer) return;
    const consumerExists = peer.consumers.find((c) => c.id === consumer.id);
    if (consumerExists) return;
    peer.consumers.push(consumer);
  }

  _removeConsumerFromPeer(peerId, consumerId) {
    const peer = this._peers.find((p) => p.id === peerId);
    if (!peer) return;
    peer.consumers = peer.consumers.filter((c) => c.id !== consumerId);
  }

  _addPeer(peer) {
    const { id } = peer;
    const exist = this._peers.find((p) => p.id === id);

    if (exist) return;

    this._peers.push(peer);
  }

  _removePeer(peerId) {
    this._peers = this._peers.filter((p) => p.id !== peerId);
  }

  getAllPeers() {
    return this._peers;
  }

  close() {
    if (this._closed) return;

    this._closed = true;

    logger.debug("close()");

    // Close protoo Peer
    this._protoo.close();

    // Close mediasoup Transports.
    if (this._sendTransport) this._sendTransport.close();

    if (this._recvTransport) this._recvTransport.close();

    this.emit(EVENTS.ROOM.CLOSED);
  }

  async join() {
    const protooTransport = new protooClient.WebSocketTransport(
      this._protooUrl
    );

    this._protoo = new protooClient.Peer(protooTransport);

    this.emit(EVENTS.ROOM.CONNECTED);

    this._protoo.on("open", () => this._joinRoom());

    this._protoo.on("failed", () => {
      this.emit(EVENTS.ERROR, {
        type: "ws-connection-error",
        text: "WebSocket connection failed",
      });
    });

    this._protoo.on("disconnected", () => {
      this.emit(EVENTS.ERROR, {
        type: "ws-disconnected",
        text: "WebSocket disconnected",
      });

      // Close mediasoup Transports.
      if (this._sendTransport) {
        this._sendTransport.close();
        this._sendTransport = null;
      }

      if (this._recvTransport) {
        this._recvTransport.close();
        this._recvTransport = null;
      }

      this.emit(EVENTS.ROOM.CLOSED);
    });

    this._protoo.on("close", () => {
      if (this._closed) return;

      this.close();
    });

    // eslint-disable-next-line no-unused-vars
    this._protoo.on("request", async (request, accept, reject) => {
      logger.debug(
        'proto "request" event [method:%s, data:%o]',
        request.method,
        request.data
      );

      switch (request.method) {
        case "newConsumer": {
          if (!this._consume) {
            reject(403, "I do not want to consume");

            break;
          }

          const {
            peerId,
            producerId,
            id,
            kind,
            rtpParameters,
            type,
            appData,
            producerPaused,
          } = request.data;

          if (type === "video" && this._mode === MODES.AUDIO_ONLY) {
            reject(403, "Can't accept video in audio only mode.");
            break;
          }
          if (type === "audio" && this._mode === MODES.VIDEO_ONLY) {
            reject(403, "Can't accept audio in video only mode.");
            break;
          }

          try {
            const consumer = await this._recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              appData: { ...appData, peerId }, // Trick.
            });

            // Store in the map.
            this._consumers.set(consumer.id, consumer);

            consumer.on("transportclose", () => {
              this._consumers.delete(consumer.id);
            });

            const {
              spatialLayers,
              temporalLayers,
            } = mediasoupClient.parseScalabilityMode(
              consumer.rtpParameters.encodings[0].scalabilityMode
            );

            // Before the event add the consumer
            // to the peer.
            const newConsumer = {
              id: consumer.id,
              type: type,
              locallyPaused: false,
              remotelyPaused: producerPaused,
              rtpParameters: consumer.rtpParameters,
              spatialLayers: spatialLayers,
              temporalLayers: temporalLayers,
              preferredSpatialLayer: spatialLayers - 1,
              preferredTemporalLayer: temporalLayers - 1,
              priority: 1,
              codec: consumer.rtpParameters.codecs[0].mimeType.split("/")[1],
              track: consumer.track,
            };
            this._addConsumerToPeer(peerId, newConsumer);
            this.emit(EVENTS.CONSUMER.NEW_CONSUMER, {
              consumer: newConsumer,
              peerId,
            });

            // We are ready. Answer the protoo request so the server will
            // resume this Consumer (which was paused for now if video).
            accept();
          } catch (error) {
            logger.error('"newConsumer" request failed:%o', error);

            this.emit(EVENTS.ERROR, {
              type: "new-consumer-failed",
              text: `Error creating a Consumer: ${error}`,
            });

            throw error;
          }

          break;
        }

        case "newDataConsumer": {
          if (!this._consume) {
            reject(403, "I do not want to data consume");

            break;
          }

          if (!this._useDataChannel) {
            reject(403, "I do not want DataChannels");

            break;
          }

          const {
            peerId, // NOTE: Null if bot.
            dataProducerId,
            id,
            sctpStreamParameters,
            label,
            protocol,
            appData,
          } = request.data;

          try {
            const dataConsumer = await this._recvTransport.consumeData({
              id,
              dataProducerId,
              sctpStreamParameters,
              label,
              protocol,
              appData: { ...appData, peerId }, // Trick.
            });

            // Store in the map.
            this._dataConsumers.set(dataConsumer.id, dataConsumer);

            dataConsumer.on("transportclose", () => {
              this._dataConsumers.delete(dataConsumer.id);
            });

            dataConsumer.on("open", () => {
              logger.debug('DataConsumer "open" event');
            });

            dataConsumer.on("close", () => {
              logger.warn('DataConsumer "close" event');

              this._dataConsumers.delete(dataConsumer.id);

              this.emit(EVENTS.ERROR, {
                type: "data-consumer-closed",
                text: "DataConsumer closed",
              });
            });

            dataConsumer.on("error", (error) => {
              logger.error('DataConsumer "error" event:%o', error);

              this.emit(EVENTS.ERROR, {
                type: "data-consumer-error",
                text: `DataConsumer error: ${error}`,
              });
            });

            dataConsumer.on("message", (message) => {
              logger.debug(
                'DataConsumer "message" event [streamId:%d]',
                dataConsumer.sctpStreamParameters.streamId
              );

              if (message instanceof ArrayBuffer) {
                const view = new DataView(message);
                const number = view.getUint32();

                if (number == Math.pow(2, 32) - 1) {
                  logger.warn("dataChannelTest finished!");

                  this._nextDataChannelTestNumber = 0;

                  return;
                }

                if (number > this._nextDataChannelTestNumber) {
                  logger.warn(
                    "dataChannelTest: %s packets missing",
                    number - this._nextDataChannelTestNumber
                  );
                }

                this._nextDataChannelTestNumber = number + 1;

                return;
              } else if (typeof message !== "string") {
                logger.warn('ignoring DataConsumer "message" (not a string)');

                return;
              }

              switch (dataConsumer.label) {
                case "chat": {
                  const peers = this._peers;
                  const peersArray = Object.keys(peers).map(
                    (_peerId) => peers[_peerId]
                  );
                  const sendingPeer = peersArray.find((peer) =>
                    peer.dataConsumers.includes(dataConsumer.id)
                  );

                  if (!sendingPeer) {
                    logger.warn('DataConsumer "message" from unknown peer');

                    break;
                  }

                  this.emit(EVENTS.CONSUMER.NEW_CHAT_MESSAGE, {
                    sender: sendingPeer,
                    text: message,
                  });

                  break;
                }

                case "bot": {
                  // Process message from bot.

                  break;
                }
              }
            });

            const consumer = {
              id: dataConsumer.id,
              sctpStreamParameters: dataConsumer.sctpStreamParameters,
              label: dataConsumer.label,
              protocol: dataConsumer.protocol,
            };
            this._addDataConsumerToPeer(peerId, consumer);
            this.emit(EVENTS.CONSUMER.NEW_DATA_CONSUMER, {
              consumer,
              peerId,
            });

            // We are ready. Answer the protoo request.
            accept();
          } catch (error) {
            logger.error('"newDataConsumer" request failed:%o', error);

            this.emit(EVENTS.ERROR, {
              type: "data-consumer-error",
              text: `Error creating a DataConsumer: ${error}`,
            });

            throw error;
          }

          break;
        }
      }
    });

    this._protoo.on("notification", (notification) => {
      logger.debug(
        'proto "notification" event [method:%s, data:%o]',
        notification.method,
        notification.data
      );

      switch (notification.method) {
        case "producerScore": {
          const { producerId, score } = notification.data;

          this.emit(EVENTS.PRODUCER.PRODUCER_SCORE, { producerId, score });

          break;
        }

        case "newPeer": {
          const peer = notification.data;

          const newPeer = { ...peer, consumers: [], dataConsumers: [] };
          this._addPeer(newPeer);
          this.emit(EVENTS.PEER.NEW_PEERS, [newPeer]);

          break;
        }

        case "peerClosed": {
          const { peerId } = notification.data;

          this._removePeer(peerId);
          this.emit(EVENTS.PEER.REMOVE_PEER, { peerId });

          break;
        }

        case "peerDisplayNameChanged": {
          const { peerId, displayName, oldDisplayName } = notification.data;

          // Update name in the local list.
          const peer = this._peers.filter((p) => p.id === peerId);
          peer.displayName = displayName;
          this.emit(EVENTS.PEER.PEER_DISPLAY_NAME_CHANGED, {
            displayName,
            peerId,
          });

          break;
        }

        case "downlinkBwe": {
          logger.debug("'downlinkBwe' event:%o", notification.data);

          break;
        }

        case "consumerClosed": {
          const { consumerId } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer) break;

          consumer.close();
          this._consumers.delete(consumerId);

          const { peerId } = consumer.appData;

          this._removeConsumerFromPeer(peerId, consumerId);
          this.emit(EVENTS.CONSUMER.REMOVE_CONSUMER, { consumerId, peerId });

          break;
        }

        case "consumerPaused": {
          const { consumerId } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer) break;

          consumer.pause();

          this.emit(EVENTS.CONSUMER.CONSUMER_PAUSED, {
            consumerId,
            type: "remote",
          });

          break;
        }

        case "consumerResumed": {
          const { consumerId } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer) break;

          consumer.resume();

          this.emit(EVENTS.CONSUMER.CONSUMER_RESUMED, {
            consumerId,
            type: "remote",
          });

          break;
        }

        case "consumerLayersChanged": {
          const { consumerId, spatialLayer, temporalLayer } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer) break;

          this.emit(EVENTS.CONSUMER.CONSUMER_LAYERS_CHANGED, {
            consumerId,
            spatialLayer,
            temporalLayer,
          });

          break;
        }

        case "consumerScore": {
          const { consumerId, score } = notification.data;

          this.emit(EVENTS.CONSUMER.CONSUMER_SCORE, { consumerId, score });

          break;
        }

        case "dataConsumerClosed": {
          const { dataConsumerId } = notification.data;
          const dataConsumer = this._dataConsumers.get(dataConsumerId);

          if (!dataConsumer) break;

          dataConsumer.close();
          this._dataConsumers.delete(dataConsumerId);

          const { peerId } = dataConsumer.appData;

          this._removeDataConsumerFromPeer(peerId, dataConsumerId);
          this.emit(EVENTS.CONSUMER.REMOVE_DATA_CONSUMER, {
            dataConsumerId,
            peerId,
          });

          break;
        }

        case "activeSpeaker": {
          const { peerId } = notification.data;
          // This peerId is the current active speaker
          // TODO: Remove active speaker processing from the server.
          break;
        }

        default: {
          logger.error(
            'unknown protoo notification.method "%s"',
            notification.method
          );
        }
      }
    });
  }

  async enableMic() {
    logger.debug("enableMic()");

    if (this._mode === MODES.VIDEO_ONLY) return;

    if (this._micProducer) return;

    if (!this._mediasoupDevice.canProduce("audio")) {
      logger.error("enableMic() | cannot produce audio");

      return;
    }

    let track;

    try {
      logger.debug("enableMic() | calling getUserMedia()");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      track = stream.getAudioTracks()[0];

      this._micProducer = await this._sendTransport.produce({
        track,
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1,
        },
        // NOTE: for testing codec selection.
        // codec : this._mediasoupDevice.rtpCapabilities.codecs
        // 	.find((codec) => codec.mimeType.toLowerCase() === 'audio/pcma')
      });

      this.emit(EVENTS.PRODUCER.NEW_PRODUCER, {
        id: this._micProducer.id,
        paused: this._micProducer.paused,
        track: this._micProducer.track,
        rtpParameters: this._micProducer.rtpParameters,
        codec: this._micProducer.rtpParameters.codecs[0].mimeType.split("/")[1],
      });

      this._micProducer.on("transportclose", () => {
        this._micProducer = null;
      });

      this._micProducer.on("trackended", () => {
        this.emit(EVENTS.MISC.MIC_DISCONNECTED);

        this.disableMic().catch(() => {});
      });
    } catch (error) {
      logger.error("enableMic() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "mic-error",
        text: `Error enabling microphone: ${error}`,
      });

      if (track) {
        track.stop();
        track.onended && track.onended();
      }
    }
  }

  async disableMic() {
    logger.debug("disableMic()");

    if (!this._micProducer) return;

    this._micProducer.close();

    this.emit(EVENTS.PRODUCER.REMOVE_PRODUCER, {
      producerId: this._micProducer.id,
    });

    try {
      await this._protoo.request("closeProducer", {
        producerId: this._micProducer.id,
      });
    } catch (error) {
      this.emit(EVENTS.ERROR, {
        type: "disable-mic-error",
        text: `Error closing server-side mic Producer: ${error}`,
      });
    }

    this._micProducer = null;
  }

  async muteMic() {
    logger.debug("muteMic()");

    this._micProducer.pause();

    try {
      await this._protoo.request("pauseProducer", {
        producerId: this._micProducer.id,
      });

      this.emit(EVENTS.PRODUCER.PRODUCER_PAUSED, {
        producerId: this._micProducer.id,
      });
    } catch (error) {
      logger.error("muteMic() | failed: %o", error);

      this.emit(EVENTS.ERROR, {
        type: "mute-mic-error",
        text: `Error pausing server-side mic Producer: ${error}`,
      });
    }
  }

  async unmuteMic() {
    logger.debug("unmuteMic()");

    this._micProducer.resume();

    try {
      await this._protoo.request("resumeProducer", {
        producerId: this._micProducer.id,
      });

      this.emit(EVENTS.PRODUCER.PRODUCER_RESUMED, {
        producerId: this._micProducer.id,
      });
    } catch (error) {
      logger.error("unmuteMic() | failed: %o", error);

      this.emit(EVENTS.ERROR, {
        type: "unmute-mic-error",
        text: `Error resuming server-side mic Producer: ${error}`,
      });
    }
  }

  async enableWebcam() {
    logger.debug("enableWebcam()");

    if (this._mode === MODES.AUDIO_ONLY) return;

    if (this._webcamProducer) return;
    else if (this._shareProducer) await this.disableShare();

    if (!this._mediasoupDevice.canProduce("video")) {
      logger.error("enableWebcam() | cannot produce video");

      return;
    }

    let track;
    let device;

    try {
      await this._updateWebcams();
      device = this._webcam.device;

      const { resolution } = this._webcam;

      if (!device) throw new Error("no webcam devices");

      logger.debug("enableWebcam() | calling getUserMedia()");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { ideal: device.deviceId },
          ...VIDEO_CONSTRAINS[resolution],
        },
      });

      track = stream.getVideoTracks()[0];

      let encodings;
      let codec;
      const codecOptions = {
        videoGoogleStartBitrate: 1000,
      };

      if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === "video/h264"
        );

        if (!codec) {
          throw new Error("desired H264 codec+configuration is not supported");
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === "video/vp9"
        );

        if (!codec) {
          throw new Error("desired VP9 codec+configuration is not supported");
        }
      }

      if (this._useSimulcast) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.kind === "video"
        );

        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === "video/vp9"
        ) {
          encodings = WEBCAM_KSVC_ENCODINGS;
        } else {
          encodings = WEBCAM_SIMULCAST_ENCODINGS;
        }
      }

      this._webcamProducer = await this._sendTransport.produce({
        track,
        encodings,
        codecOptions,
        codec,
      });

      this.emit(EVENTS.PRODUCER.NEW_PRODUCER, {
        id: this._webcamProducer.id,
        deviceLabel: device.label,
        type: this._getWebcamType(device),
        paused: this._webcamProducer.paused,
        track: this._webcamProducer.track,
        rtpParameters: this._webcamProducer.rtpParameters,
        codec: this._webcamProducer.rtpParameters.codecs[0].mimeType.split(
          "/"
        )[1],
      });

      this._webcamProducer.on("transportclose", () => {
        this._webcamProducer = null;
      });

      this._webcamProducer.on("trackended", () => {
        this.emit(EVENTS.ERROR, {
          type: "enable-webcam-error",
          text: "Webcam disconnected!",
        });

        this.disableWebcam().catch(() => {});
      });
    } catch (error) {
      logger.error("enableWebcam() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "enable-webcam-error",
        text: `Error enabling webcam: ${error}`,
      });

      if (track) {
        track.stop();
        track.onended && track.onended();
      }
    }
  }

  async disableWebcam() {
    logger.debug("disableWebcam()");

    if (!this._webcamProducer) return;

    this._webcamProducer.close();

    this.emit(EVENTS.PRODUCER.REMOVE_PRODUCER, {
      producerId: this._webcamProducer.id,
    });

    try {
      await this._protoo.request("closeProducer", {
        producerId: this._webcamProducer.id,
      });
    } catch (error) {
      this.emit(EVENTS.ERROR, {
        type: "disable-webcam-error",
        text: `Error closing server-side webcam Producer: ${error}`,
      });
    }

    this._webcamProducer = null;
  }

  async changeWebcam() {
    logger.debug("changeWebcam()");

    try {
      await this._updateWebcams();

      const array = Array.from(this._webcams.keys());
      const len = array.length;
      const deviceId = this._webcam.device
        ? this._webcam.device.deviceId
        : undefined;
      let idx = array.indexOf(deviceId);

      if (idx < len - 1) idx++;
      else idx = 0;

      this._webcam.device = this._webcams.get(array[idx]);

      logger.debug(
        "changeWebcam() | new selected webcam [device:%o]",
        this._webcam.device
      );

      // Reset video resolution to HD.
      this._webcam.resolution = "hd";

      if (!this._webcam.device) throw new Error("no webcam devices");

      // Closing the current video track before asking for a new one (mobiles do not like
      // having both front/back cameras open at the same time).
      this._webcamProducer.track.stop();
      this._webcamProducer.track.onended &&
        this._webcamProducer.track.onended();

      logger.debug("changeWebcam() | calling getUserMedia()");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: this._webcam.device.deviceId },
          ...VIDEO_CONSTRAINS[this._webcam.resolution],
        },
      });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({ track });

      this.emit(EVENTS.PRODUCER.SET_PRODUCER_TRACK, {
        producerId: this._webcamProducer.id,
        track,
      });
    } catch (error) {
      logger.error("changeWebcam() | failed: %o", error);

      this.emit(EVENTS.ERROR, {
        type: "change-webcam-error",
        text: `Could not change webcam: ${error}`,
      });
    }
  }

  async changeWebcamResolution() {
    logger.debug("changeWebcamResolution()");

    try {
      switch (this._webcam.resolution) {
        case "qvga":
          this._webcam.resolution = "vga";
          break;
        case "vga":
          this._webcam.resolution = "hd";
          break;
        case "hd":
          this._webcam.resolution = "qvga";
          break;
        default:
          this._webcam.resolution = "hd";
      }

      logger.debug("changeWebcamResolution() | calling getUserMedia()");

      // Closing the current video track before asking for a new one (mobiles do not like
      // having both front/back cameras open at the same time).
      this._webcamProducer.track.stop();
      this._webcamProducer.track.onended &&
        this._webcamProducer.track.onended();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: this._webcam.device.deviceId },
          ...VIDEO_CONSTRAINS[this._webcam.resolution],
        },
      });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({ track });

      this.emit(EVENTS.PRODUCER.SET_PRODUCER_TRACK, {
        producerId: this._webcamProducer.id,
        track,
      });
    } catch (error) {
      logger.error("changeWebcamResolution() | failed: %o", error);

      this.emit(EVENTS.ERROR, {
        type: "change-webcam-resolution-error",
        text: `Could not change webcam resolution: ${error}`,
      });
    }
  }

  async enableShare() {
    logger.debug("enableShare()");

    if (this._mode === MODES.AUDIO_ONLY) return;

    if (this._shareProducer) return;
    else if (this._webcamProducer) await this.disableWebcam();

    if (!this._mediasoupDevice.canProduce("video")) {
      logger.error("enableShare() | cannot produce video");

      return;
    }

    let track;

    try {
      logger.debug("enableShare() | calling getUserMedia()");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          displaySurface: "monitor",
          logicalSurface: true,
          cursor: true,
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 },
        },
      });

      // May mean cancelled (in some implementations).
      if (!stream) {
        return;
      }

      track = stream.getVideoTracks()[0];

      let encodings;
      let codec;
      const codecOptions = {
        videoGoogleStartBitrate: 1000,
      };

      if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === "video/h264"
        );

        if (!codec) {
          throw new Error("desired H264 codec+configuration is not supported");
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === "video/vp9"
        );

        if (!codec) {
          throw new Error("desired VP9 codec+configuration is not supported");
        }
      }

      if (this._useSharingSimulcast) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.kind === "video"
        );

        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === "video/vp9"
        ) {
          encodings = SCREEN_SHARING_SVC_ENCODINGS;
        } else {
          encodings = SCREEN_SHARING_SIMULCAST_ENCODINGS.map((encoding) => ({
            ...encoding,
            dtx: true,
          }));
        }
      }

      this._shareProducer = await this._sendTransport.produce({
        track,
        encodings,
        codecOptions,
        codec,
        appData: {
          share: true,
        },
      });

      this.emit(EVENTS.PRODUCER.NEW_PRODUCER, {
        id: this._shareProducer.id,
        type: "share",
        paused: this._shareProducer.paused,
        track: this._shareProducer.track,
        rtpParameters: this._shareProducer.rtpParameters,
        codec: this._shareProducer.rtpParameters.codecs[0].mimeType.split(
          "/"
        )[1],
      });

      this._shareProducer.on("transportclose", () => {
        this._shareProducer = null;
      });

      this._shareProducer.on("trackended", () => {
        this.emit(EVENTS.ERROR, {
          type: "screen-share-error",
          text: "Share disconnected!",
        });

        this.disableShare().catch(() => {});
      });
    } catch (error) {
      logger.error("enableShare() | failed:%o", error);

      if (error.name !== "NotAllowedError") {
        this.emit(EVENTS.ERROR, {
          type: "share-error",
          text: `error sharing: ${error}`,
        });
      }

      if (track) {
        track.stop();
        track.onended && track.onended();
      }
    }
  }

  async disableShare() {
    logger.debug("disableShare()");

    if (!this._shareProducer) return;

    this._shareProducer.close();

    this.emit(EVENTS.PRODUCER.REMOVE_PRODUCER, {
      producerId: this._shareProducer.id,
    });

    try {
      await this._protoo.request("closeProducer", {
        producerId: this._shareProducer.id,
      });
    } catch (error) {
      this.emit(EVENTS.ERROR, {
        type: "disable-share-error",
        text: `Error closing server-side share Producer: ${error}`,
      });
    }

    this._shareProducer = null;
  }

  async muteAudio() {
    logger.debug("muteAudio()");

    this.emit(EVENTS.MISC.AUDIO_MUTED, true);
  }

  async unmuteAudio() {
    logger.debug("unmuteAudio()");

    this.emit(EVENTS.MISC.AUDIO_MUTED, false);
  }

  async restartIce() {
    logger.debug("restartIce()");

    try {
      if (this._sendTransport) {
        const iceParameters = await this._protoo.request("restartIce", {
          transportId: this._sendTransport.id,
        });

        await this._sendTransport.restartIce({ iceParameters });
      }

      if (this._recvTransport) {
        const iceParameters = await this._protoo.request("restartIce", {
          transportId: this._recvTransport.id,
        });

        await this._recvTransport.restartIce({ iceParameters });
      }
    } catch (error) {
      logger.error("restartIce() | failed:%o", error);

      throw error;
    }
  }

  async setMaxSendingSpatialLayer(spatialLayer) {
    logger.debug("setMaxSendingSpatialLayer() [spatialLayer:%s]", spatialLayer);

    try {
      if (this._webcamProducer)
        await this._webcamProducer.setMaxSpatialLayer(spatialLayer);
      else if (this._shareProducer)
        await this._shareProducer.setMaxSpatialLayer(spatialLayer);
    } catch (error) {
      logger.error("setMaxSendingSpatialLayer() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "set-max-sending-spatial-layer-error",
        text: `Error setting max sending video spatial layer: ${error}`,
      });
    }
  }

  async setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer) {
    logger.debug(
      "setConsumerPreferredLayers() [consumerId:%s, spatialLayer:%s, temporalLayer:%s]",
      consumerId,
      spatialLayer,
      temporalLayer
    );

    try {
      await this._protoo.request("setConsumerPreferredLayers", {
        consumerId,
        spatialLayer,
        temporalLayer,
      });

      this.emit(EVENTS.CONSUMER.SET_CONSUMER_PREFERRED_LAYERS, {
        consumerId,
        spatialLayer,
        temporalLayer,
      });
    } catch (error) {
      logger.error("setConsumerPreferredLayers() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "set-consumer-preffered-layers-error",
        text: `Error setting Consumer preferred layers: ${error}`,
      });
    }
  }

  async setConsumerPriority(consumerId, priority) {
    logger.debug(
      "setConsumerPriority() [consumerId:%s, priority:%d]",
      consumerId,
      priority
    );

    try {
      await this._protoo.request("setConsumerPriority", {
        consumerId,
        priority,
      });

      this.emit(EVENTS.CONSUMER.SET_CONSUMER_PRIORITY, {
        consumerid,
        priority,
      });
    } catch (error) {
      logger.error("setConsumerPriority() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "set-consumer-priority-error",
        text: `Error setting Consumer priority: ${error}`,
      });
    }
  }

  async requestConsumerKeyFrame(consumerId) {
    logger.debug("requestConsumerKeyFrame() [consumerId:%s]", consumerId);

    try {
      await this._protoo.request("requestConsumerKeyFrame", { consumerId });
    } catch (error) {
      logger.error("requestConsumerKeyFrame() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "request-consumer-keyframe-error",
        text: `Error requesting key frame for Consumer: ${error}`,
      });
    }
  }

  async enableChatDataProducer() {
    logger.debug("enableChatDataProducer()");

    if (!this._useDataChannel) return;

    if (this._chatDataProducer) return;

    try {
      // Create chat DataProducer.
      this._chatDataProducer = await this._sendTransport.produceData({
        ordered: false,
        maxRetransmits: 1,
        label: "chat",
        priority: "medium",
        appData: { info: "my-chat-DataProducer" },
      });

      this.emit(EVENTS.PRODUCER.NEW_DATA_PRODUCER, {
        id: this._chatDataProducer.id,
        sctpStreamParameters: this._chatDataProducer.sctpStreamParameters,
        label: this._chatDataProducer.label,
        protocol: this._chatDataProducer.protocol,
      });

      this._chatDataProducer.on("transportclose", () => {
        this._chatDataProducer = null;
      });

      this._chatDataProducer.on("open", () => {
        logger.debug('chat DataProducer "open" event');
      });

      this._chatDataProducer.on("close", () => {
        logger.error('chat DataProducer "close" event');

        this._chatDataProducer = null;

        this.emit(EVENTS.ERROR, {
          type: "chat-data-producer-error",
          text: "Chat DataProducer closed",
        });
      });

      this._chatDataProducer.on("error", (error) => {
        logger.error('chat DataProducer "error" event:%o', error);

        this.emit(EVENTS.ERROR, {
          type: "chat-data-producer-error",
          text: `Chat DataProducer error: ${error}`,
        });
      });

      this._chatDataProducer.on("bufferedamountlow", () => {
        logger.debug('chat DataProducer "bufferedamountlow" event');
      });
    } catch (error) {
      logger.error("enableChatDataProducer() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "chat-data-producer-error",
        text: `Error enabling chat DataProducer: ${error}`,
      });

      throw error;
    }
  }

  async enableBotDataProducer() {
    logger.debug("enableBotDataProducer()");

    if (!this._useDataChannel) return;

    if (this._botDataProducer) return;

    try {
      // Create chat DataProducer.
      this._botDataProducer = await this._sendTransport.produceData({
        ordered: false,
        maxPacketLifeTime: 2000,
        label: "bot",
        priority: "medium",
        appData: { info: "my-bot-DataProducer" },
      });

      this.emit(EVENTS.PRODUCER.NEW_DATA_PRODUCER, {
        id: this._botDataProducer.id,
        sctpStreamParameters: this._botDataProducer.sctpStreamParameters,
        label: this._botDataProducer.label,
        protocol: this._botDataProducer.protocol,
      });

      this._botDataProducer.on("transportclose", () => {
        this._botDataProducer = null;
      });

      this._botDataProducer.on("open", () => {
        logger.debug('bot DataProducer "open" event');
      });

      this._botDataProducer.on("close", () => {
        logger.error('bot DataProducer "close" event');

        this._botDataProducer = null;

        this.emit(EVENTS.ERROR, {
          type: "bot-data-producer-error",
          text: "Bot DataProducer closed",
        });
      });

      this._botDataProducer.on("error", (error) => {
        logger.error('bot DataProducer "error" event:%o', error);

        this.emit(EVENTS.ERROR, {
          type: "bot-data-producer-error",
          text: `Bot DataProducer error: ${error}`,
        });
      });

      this._botDataProducer.on("bufferedamountlow", () => {
        logger.debug('bot DataProducer "bufferedamountlow" event');
      });
    } catch (error) {
      logger.error("enableBotDataProducer() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "bot-data-producer-error",
        text: `Error enabling bot DataProducer: ${error}`,
      });

      throw error;
    }
  }

  async sendChatMessage(text) {
    logger.debug('sendChatMessage() [text:"%s]', text);

    if (!this._chatDataProducer) {
      this.emit(EVENTS.ERROR, {
        type: "send-chat-message-error",
        text: "No chat DataProducer",
      });

      return;
    }

    try {
      this._chatDataProducer.send(text);
    } catch (error) {
      logger.error("chat DataProducer.send() failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "send-chat-message-error",
        text: `chat DataProducer.send() failed: ${error}`,
      });
    }
  }

  async sendBotMessage(text) {
    logger.debug('sendBotMessage() [text:"%s]', text);

    if (!this._botDataProducer) {
      this.emit(EVENTS.ERROR, {
        type: "send-bot-message-error",
        text: "No bot DataProducer",
      });

      return;
    }

    try {
      this._botDataProducer.send(text);
    } catch (error) {
      logger.error("bot DataProducer.send() failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "send-bot-message-error",
        text: `bot DataProducer.send() failed: ${error}`,
      });
    }
  }

  async changeDisplayName(displayName) {
    logger.debug('changeDisplayName() [displayName:"%s"]', displayName);

    try {
      await this._protoo.request("changeDisplayName", { displayName });

      this._displayName = displayName;
    } catch (error) {
      logger.error("changeDisplayName() | failed: %o", error);

      throw error;
    }
  }

  async getSendTransportRemoteStats() {
    logger.debug("getSendTransportRemoteStats()");

    if (!this._sendTransport) return;

    return this._protoo.request("getTransportStats", {
      transportId: this._sendTransport.id,
    });
  }

  async getRecvTransportRemoteStats() {
    logger.debug("getRecvTransportRemoteStats()");

    if (!this._recvTransport) return;

    return this._protoo.request("getTransportStats", {
      transportId: this._recvTransport.id,
    });
  }

  async getAudioRemoteStats() {
    logger.debug("getAudioRemoteStats()");

    if (!this._micProducer) return;

    return this._protoo.request("getProducerStats", {
      producerId: this._micProducer.id,
    });
  }

  async getVideoRemoteStats() {
    logger.debug("getVideoRemoteStats()");

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer) return;

    return this._protoo.request("getProducerStats", {
      producerId: producer.id,
    });
  }

  async getConsumerRemoteStats(consumerId) {
    logger.debug("getConsumerRemoteStats()");

    const consumer = this._consumers.get(consumerId);

    if (!consumer) return;

    return this._protoo.request("getConsumerStats", { consumerId });
  }

  async getChatDataProducerRemoteStats() {
    logger.debug("getChatDataProducerRemoteStats()");

    const dataProducer = this._chatDataProducer;

    if (!dataProducer) return;

    return this._protoo.request("getDataProducerStats", {
      dataProducerId: dataProducer.id,
    });
  }

  async getBotDataProducerRemoteStats() {
    logger.debug("getBotDataProducerRemoteStats()");

    const dataProducer = this._botDataProducer;

    if (!dataProducer) return;

    return this._protoo.request("getDataProducerStats", {
      dataProducerId: dataProducer.id,
    });
  }

  async getDataConsumerRemoteStats(dataConsumerId) {
    logger.debug("getDataConsumerRemoteStats()");

    const dataConsumer = this._dataConsumers.get(dataConsumerId);

    if (!dataConsumer) return;

    return this._protoo.request("getDataConsumerStats", { dataConsumerId });
  }

  async getSendTransportLocalStats() {
    logger.debug("getSendTransportLocalStats()");

    if (!this._sendTransport) return;

    return this._sendTransport.getStats();
  }

  async getRecvTransportLocalStats() {
    logger.debug("getRecvTransportLocalStats()");

    if (!this._recvTransport) return;

    return this._recvTransport.getStats();
  }

  async getAudioLocalStats() {
    logger.debug("getAudioLocalStats()");

    if (!this._micProducer) return;

    return this._micProducer.getStats();
  }

  async getVideoLocalStats() {
    logger.debug("getVideoLocalStats()");

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer) return;

    return producer.getStats();
  }

  async getConsumerLocalStats(consumerId) {
    const consumer = this._consumers.get(consumerId);

    if (!consumer) return;

    return consumer.getStats();
  }

  async applyNetworkThrottle({ uplink, downlink, rtt, secret }) {
    logger.debug(
      "applyNetworkThrottle() [uplink:%s, downlink:%s, rtt:%s]",
      uplink,
      downlink,
      rtt
    );

    try {
      await this._protoo.request("applyNetworkThrottle", {
        uplink,
        downlink,
        rtt,
        secret,
      });
    } catch (error) {
      logger.error("applyNetworkThrottle() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "apply-network-throttle-error",
        text: `Error applying network throttle: ${error}`,
      });
    }
  }

  async resetNetworkThrottle({ silent = false, secret }) {
    logger.debug("resetNetworkThrottle()");

    try {
      await this._protoo.request("resetNetworkThrottle", { secret });
    } catch (error) {
      if (!silent) {
        logger.error("resetNetworkThrottle() | failed:%o", error);

        this.emit(EVENTS.ERROR, {
          type: "reset-network-throttle-error",
          text: `Error resetting network throttle: ${error}`,
        });
      }
    }
  }

  async _joinRoom() {
    logger.debug("_joinRoom()");

    try {
      this._mediasoupDevice = new mediasoupClient.Device();

      const routerRtpCapabilities = await this._protoo.request(
        "getRouterRtpCapabilities"
      );

      await this._mediasoupDevice.load({ routerRtpCapabilities });

      if (this._mode !== MODES.VIDEO_ONLY) {
        // NOTE: Stuff to play remote audios due to browsers' new autoplay policy.
        //
        // Just get access to the mic and DO NOT close the mic track for a while.
        // Super hack!
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioTrack = stream.getAudioTracks()[0];

        audioTrack.enabled = false;

        setTimeout(() => audioTrack.stop(), 120000);
      }
      // Create mediasoup Transport for sending (unless we don't want to produce).
      if (this._produce) {
        const transportInfo = await this._protoo.request(
          "createWebRtcTransport",
          {
            forceTcp: this._forceTcp,
            producing: true,
            consuming: false,
            sctpCapabilities: this._useDataChannel
              ? this._mediasoupDevice.sctpCapabilities
              : undefined,
          }
        );

        const {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
        } = transportInfo;

        this._sendTransport = this._mediasoupDevice.createSendTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
          iceServers: [],
          proprietaryConstraints: PC_PROPRIETARY_CONSTRAINTS,
        });

        this._sendTransport.on(
          "connect",
          (
            { dtlsParameters },
            callback,
            errback // eslint-disable-line no-shadow
          ) => {
            this._protoo
              .request("connectWebRtcTransport", {
                transportId: this._sendTransport.id,
                dtlsParameters,
              })
              .then(callback)
              .catch(errback);
          }
        );

        this._sendTransport.on(
          "produce",
          async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
              // eslint-disable-next-line no-shadow
              const { id } = await this._protoo.request("produce", {
                transportId: this._sendTransport.id,
                kind,
                rtpParameters,
                appData,
              });

              callback({ id });
            } catch (error) {
              errback(error);
            }
          }
        );

        this._sendTransport.on(
          "producedata",
          async (
            { sctpStreamParameters, label, protocol, appData },
            callback,
            errback
          ) => {
            logger.debug(
              '"producedata" event: [sctpStreamParameters:%o, appData:%o]',
              sctpStreamParameters,
              appData
            );

            try {
              // eslint-disable-next-line no-shadow
              const { id } = await this._protoo.request("produceData", {
                transportId: this._sendTransport.id,
                sctpStreamParameters,
                label,
                protocol,
                appData,
              });

              callback({ id });
            } catch (error) {
              errback(error);
            }
          }
        );
      }

      // Create mediasoup Transport for receiving (unless we don't want to consume).
      if (this._consume) {
        const transportInfo = await this._protoo.request(
          "createWebRtcTransport",
          {
            forceTcp: this._forceTcp,
            producing: false,
            consuming: true,
            sctpCapabilities: this._useDataChannel
              ? this._mediasoupDevice.sctpCapabilities
              : undefined,
          }
        );

        const {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
        } = transportInfo;

        this._recvTransport = this._mediasoupDevice.createRecvTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters,
          iceServers: [],
        });

        this._recvTransport.on(
          "connect",
          (
            { dtlsParameters },
            callback,
            errback // eslint-disable-line no-shadow
          ) => {
            this._protoo
              .request("connectWebRtcTransport", {
                transportId: this._recvTransport.id,
                dtlsParameters,
              })
              .then(callback)
              .catch(errback);
          }
        );
      }

      // Join now into the room.
      // NOTE: Don't send our RTP capabilities if we don't want to consume.
      const { peers } = await this._protoo.request("join", {
        displayName: this._displayName,
        device: { flag: "", name: "", version: "" },
        rtpCapabilities: this._consume
          ? this._mediasoupDevice.rtpCapabilities
          : undefined,
        sctpCapabilities:
          this._useDataChannel && this._consume
            ? this._mediasoupDevice.sctpCapabilities
            : undefined,
      });

      this.emit(EVENTS.ROOM.CONNECTED);

      this.emit(
        EVENTS.PEER.NEW_PEERS,
        peers.map((p) => ({ ...p, consumers: [], dataConsumers: [] }))
      );

      // Enable mic/webcam.
      if (this._produce) {
        // Set our media capabilities.
        this.emit(EVENTS.MISC.MEDIA_CAPABILITIES, {
          canSendMic:
            this._mode !== MODES.VIDEO_ONLY &&
            this._mediasoupDevice.canProduce("audio"),
          canSendWebcam:
            this._mode !== MODES.AUDIO_ONLY &&
            this._mediasoupDevice.canProduce("video"),
        });

        this.enableMic();

        this.enableWebcam();

        this._sendTransport.on("connectionstatechange", (connectionState) => {
          if (connectionState === "connected") {
            this.enableChatDataProducer();
            this.enableBotDataProducer();
          }
        });
      }
    } catch (error) {
      logger.error("_joinRoom() failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "join-room-error",
        text: `Could not join the room: ${error}`,
      });

      this.close();
    }
  }

  async _updateWebcams() {
    logger.debug("_updateWebcams()");

    // Reset the list.
    this._webcams = new Map();

    logger.debug("_updateWebcams() | calling enumerateDevices()");

    const devices = await navigator.mediaDevices.enumerateDevices();

    for (const device of devices) {
      if (device.kind !== "videoinput") continue;

      this._webcams.set(device.deviceId, device);
    }

    const array = Array.from(this._webcams.values());
    const len = array.length;
    const currentWebcamId = this._webcam.device
      ? this._webcam.device.deviceId
      : undefined;

    logger.debug("_updateWebcams() [webcams:%o]", array);

    if (len === 0) this._webcam.device = null;
    else if (!this._webcams.has(currentWebcamId))
      this._webcam.device = array[0];

    this.emit(EVENTS.MISC.CAN_CHANGE_WEBCAM, this._webcams.size > 1);
  }

  _getWebcamType(device) {
    if (/(back|rear)/i.test(device.label)) {
      logger.debug("_getWebcamType() | it seems to be a back camera");

      return "back";
    } else {
      logger.debug("_getWebcamType() | it seems to be a front camera");

      return "front";
    }
  }

  async _pauseConsumer(consumer) {
    if (consumer.paused) return;

    try {
      await this._protoo.request("pauseConsumer", { consumerId: consumer.id });

      consumer.pause();

      this.emit(EVENTS.CONSUMER.CONSUMER_PAUSED, {
        consumerId: consumer.id,
        type: "local",
      });
    } catch (error) {
      logger.error("_pauseConsumer() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "pause-consumer-error",
        text: `Error pausing Consumer: ${error}`,
      });
    }
  }

  async _resumeConsumer(consumer) {
    if (!consumer.paused) return;

    try {
      await this._protoo.request("resumeConsumer", { consumerId: consumer.id });

      consumer.resume();

      this.emit(EVENTS.CONSUMER.CONSUMER_RESUMED, {
        consumerId: consumer.id,
        type: "local",
      });
    } catch (error) {
      logger.error("_resumeConsumer() | failed:%o", error);

      this.emit(EVENTS.ERROR, {
        type: "resume-consumer-error",
        text: `Error resuming Consumer: ${error}`,
      });
    }
  }
}
