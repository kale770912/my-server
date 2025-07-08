import React from "react";
import LiveStreaming from "./components/LiveStreaming";

function App() {
  return (
    <div style={{ background: "#121212", color: "#fff" }}>
      <h1 style={{ textAlign: "center", padding: 20 }}>
        Firecloud Live Streaming
      </h1>
      <LiveStreaming />
    </div>
  );
}

export default App;
