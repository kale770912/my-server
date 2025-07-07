// import { useRef, useState } from "react";
// import io from "socket.io-client";

// const LOCAL_IP_ADDRESS = "192.168.0.106"; // Replace with your server IP
// const socketServerUrl = `http://${LOCAL_IP_ADDRESS}:3001`;

// const iceServers = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" }, // public STUN server
//   ],
// };

// function LiveStreaming() {
//   const [roomName, setRoomName] = useState("");
//   const [isConnected, setIsConnected] = useState(false);
//   const [isCaller, setIsCaller] = useState(false);
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [audioEnabled, setAudioEnabled] = useState(true);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const socketRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const rtcPeerConnectionRef = useRef(null);
//   const remoteDescriptionPromiseRef = useRef(null);

//   const toggleTrack = (type) => {
//     const stream = localStreamRef.current;
//     if (!stream) return;
//     const track =
//       type === "video"
//         ? stream.getVideoTracks()[0]
//         : stream.getAudioTracks()[0];
//     track.enabled = !track.enabled;
//     if (type === "video") setVideoEnabled(track.enabled);
//     if (type === "audio") setAudioEnabled(track.enabled);
//   };

//   const joinRoom = async () => {
//     if (!roomName) return alert("Room cannot be empty");

//     socketRef.current = io(socketServerUrl);
//     const socket = socketRef.current;
//     socket.emit("joinRoom", roomName);
//     setIsConnected(true);

//     socket.on("created", async () => {
//       const screen = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//       });
//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       localStreamRef.current = new MediaStream([
//         ...screen.getVideoTracks(),
//         ...mic.getAudioTracks(),
//       ]);
//       localVideoRef.current.srcObject = localStreamRef.current;
//       setIsCaller(true);
//     });

//     socket.on("joined", async () => {
//       const screen = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//       });
//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       localStreamRef.current = new MediaStream([
//         ...screen.getVideoTracks(),
//         ...mic.getAudioTracks(),
//       ]);
//       localVideoRef.current.srcObject = localStreamRef.current;
//       socket.emit("ready", roomName);
//     });

//     socket.on("ready", () => {
//       if (!isCaller) return;
//       const rtc = new RTCPeerConnection(iceServers);
//       rtcPeerConnectionRef.current = rtc;

//       rtc.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit("candidate", {
//             type: "candidate",
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomName,
//           });
//         }
//       };

//       rtc.ontrack = (e) => {
//         remoteVideoRef.current.srcObject = e.streams[0];
//       };

//       localStreamRef.current
//         .getTracks()
//         .forEach((track) => rtc.addTrack(track, localStreamRef.current));

//       rtc.createOffer().then((desc) => {
//         rtc.setLocalDescription(desc);
//         socket.emit("offer", { type: "offer", sdp: desc, room: roomName });
//       });
//     });

//     socket.on("offer", (desc) => {
//       if (isCaller) return;

//       const rtc = new RTCPeerConnection(iceServers);
//       rtcPeerConnectionRef.current = rtc;

//       rtc.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit("candidate", {
//             type: "candidate",
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomName,
//           });
//         }
//       };

//       rtc.ontrack = (e) => {
//         remoteVideoRef.current.srcObject = e.streams[0];
//       };

//       localStreamRef.current
//         .getTracks()
//         .forEach((t) => rtc.addTrack(t, localStreamRef.current));

//       remoteDescriptionPromiseRef.current = rtc.setRemoteDescription(desc);

//       remoteDescriptionPromiseRef.current
//         .then(() => rtc.createAnswer())
//         .then((answer) => {
//           rtc.setLocalDescription(answer);
//           socket.emit("answer", {
//             type: "answer",
//             sdp: answer,
//             room: roomName,
//           });
//         });
//     });

//     socket.on("answer", (desc) => {
//       if (isCaller) {
//         remoteDescriptionPromiseRef.current =
//           rtcPeerConnectionRef.current.setRemoteDescription(desc);
//       }
//     });

