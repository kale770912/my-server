import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const LOCAL_IP_ADDRESS = "10.10.40.79"; // Replace with your server IP
const socketServerUrl = `http://${LOCAL_IP_ADDRESS}:3001`;

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function LiveStreaming() {
  const [roomName, setRoomName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Disconnected");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const joinRoom = async () => {
    if (!roomName) return alert("Room cannot be empty");

    setStatusMessage("Connecting...");
    const socket = io(socketServerUrl);
    socketRef.current = socket;

    socket.emit("joinRoom", roomName);

    socket.on("broadcaster", () => {
      setStatusMessage("Connected as viewer");
      console.log("👀 You're a viewer");
    });

    socket.on("viewer", async () => {
      try {
        setStatusMessage("Setting up broadcast...");
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        localStreamRef.current = screen;
        setLocalStream(screen);
        setIsBroadcaster(true);
        setStatusMessage("Broadcasting live");
      } catch (err) {
        console.error("Error capturing screen:", err);
        setStatusMessage("Error capturing screen");
      }
    });

    // ... rest of your socket event handlers remain the same ...
    socket.on("watcher", (id) => {
      const peer = new RTCPeerConnection(iceServers);
      peersRef.current[id] = peer;

      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });

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
        const [stream] = event.streams;
        setRemoteStream(stream);
        setStatusMessage("Watching live stream");
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

    socket.on("clickCoords", ({ x, y }) => {
      const marker = document.createElement("div");
      marker.style.position = "absolute";
      marker.style.width = "10px";
      marker.style.height = "10px";
      marker.style.borderRadius = "50%";
      marker.style.background = "red";
      marker.style.left = `${x * window.innerWidth}px`;
      marker.style.top = `${y * window.innerHeight}px`;
      marker.style.zIndex = 9999;
      document.body.appendChild(marker);
      setTimeout(() => marker.remove(), 1000);
    });

    setIsConnected(true);
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};

    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsBroadcaster(false);
    setStatusMessage("Disconnected");
  };

  // Attach local stream to local video once both are available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote video once both are available
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Send click coordinates to broadcaster
  useEffect(() => {
    if (!isBroadcaster || !localVideoRef.current) return;

    const video = localVideoRef.current;

    const handleClick = (e) => {
      const rect = video.getBoundingClientRect();

      const relativeX = (e.clientX - rect.left) / rect.width;
      const relativeY = (e.clientY - rect.top) / rect.height;

      const absoluteX = e.clientX;
      const absoluteY = e.clientY;

      console.log("📍 Relative Coordinates:", {
        x: relativeX.toFixed(4),
        y: relativeY.toFixed(4),
      });
      console.log("📌 Absolute Coordinates:", { x: absoluteX, y: absoluteY });

      if (socketRef.current) {
        socketRef.current.emit("clickCoords", {
          relativeX,
          relativeY,
          absoluteX,
          absoluteY,
          roomName,
        });
      }

      // Create and show red dot at absolute click location
      const marker = document.createElement("div");
      marker.style.position = "fixed"; // absolute to screen
      marker.style.width = "12px";
      marker.style.height = "12px";
      marker.style.borderRadius = "50%";
      marker.style.backgroundColor = "red";
      marker.style.left = `${absoluteX - 6}px`; // center the dot
      marker.style.top = `${absoluteY - 6}px`;
      marker.style.zIndex = 9999;
      marker.style.pointerEvents = "none";
      document.body.appendChild(marker);

      // Remove after 1 second
      setTimeout(() => marker.remove(), 1000);
    };

    video.addEventListener("click", handleClick);
    return () => video.removeEventListener("click", handleClick);
  }, [isBroadcaster, roomName]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎥 WebRTC Live Streaming</h1>
        <div style={styles.statusIndicator(statusMessage)}>{statusMessage}</div>
      </div>

      {!isConnected ? (
        <div style={styles.joinContainer}>
          <input
            style={styles.input}
            type="text"
            value={roomName}
            placeholder="Enter room name"
            onChange={(e) => setRoomName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && joinRoom()}
          />
          <button style={styles.primaryButton} onClick={joinRoom}>
            Join Room
          </button>
        </div>
      ) : (
        <div style={styles.controls}>
          <button style={styles.dangerButton} onClick={leaveRoom}>
            Leave Room
          </button>
          <div style={styles.roomName}>Room: {roomName}</div>
        </div>
      )}

      <div style={styles.videoContainer}>
        {isBroadcaster ? (
          <div style={styles.videoWrapper}>
            <h3 style={styles.videoLabel}>Your Broadcast</h3>
            <video
              style={{ ...styles.video, cursor: "crosshair" }}
              ref={localVideoRef}
              autoPlay
              muted
            />
          </div>
        ) : remoteStream ? (
          <div style={styles.videoWrapper}>
            <h3 style={styles.videoLabel}>Live Stream</h3>
            <video ref={remoteVideoRef} autoPlay style={{ ...styles.video }} />
          </div>
        ) : (
          <div style={styles.placeholder}>
            {isConnected
              ? "Waiting for stream to start..."
              : "Join a room to begin"}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p style={styles.instructions}>
          {isBroadcaster
            ? "You are broadcasting your screen to viewers"
            : "Click on the video to send pointer coordinates to the broadcaster"}
        </p>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #333",
    paddingBottom: "10px",
  },
  title: {
    margin: 0,
    color: "#4fc3f7",
    fontSize: "28px",
  },
  statusIndicator: (status) => ({
    padding: "6px 12px",
    borderRadius: "20px",
    backgroundColor: status.includes("Error")
      ? "#f44336"
      : status === "Disconnected"
      ? "#757575"
      : status === "Connected" || status.includes("live")
      ? "#4caf50"
      : "#ff9800",
    fontSize: "14px",
    fontWeight: "bold",
  }),
  joinContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    justifyContent: "center",
  },
  input: {
    padding: "10px 15px",
    borderRadius: "4px",
    border: "1px solid #444",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    fontSize: "16px",
    minWidth: "250px",
    outline: "none",
    transition: "border 0.3s",
  },
  primaryButton: {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#2196f3",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  dangerButton: {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#f44336",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#2a2a2a",
    borderRadius: "4px",
  },
  roomName: {
    color: "#9e9e9e",
    fontStyle: "italic",
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    minHeight: "400px",
    backgroundColor: "#000",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "20px",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  videoLabel: {
    position: "absolute",
    top: "10px",
    left: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "5px 10px",
    borderRadius: "4px",
    zIndex: 1,
    margin: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "#000",
  },
  placeholder: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
    color: "#757575",
    fontSize: "18px",
  },
  footer: {
    textAlign: "center",
    color: "#9e9e9e",
    fontSize: "14px",
  },
  instructions: {
    margin: 0,
  },
};

export default LiveStreaming;
