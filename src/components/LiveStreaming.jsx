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



import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

// Use window.location to make it work in any environment
const socketServerUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://your-deployed-server.com";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "username",
      credential: "password",
    },
  ],
};

function LiveStreaming() {
  const [roomName, setRoomName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [shareUrl, setShareUrl] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const remoteDescriptionPromiseRef = useRef(null);

  // Generate shareable URL
  const generateShareUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomName}`;
    setShareUrl(url);
    return url;
  };

  // Check for room in URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const roomParam = queryParams.get("room");
    if (roomParam) {
      setRoomName(roomParam);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("URL copied to clipboard!");
  };

  const toggleTrack = (type) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track =
      type === "video"
        ? stream.getVideoTracks()[0]
        : stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    if (type === "video") setVideoEnabled(track.enabled);
    if (type === "audio") setAudioEnabled(track.enabled);
  };

  const getMediaStream = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mic = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const combinedStream = new MediaStream([
        ...screen.getVideoTracks(),
        ...mic.getAudioTracks(),
      ]);

      return combinedStream;
    } catch (error) {
      console.error("Error accessing media:", error);
      throw error;
    }
  };

  const joinRoom = async () => {
    if (!roomName) return alert("Room cannot be empty");

    try {
      socketRef.current = io(socketServerUrl);
      const socket = socketRef.current;

      // Generate share URL before connecting
      generateShareUrl();

      socket.on("connect", () => {
        socket.emit("joinRoom", roomName);
        setIsConnected(true);
      });

      socket.on("created", async () => {
        try {
          const stream = await getMediaStream();
          localStreamRef.current = stream;
          localVideoRef.current.srcObject = stream;
          setIsCaller(true);
        } catch (error) {
          alert("Failed to get screen access: " + error.message);
        }
      });

      socket.on("joined", async () => {
        try {
          const stream = await getMediaStream();
          localStreamRef.current = stream;
          localVideoRef.current.srcObject = stream;
          socket.emit("ready", roomName);
        } catch (error) {
          alert("Failed to get screen access: " + error.message);
        }
      });

      socket.on("ready", () => {
        if (!isCaller) return;
        createPeerConnection(true);
      });

      socket.on("offer", (desc) => {
        if (isCaller) return;
        createPeerConnection(false, desc);
      });

      socket.on("answer", (desc) => {
        if (isCaller) {
          remoteDescriptionPromiseRef.current =
            rtcPeerConnectionRef.current.setRemoteDescription(desc);
        }
      });

      socket.on("candidate", (e) => {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: e.label,
          candidate: e.candidate,
        });

        if (remoteDescriptionPromiseRef.current) {
          remoteDescriptionPromiseRef.current.then(() => {
            rtcPeerConnectionRef.current.addIceCandidate(candidate);
          });
        }
      });

      socket.on("full", () => {
        alert("Room is full (max 2 users)!");
        window.location.reload();
      });

      socket.on("userDisconnected", () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setIsCaller(true);
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        alert(`Cannot connect to server: ${err.message}`);
      });
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to connect: " + error.message);
    }
  };

  const createPeerConnection = (isOfferer, remoteDesc = null) => {
    const rtc = new RTCPeerConnection(iceServers);
    rtcPeerConnectionRef.current = rtc;

    rtc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("candidate", {
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate,
          room: roomName,
        });
      }
    };

    rtc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    localStreamRef.current
      .getTracks()
      .forEach((track) => rtc.addTrack(track, localStreamRef.current));

    if (isOfferer) {
      rtc
        .createOffer()
        .then((desc) => {
          rtc.setLocalDescription(desc);
          socketRef.current.emit("offer", {
            type: "offer",
            sdp: desc,
            room: roomName,
          });
        })
        .catch(console.error);
    } else if (remoteDesc) {
      remoteDescriptionPromiseRef.current =
        rtc.setRemoteDescription(remoteDesc);
      remoteDescriptionPromiseRef.current
        .then(() => rtc.createAnswer())
        .then((answer) => {
          rtc.setLocalDescription(answer);
          socketRef.current.emit("answer", {
            type: "answer",
            sdp: answer,
            room: roomName,
          });
        })
        .catch(console.error);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current) socketRef.current.disconnect();
    if (rtcPeerConnectionRef.current) rtcPeerConnectionRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    window.location.reload();
  };

  return (
    <div className="container">
      <h2>WebRTC Screen Sharing</h2>

      {!isConnected ? (
        <div className="join-container">
          <input
            type="text"
            placeholder="Enter Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button onClick={joinRoom}>Connect</button>
          {roomName && (
            <div className="share-section">
              <p>Share this link with another participant:</p>
              <input
                type="text"
                value={shareUrl || generateShareUrl()}
                readOnly
              />
              <button onClick={copyToClipboard}>Copy</button>
            </div>
          )}
        </div>
      ) : (
        <div className="streaming-container">
          <div className="remote-video-container">
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>

          <div className="controls">
            <button onClick={() => toggleTrack("video")}>
              {videoEnabled ? "📹" : "🚫📹"}
            </button>
            <button onClick={() => toggleTrack("audio")}>
              {audioEnabled ? "🎤" : "🔇"}
            </button>
            <button onClick={leaveRoom} className="leave-btn">
              Leave
            </button>
          </div>

          <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            className="local-video"
          />
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          font-family: Arial, sans-serif;
        }

        .join-container {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          align-items: center;
        }

        input {
          padding: 10px;
          font-size: 16px;
          width: 300px;
          max-width: 100%;
        }

        button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
        }

        button:hover {
          background: #3367d6;
        }

        .share-section {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .share-section input {
          width: 100%;
        }

        .streaming-container {
          margin-top: 20px;
          position: relative;
        }

        .remote-video-container {
          width: 100%;
          height: 500px;
          background: #222;
          margin-bottom: 20px;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }

        .local-video {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 200px;
          height: 150px;
          border: 2px solid white;
          border-radius: 8px;
        }

        .controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .leave-btn {
          background: #d32f2f;
        }

        .leave-btn:hover {
          background: #b71c1c;
        }
      `}</style>
    </div>
  );
}

export default LiveStreaming;
