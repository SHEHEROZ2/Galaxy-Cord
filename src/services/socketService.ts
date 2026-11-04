import { Channel, Message, User, VoicePeer } from '../types';
import { createAudioLevelMeter, playJoinSound, playLeaveSound, playMessageSound, playMuteSound, playUnmuteSound, playScreenShareSound } from '../utils/audio';

type EventCallback = (data: any) => void;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class SocketService {
  private ws: WebSocket | null = null;
  private currentUrl: string = '';
  private currentUser: User | null = null;
  private currentServerId: string = '';
  private currentPassword?: string;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private pingInterval: any = null;
  private lastPingTime: number = 0;
  public latency: number = 0;
  public isConnected: boolean = false;

  // Voice & WebRTC state
  public currentVoiceChannelId: string | null = null;
  public localAudioStream: MediaStream | null = null;
  public localScreenStream: MediaStream | null = null;
  public localCameraStream: MediaStream | null = null;
  public isMuted: boolean = false;
  public isDeafened: boolean = false;
  public isScreenSharing: boolean = false;
  public isCameraOn: boolean = false;
  public isSpeaking: boolean = false;

  private stopAudioLevelMeter: (() => void) | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map(); // peerId -> RTCPeerConnection
  private remoteStreams: Map<string, { audio?: MediaStream; screen?: MediaStream; camera?: MediaStream }> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private candidateBuffers: Map<string, any[]> = new Map();

  constructor() {
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  public connect(url: string, user: User, serverId: string, password?: string) {
    if (this.ws) {
      this.disconnect();
    }

    this.currentUrl = url;
    this.currentUser = user;
    this.currentServerId = serverId;
    this.currentPassword = password;

    // When the web application is running over HTTPS, modern browsers block plain insecure ws://
    // connections to remote IP addresses due to Mixed Content policies.
    // We automatically and transparently route through our secure /ws-proxy tunnel!
    let targetConnectUrl = url;
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      url.startsWith('ws://')
    ) {
      const isLocalHost = url.includes('localhost') || url.includes('127.0.0.1');
      if (!isLocalHost) {
        targetConnectUrl = `wss://${window.location.host}/ws-proxy?target=${encodeURIComponent(url)}`;
      }
    }

    try {
      this.ws = new WebSocket(targetConnectUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection:status', { connected: true, url });

        // Send identify handshake
        this.send({
          type: 'identify',
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            status: user.status,
            customStatus: user.customStatus,
          },
          serverId,
          password,
        });

        // Start ping ticker
        this.startPing();
      };

      this.ws.onmessage = this.handleMessage;

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPing();
        this.emit('connection:status', { connected: false, url });
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error on:', url, err);
        this.emit('connection:error', { error: 'Failed to connect to server', url });
      };
    } catch (err: any) {
      this.isConnected = false;
      this.emit('connection:error', { error: err.message, url });
    }
  }

  public disconnect() {
    this.stopPing();
    this.leaveVoiceChannel();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.emit('connection:status', { connected: false });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.send({ type: 'ping' });
      }
    }, 5000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const { type } = data;

      switch (type) {
        case 'pong': {
          if (this.lastPingTime > 0) {
            this.latency = Math.max(1, Date.now() - this.lastPingTime);
            this.emit('latency', this.latency);
          }
          break;
        }

        case 'proxy:error': {
          console.warn('Proxy error from remote target:', data.message);
          this.emit('connection:error', { error: data.message, url: this.currentUrl });
          break;
        }

        case 'identified': {
          this.emit('server:identified', data);
          break;
        }

        case 'chat:message': {
          playMessageSound();
          this.emit('chat:message', data.message);
          break;
        }

        case 'chat:typing': {
          this.emit('chat:typing', data);
          break;
        }

        case 'chat:reaction_updated': {
          this.emit('chat:reaction_updated', data);
          break;
        }

        case 'channel:created': {
          this.emit('channel:created', data.channel);
          break;
        }

        case 'channel:deleted': {
          this.emit('channel:deleted', data.channelId);
          break;
        }

        case 'member:joined': {
          this.emit('member:joined', data.member);
          break;
        }

        case 'member:left': {
          this.emit('member:left', data.userId);
          break;
        }

        case 'member:updated': {
          this.emit('member:updated', data.member);
          break;
        }

        case 'member:voice_state': {
          this.emit('member:voice_state', data);
          break;
        }

        // Voice signaling
        case 'voice:joined': {
          this.emit('voice:joined', data);
          // Connect WebRTC to existing peers in the room
          if (Array.isArray(data.peers)) {
            data.peers.forEach((peer: VoicePeer) => {
              this.initiatePeerConnection(peer.id, true);
            });
          }
          break;
        }

        case 'voice:peer_joined': {
          this.emit('voice:peer_joined', data);
          // New peer joined, we prepare connection
          this.initiatePeerConnection(data.peer.id, false);
          break;
        }

        case 'voice:peer_left': {
          this.emit('voice:peer_left', data);
          this.closePeerConnection(data.userId);
          break;
        }

        case 'voice:peer_state': {
          this.emit('voice:peer_state', data);
          break;
        }

        case 'webrtc:signal': {
          this.handleWebRTCSignal(data);
          break;
        }

        // Friends & Direct Messaging
        case 'friends:list': {
          this.emit('friends:list', data.friends);
          break;
        }

        case 'friend:request_received': {
          playMessageSound();
          this.emit('friend:request_received', data.friend);
          break;
        }

        case 'friend:request_sent': {
          this.emit('friend:request_sent', data);
          break;
        }

        case 'friend:updated': {
          this.emit('friend:updated', data.friend);
          break;
        }

        case 'friend:removed': {
          this.emit('friend:removed', data.friendId);
          break;
        }

        case 'friend:status_change': {
          this.emit('friend:status_change', data);
          break;
        }

        case 'friend:error': {
          this.emit('friend:error', data.message);
          break;
        }

        case 'dm:message': {
          playMessageSound();
          this.emit('dm:message', data);
          break;
        }

        case 'dm:typing': {
          this.emit('dm:typing', data);
          break;
        }

        case 'dm:history': {
          this.emit('dm:history', data);
          break;
        }

        case 'error': {
          this.emit('server:error', data.message);
          break;
        }
      }
    } catch (e) {
      console.error('Failed to parse incoming WebSocket message:', e);
    }
  }

  // --- Voice & Screen Share & WebRTC Actions ---

  public async joinVoiceChannel(channelId: string) {
    if (this.currentVoiceChannelId === channelId) return;

    // Leave any current voice channel first
    if (this.currentVoiceChannelId) {
      this.leaveVoiceChannel();
    }

    try {
      playJoinSound();

      // Request microphone access
      try {
        this.localAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        // Set up local voice activity detection (VAD)
        this.setupAudioLevelDetection(this.localAudioStream);
      } catch (micErr) {
        console.warn('Microphone permission denied or not available:', micErr);
        this.localAudioStream = null;
      }

      this.currentVoiceChannelId = channelId;
      this.isMuted = false;
      this.isDeafened = false;
      this.isScreenSharing = false;
      this.isCameraOn = false;

      this.send({
        type: 'voice:join',
        channelId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
        isScreenSharing: this.isScreenSharing,
        isCameraOn: this.isCameraOn,
      });

      this.emit('voice:self_joined', { channelId });
    } catch (err: any) {
      console.error('Error joining voice channel:', err);
    }
  }

  public leaveVoiceChannel() {
    if (!this.currentVoiceChannelId) return;

    playLeaveSound();

    this.send({
      type: 'voice:leave',
    });

    // Cleanup local streams
    if (this.stopAudioLevelMeter) {
      this.stopAudioLevelMeter();
      this.stopAudioLevelMeter = null;
    }

    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((t) => t.stop());
      this.localAudioStream = null;
    }

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
      this.localScreenStream = null;
      this.isScreenSharing = false;
    }

    if (this.localCameraStream) {
      this.localCameraStream.getTracks().forEach((t) => t.stop());
      this.localCameraStream = null;
      this.isCameraOn = false;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Remove remote audio elements
    this.remoteAudioElements.forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    this.remoteAudioElements.clear();
    this.remoteStreams.clear();

    const oldChannelId = this.currentVoiceChannelId;
    this.currentVoiceChannelId = null;
    this.isSpeaking = false;

    this.emit('voice:self_left', { channelId: oldChannelId });
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      playMuteSound();
    } else {
      playUnmuteSound();
    }

    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((t) => {
        t.enabled = !this.isMuted;
      });
    }

    if (this.isMuted) {
      this.isSpeaking = false;
    }

    this.updateVoiceState({ isMuted: this.isMuted, isSpeaking: this.isSpeaking });
    this.emit('voice:self_state', { isMuted: this.isMuted, isDeafened: this.isDeafened });
  }

  public toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    if (this.isDeafened) {
      playMuteSound();
      // If deafened, automatically mute microphone as well
      if (!this.isMuted) {
        this.isMuted = true;
        if (this.localAudioStream) {
          this.localAudioStream.getAudioTracks().forEach((t) => {
            t.enabled = false;
          });
        }
      }
    } else {
      playUnmuteSound();
      this.isMuted = false;
      if (this.localAudioStream) {
        this.localAudioStream.getAudioTracks().forEach((t) => {
          t.enabled = true;
        });
      }
    }

    // Mute/unmute all incoming audio elements
    this.remoteAudioElements.forEach((el) => {
      el.muted = this.isDeafened;
    });

    this.updateVoiceState({ isMuted: this.isMuted, isDeafened: this.isDeafened });
    this.emit('voice:self_state', { isMuted: this.isMuted, isDeafened: this.isDeafened });
  }

  public async toggleScreenShare() {
    if (this.isScreenSharing) {
      // Stop screen sharing
      if (this.localScreenStream) {
        this.localScreenStream.getTracks().forEach((t) => t.stop());
        this.localScreenStream = null;
      }
      this.isScreenSharing = false;
      this.updateVoiceState({ isScreenSharing: false });
      this.removeVideoTrackFromPeers('screen');
      this.emit('screenshare:state', { active: false });
      return;
    }

    try {
      playScreenShareSound();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: ({
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 },
        } as any),
        audio: true, // system audio if available
      });

      this.localScreenStream = stream;
      this.isScreenSharing = true;

      // Handle user clicking the native browser "Stop sharing" button
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.isScreenSharing = false;
          this.localScreenStream = null;
          this.updateVoiceState({ isScreenSharing: false });
          this.removeVideoTrackFromPeers('screen');
          this.emit('screenshare:state', { active: false });
        };
      }

      this.addStreamToAllPeers(stream, 'screen');
      this.updateVoiceState({ isScreenSharing: true });
      this.emit('screenshare:state', { active: true, stream });
    } catch (err: any) {
      console.warn('Screen share canceled or failed:', err);
      this.isScreenSharing = false;
    }
  }

  public async toggleCamera() {
    if (this.isCameraOn) {
      if (this.localCameraStream) {
        this.localCameraStream.getTracks().forEach((t) => t.stop());
        this.localCameraStream = null;
      }
      this.isCameraOn = false;
      this.updateVoiceState({ isCameraOn: false });
      this.removeVideoTrackFromPeers('camera');
      this.emit('camera:state', { active: false });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });

      this.localCameraStream = stream;
      this.isCameraOn = true;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.isCameraOn = false;
          this.localCameraStream = null;
          this.updateVoiceState({ isCameraOn: false });
          this.removeVideoTrackFromPeers('camera');
          this.emit('camera:state', { active: false });
        };
      }

      this.addStreamToAllPeers(stream, 'camera');
      this.updateVoiceState({ isCameraOn: true });
      this.emit('camera:state', { active: true, stream });
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      this.isCameraOn = false;
    }
  }

  private updateVoiceState(partial: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
    isCameraOn?: boolean;
    isSpeaking?: boolean;
  }) {
    this.send({
      type: 'voice:state',
      ...partial,
    });
  }

  private setupAudioLevelDetection(stream: MediaStream) {
    if (this.stopAudioLevelMeter) {
      this.stopAudioLevelMeter();
    }

    this.stopAudioLevelMeter = createAudioLevelMeter(
      stream,
      (volume, isSpeaking) => {
        if (this.isMuted) isSpeaking = false;
        if (this.isSpeaking !== isSpeaking) {
          this.isSpeaking = isSpeaking;
          this.updateVoiceState({ isSpeaking });
          this.emit('voice:self_speaking', { isSpeaking, volume });
        }
      },
      0.03
    );
  }

  // --- WebRTC Peer Connection Logic ---

  private initiatePeerConnection(peerId: string, isInitiator: boolean) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Add local audio tracks if present
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream!);
      });
    }

    // Add local screen share tracks if present
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localScreenStream!);
      });
    }

    // Add local camera tracks if present
    if (this.localCameraStream) {
      this.localCameraStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localCameraStream!);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'webrtc:signal',
          targetUserId: peerId,
          channelId: this.currentVoiceChannelId,
          signal: {
            type: 'ice',
            candidate: event.candidate,
          },
        });
      }
    };

    // Remote Track received
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const trackKind = event.track.kind;

      if (!this.remoteStreams.has(peerId)) {
        this.remoteStreams.set(peerId, {});
      }
      const peerStreams = this.remoteStreams.get(peerId)!;

      if (trackKind === 'audio') {
        peerStreams.audio = remoteStream;

        // Create or update HTML audio element to play voice
        let audioEl = this.remoteAudioElements.get(peerId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          this.remoteAudioElements.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.muted = this.isDeafened;
        audioEl.play().catch(() => {});
      } else if (trackKind === 'video') {
        // Distinguish screen share vs camera if labeled, or provide as screenStream
        peerStreams.screen = remoteStream;
      }

      this.emit('voice:remote_stream', {
        peerId,
        stream: remoteStream,
        kind: trackKind,
      });
    };

    if (isInitiator) {
      pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          this.send({
            type: 'webrtc:signal',
            targetUserId: peerId,
            channelId: this.currentVoiceChannelId,
            signal: {
              type: 'offer',
              sdp: pc.localDescription,
            },
          });
        })
        .catch((err) => console.warn('Error creating WebRTC offer:', err));
    }

    return pc;
  }

  private async handleWebRTCSignal(data: any) {
    const { senderUserId, signal } = data;
    let pc = this.peerConnections.get(senderUserId);

    if (!pc) {
      pc = this.initiatePeerConnection(senderUserId, false);
    }

    if (signal.type === 'offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Drain buffered candidates
        const buffered = this.candidateBuffers.get(senderUserId) || [];
        for (const cand of buffered) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        this.candidateBuffers.delete(senderUserId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.send({
          type: 'webrtc:signal',
          targetUserId: senderUserId,
          channelId: this.currentVoiceChannelId,
          signal: {
            type: 'answer',
            sdp: pc.localDescription,
          },
        });
      } catch (err) {
        console.warn('Error handling WebRTC offer:', err);
      }
    } else if (signal.type === 'answer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Drain buffered candidates
        const buffered = this.candidateBuffers.get(senderUserId) || [];
        for (const cand of buffered) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        this.candidateBuffers.delete(senderUserId);
      } catch (err) {
        console.warn('Error setting remote description from answer:', err);
      }
    } else if (signal.type === 'ice' && signal.candidate) {
      try {
        if (!pc.remoteDescription) {
          if (!this.candidateBuffers.has(senderUserId)) {
            this.candidateBuffers.set(senderUserId, []);
          }
          this.candidateBuffers.get(senderUserId)!.push(signal.candidate);
        } else {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Error adding ICE candidate:', err);
      }
    }
  }

  private addStreamToAllPeers(stream: MediaStream, _type: 'screen' | 'camera') {
    this.peerConnections.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      // Renegotiate offer
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          this.peerConnections.forEach((_, peerId) => {
            this.send({
              type: 'webrtc:signal',
              targetUserId: peerId,
              channelId: this.currentVoiceChannelId,
              signal: {
                type: 'offer',
                sdp: pc.localDescription,
              },
            });
          });
        })
        .catch((e) => console.warn('Renegotiation error:', e));
    });
  }

  private removeVideoTrackFromPeers(_type: 'screen' | 'camera') {
    this.peerConnections.forEach((pc) => {
      const senders = pc.getSenders();
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          pc.removeTrack(sender);
        }
      });
    });
  }

  private closePeerConnection(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
  }

  public getRemoteStream(peerId: string) {
    return this.remoteStreams.get(peerId);
  }

  // --- Chat Actions ---

  public sendMessage(channelId: string, text: string, attachments: any[] = [], messageId?: string) {
    this.send({
      type: 'chat:send',
      id: messageId,
      channelId,
      text,
      attachments,
    });
  }

  public sendTyping(channelId: string, isTyping: boolean) {
    this.send({
      type: 'chat:typing',
      channelId,
      isTyping,
    });
  }

  public toggleReaction(channelId: string, messageId: string, emoji: string) {
    this.send({
      type: 'chat:reaction',
      channelId,
      messageId,
      emoji,
    });
  }

  public createChannel(name: string, channelType: 'text' | 'voice', topic: string, category: string) {
    this.send({
      type: 'channel:create',
      name,
      channelType,
      topic,
      category,
    });
  }

  public deleteChannel(channelId: string) {
    this.send({
      type: 'channel:delete',
      channelId,
    });
  }

  public updateUserProfile(updates: Partial<User>) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
      this.send({
        type: 'user:update',
        ...updates,
      });
      this.emit('user:updated', this.currentUser);
    }
  }

  // --- Friends Actions ---
  public getFriends() {
    this.send({ type: 'friends:get' });
  }

  public sendFriendRequest(targetTag: string) {
    this.send({
      type: 'friend:request',
      targetTag,
    });
  }

  public respondFriendRequest(friendId: string, action: 'accept' | 'decline') {
    this.send({
      type: 'friend:respond',
      friendId,
      action,
    });
  }

  public removeFriend(friendId: string) {
    this.send({
      type: 'friend:remove',
      friendId,
    });
  }

  // --- Direct Messages Actions ---
  public getDMs(recipientId: string) {
    this.send({
      type: 'dm:get',
      recipientId,
    });
  }

  public sendDM(recipientId: string, text: string, attachments: any[] = []) {
    this.send({
      type: 'dm:send',
      recipientId,
      text,
      attachments,
    });
  }

  public sendDMTyping(recipientId: string, isTyping: boolean) {
    this.send({
      type: 'dm:typing',
      recipientId,
      isTyping,
    });
  }
}

export const socketService = new SocketService();