//     socket.on("candidate", (e) => {
//       const candidate = new RTCIceCandidate({
//         sdpMLineIndex: e.label,
//         candidate: e.candidate,
//       });

//       if (remoteDescriptionPromiseRef.current) {
//         remoteDescriptionPromiseRef.current.then(() => {
//           rtcPeerConnectionRef.current.addIceCandidate(candidate);
//         });
//       }
//     });

//     socket.on("full", () => {
//       alert("Room is full!");
//       window.location.reload();
//     });

//     socket.on("userDisconnected", () => {
//       remoteVideoRef.current.srcObject = null;
//       setIsCaller(true);
//     });
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 800,
//         margin: "0 auto",
//         padding: 20,
//         textAlign: "center",
//         background: "black",
//       }}
//     >
//       <h2>WebRTC Live Streaming</h2>
//       {!isConnected && (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             gap: 12,
//             marginTop: 20,
//           }}
//         >
//           <input
//             type="text"
//             placeholder="Enter Room"
//             value={roomName}
//             onChange={(e) => setRoomName(e.target.value)}
//             style={{ padding: 10, fontSize: 16, width: 200 }}
//           />
//           <button
//             onClick={joinRoom}
//             style={{ padding: "10px 20px", fontSize: 16 }}
//           >
//             Connect
//           </button>
//         </div>
//       )}
//       {isConnected && (
//         <div
//           style={{
//             marginTop: 30,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           }}
//         >
//           <div
//             style={{
//               width: 600,
//               height: 450,
//               backgroundColor: "#363636",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               style={{ width: "100%", height: "100%", objectFit: "contain" }}
//             ></video>
//           </div>
//           <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
//             <button
//               onClick={() => toggleTrack("video")}
//               style={{ padding: 10, fontSize: 18, background: "blue" }}
//             >
//               {videoEnabled ? "📹" : "🚫📹"}
//             </button>
//             <button
//               onClick={() => toggleTrack("audio")}
//               style={{ padding: 10, fontSize: 18, background: "blue" }}
//             >
//               {audioEnabled ? "🎤" : "🔇"}
//             </button>
//           </div>
//           <video
//             ref={localVideoRef}
//             muted
//             autoPlay
//             style={{
//               width: 200,
//               height: 200,
//               position: "absolute",
//               bottom: 20,
//               right: 20,
//             }}
//           ></video>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LiveStreaming;

//working for local but not for URL

// import { useRef, useState } from "react";
// import io from "socket.io-client";

// const LOCAL_IP_ADDRESS = "10.10.40.79"; // Replace with your server IP
// const socketServerUrl = `http://${LOCAL_IP_ADDRESS}:3001`;

// const iceServers = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" }, // public STUN server
//   ],
// };

// function LiveStreaming() {
//   const [roomName, setRoomName] = useState("");
//   const [isConnected, setIsConnected] = useState(false);
//   const [isCaller, setIsCaller] = useState(false);
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [audioEnabled, setAudioEnabled] = useState(true);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const socketRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const rtcPeerConnectionRef = useRef(null);
//   const remoteDescriptionPromiseRef = useRef(null);

//   const toggleTrack = (type) => {
//     const stream = localStreamRef.current;
//     if (!stream) return;
//     const track =
//       type === "video"
//         ? stream.getVideoTracks()[0]
//         : stream.getAudioTracks()[0];
//     track.enabled = !track.enabled;
//     if (type === "video") setVideoEnabled(track.enabled);
//     if (type === "audio") setAudioEnabled(track.enabled);
//   };

//   const joinRoom = async () => {
//     if (!roomName) return alert("Room cannot be empty");

//     socketRef.current = io(socketServerUrl);
//     const socket = socketRef.current;
//     socket.emit("joinRoom", roomName);
//     setIsConnected(true);

