const CallModule = {
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    iceServers: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },

    async initCall(mode) { // mode = 'voice' or 'video'
        const constraints = { audio: true, video: mode === 'video' };
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.peerConnection = new RTCPeerConnection(this.iceServers);

            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            this.peerConnection.ontrack = (event) => {
                this.remoteStream = event.streams[0];
                this.attachRemoteStream(mode);
            };

            // লোকাল ডেটাবেজে কল লগ এন্ট্রি
            const callLog = {
                callId: 'call_' + Date.now(),
                type: mode,
                timestamp: Date.now(),
                status: 'Dialing',
                duration: 0
            };
            await writeData('calls', callLog);
            
            // সিগন্যালিং টোকেন জেনারেশন (সার্ভারলেস শেয়ারিংয়ের জন্য)
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // এই অফার টোকেনটি অন্য ইউজারকে লোকাললি ইনপুট দিতে হবে
            prompt("Copy this P2P Connection Token and send to your peer:", btoa(JSON.stringify(offer)));
            this.startCallTimer();
        } catch (err) {
            console.error("Media Device Error: ", err);
            alert("Could not access camera/microphone.");
        }
    },

    async receiveCall(base64Offer) {
        try {
            const offer = JSON.parse(atob(base64Offer));
            this.peerConnection = new RTCPeerConnection(this.iceServers);
            
            this.peerConnection.ontrack = (event) => {
                this.remoteStream = event.streams[0];
                this.attachRemoteStream('video');
            };

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            prompt("Send this Answer Token back to the caller:", btoa(JSON.stringify(answer)));
        } catch (e) {
            alert("Invalid connection token.");
        }
    },

    attachRemoteStream(mode) {
        if (mode === 'video') {
            let remoteVideo = document.getElementById('remote-video-el') || document.createElement('video');
            remoteVideo.id = 'remote-video-el';
            remoteVideo.srcObject = this.remoteStream;
            remoteVideo.autoplay = true;
            document.getElementById('view-port').appendChild(remoteVideo);
        }
    },

    startCallTimer() {
        let seconds = 0;
        this.timerInterval = setInterval(() => {
            seconds++;
            console.log(`Call Duration: ${seconds}s`);
        }, 1000);
    },

    endCall() {
        clearInterval(this.timerInterval);
        if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
        if (this.peerConnection) this.peerConnection.close();
        alert("Call Disconnected.");
    }
};
