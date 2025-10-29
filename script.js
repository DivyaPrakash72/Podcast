const room = location.hash.substring(1);
document.getElementById("roomName").innerText = `Room: ${room}`;

const peer = new Peer(); // uses PeerJS cloud
let localStream;
let mediaRecorder;
let recordedChunks = [];

async function init() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const myVideo = document.getElementById("myVideo");
  myVideo.srcObject = localStream;

  peer.on("open", (id) => {
    console.log("My peer ID:", id);
    const joinLink = `${location.origin}${location.pathname}#${room}`;
    console.log("Share this link:", joinLink);

    const conn = peer.connect(room);
    conn.on("open", () => console.log("Connected to room:", room));
  });

  peer.on("call", (call) => {
    call.answer(localStream);
    call.on("stream", (remoteStream) => {
      document.getElementById("peerVideo").srcObject = remoteStream;
    });
  });

  // Try connecting to peer in room
  const call = peer.call(room, localStream);
  if (call) {
    call.on("stream", (remoteStream) => {
      document.getElementById("peerVideo").srcObject = remoteStream;
    });
  }

  // Recording
  const recordBtn = document.getElementById("recordBtn");
  const stopBtn = document.getElementById("stopBtn");
  const downloadLink = document.getElementById("downloadLink");

  recordBtn.onclick = () => {
    recordedChunks = [];
    const mixedStream = new MediaStream([...localStream.getTracks()]);
    mediaRecorder = new MediaRecorder(mixedStream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = "podcast_recording.webm";
      downloadLink.style.display = "inline";
      downloadLink.textContent = "Download Recording";
    };
    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
  };

  stopBtn.onclick = () => {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  };
}

init();