//     socket.on("created", async () => {
//       const screen = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//       });
//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       localStreamRef.current = new MediaStream([
//         ...screen.getVideoTracks(),
//         ...mic.getAudioTracks(),
//       ]);
//       localVideoRef.current.srcObject = localStreamRef.current;
//       setIsCaller(true);
//     });

//     socket.on("joined", async () => {
//       const screen = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//       });
//       const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
//       localStreamRef.current = new MediaStream([
//         ...screen.getVideoTracks(),
//         ...mic.getAudioTracks(),
//       ]);
//       localVideoRef.current.srcObject = localStreamRef.current;
//       socket.emit("ready", roomName);
//     });

//     socket.on("ready", () => {
//       if (!isCaller) return;
//       const rtc = new RTCPeerConnection(iceServers);
//       rtcPeerConnectionRef.current = rtc;

//       rtc.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit("candidate", {
//             type: "candidate",
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomName,
//           });
//         }
//       };

//       rtc.ontrack = (e) => {
//         remoteVideoRef.current.srcObject = e.streams[0];
//       };

//       localStreamRef.current
//         .getTracks()
//         .forEach((track) => rtc.addTrack(track, localStreamRef.current));

//       rtc.createOffer().then((desc) => {
//         rtc.setLocalDescription(desc);
//         socket.emit("offer", { type: "offer", sdp: desc, room: roomName });
//       });
//     });

//     socket.on("offer", (desc) => {
//       if (isCaller) return;

//       const rtc = new RTCPeerConnection(iceServers);
//       rtcPeerConnectionRef.current = rtc;

//       rtc.onicecandidate = (e) => {
//         if (e.candidate) {
//           socket.emit("candidate", {
//             type: "candidate",
//             label: e.candidate.sdpMLineIndex,
//             id: e.candidate.sdpMid,
//             candidate: e.candidate.candidate,
//             room: roomName,
//           });
//         }
//       };

//       rtc.ontrack = (e) => {
//         remoteVideoRef.current.srcObject = e.streams[0];
//       };

//       localStreamRef.current
//         .getTracks()
//         .forEach((t) => rtc.addTrack(t, localStreamRef.current));

//       remoteDescriptionPromiseRef.current = rtc.setRemoteDescription(desc);

//       remoteDescriptionPromiseRef.current
//         .then(() => rtc.createAnswer())
//         .then((answer) => {
//           rtc.setLocalDescription(answer);
//           socket.emit("answer", {
//             type: "answer",
//             sdp: answer,
//             room: roomName,
//           });
//         });
//     });

//     socket.on("answer", (desc) => {
//       if (isCaller) {
//         remoteDescriptionPromiseRef.current =
//           rtcPeerConnectionRef.current.setRemoteDescription(desc);
//       }
//     });

//     socket.on("candidate", (e) => {
//       const candidate = new RTCIceCandidate({
//         sdpMLineIndex: e.label,
//         candidate: e.candidate,
//       });

//       if (remoteDescriptionPromiseRef.current) {
//         remoteDescriptionPromiseRef.current.then(() => {
//           rtcPeerConnectionRef.current.addIceCandidate(candidate);
//         });
//       }
//     });

//     socket.on("full", () => {
//       alert("Room is full!");
//       window.location.reload();
//     });

