import React from "react";
import LiveStreaming from "./components/LiveStreaming";

function App() {
  return (
    <div style={{ background: "#121212", color: "#fff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", padding: 20 }}>
        Live Streaming System A
      </h1>
      <LiveStreaming />
    </div>
  );
}

export default App;