//     socket.on("userDisconnected", () => {
//       remoteVideoRef.current.srcObject = null;
//       setIsCaller(true);
//     });
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 800,
//         margin: "0 auto",
//         padding: 20,
//         textAlign: "center",
//         background: "black",
//       }}
//     >
//       <h2>WebRTC Live Streaming</h2>
//       {!isConnected && (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             gap: 12,
//             marginTop: 20,
//           }}
//         >
//           <input
//             type="text"
//             placeholder="Enter Room"
//             value={roomName}
//             onChange={(e) => setRoomName(e.target.value)}
//             style={{ padding: 10, fontSize: 16, width: 200 }}
//           />
//           <button
//             onClick={joinRoom}
//             style={{ padding: "10px 20px", fontSize: 16 }}
//           >
//             Connect
//           </button>
//         </div>
//       )}
//       {isConnected && (
//         <div
//           style={{
//             marginTop: 30,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           }}
//         >
//           <div
//             style={{
//               width: 600,
//               height: 450,
//               backgroundColor: "#363636",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               style={{ width: "100%", height: "100%", objectFit: "contain" }}
//             ></video>
//           </div>
//           <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
//             <button
//               onClick={() => toggleTrack("video")}
//               style={{ padding: 10, fontSize: 18, background: "blue" }}
//             >
//               {videoEnabled ? "📹" : "🚫📹"}
//             </button>
//             <button
//               onClick={() => toggleTrack("audio")}
//               style={{ padding: 10, fontSize: 18, background: "blue" }}
//             >
//               {audioEnabled ? "🎤" : "🔇"}
//             </button>
//           </div>
//           <video
//             ref={localVideoRef}
//             muted
//             autoPlay
//             style={{
//               width: 200,
//               height: 200,
//               position: "absolute",
//               bottom: 20,
//               right: 20,
//             }}
//           ></video>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LiveStreaming;

////////////////////////////////////////////////////////////////////////////////\

// LiveStreaming.jsx

/////////////////////////////////////////////////Working code======================================

import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const LOCAL_IP_ADDRESS = "10.10.40.79";
const socketServerUrl = `http://${LOCAL_IP_ADDRESS}:3001`;

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function LiveStreaming() {
  const [roomName, setRoomName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcaster, setIsBroadcaster] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // multiple peer connections

  const joinRoom = async () => {
    if (!roomName) return alert("Room cannot be empty");
    socketRef.current = io(socketServerUrl);
    const socket = socketRef.current;

    socket.emit("joinRoom", roomName);

    socket.on("broadcaster", async () => {
      console.log("👀 You're a viewer");
    });

    socket.on("viewer", async () => {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      localStreamRef.current = screen;
      localVideoRef.current.srcObject = screen;
      setIsBroadcaster(true);
    });

    socket.on("watcher", (id) => {
      const peer = new RTCPeerConnection(iceServers);
      peersRef.current[id] = peer;

      localStreamRef.current
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStreamRef.current));

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", id, event.candidate);
        }
      };

      peer
        .createOffer()
        .then((sdp) => peer.setLocalDescription(sdp))
        .then(() => {
          socket.emit("offer", id, peer.localDescription);
        });
    });

    socket.on("offer", async (id, description) => {
      const peer = new RTCPeerConnection(iceServers);
      peersRef.current[id] = peer;

      peer
        .setRemoteDescription(description)
        .then(() => peer.createAnswer())
        .then((answer) => peer.setLocalDescription(answer))
        .then(() => {
          socket.emit("answer", id, peer.localDescription);
        });

      peer.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", id, event.candidate);
        }
      };
    });

    socket.on("answer", (id, description) => {
      peersRef.current[id]?.setRemoteDescription(description);
    });

    socket.on("candidate", (id, candidate) => {
      peersRef.current[id]?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("disconnectPeer", (id) => {
      if (peersRef.current[id]) {
        peersRef.current[id].close();
        delete peersRef.current[id];
      }
    });

    setIsConnected(true);
  };

  return (
    <div style={{ background: "black", color: "white", padding: 20 }}>
      <h2>🖥 WebRTC Screen Replication</h2>
      {!isConnected && (
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={roomName}
            placeholder="Room name"
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      )}
      {isBroadcaster ? (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          style={{ width: "90%", marginTop: 20 }}
        ></video>
      ) : (
        <video
          ref={remoteVideoRef}
          autoPlay
          style={{ width: "90%", marginTop: 20 }}
        ></video>
      )}
    </div>
  );
}

export default LiveStreaming;

/////////////////////////////////////////////////Working code======================================

// File: LiveStreaming.jsx











