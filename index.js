// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const PORT = 8080;

// // Create HTTP server from Express app
// const server = http.createServer(app);

// // Create Socket.IO server attached to HTTP server
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins, adjust for production!
//     methods: ["GET", "POST"],
//   },
// });

// // Basic Express route
// app.get("/", (req, res) => {
//   res.json({ message: "Socket.io server running" });
// });

// // Socket.IO connection handler
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   // Listen for a custom event from client
//   socket.on("message", (data) => {
//     console.log("Message from client:", data);

//     // Emit a response event back to the client
//     socket.emit("messageResponse", data);
//   });

//   socket.on("qrScanned", (data) => {
//     console.log("response data is", data);
//     socket.emit("messageResponse", data);
//   });
//   socket.on("check", (data) => {
//     console.log("here");
//     console.log(data);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// // Start server
// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 8080;

// Create HTTP server from Express app
const server = http.createServer(app);

// Create Socket.IO server attached to HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins, adjust for production!
    methods: ["GET", "POST"],
  },
});

// Basic Express route
app.get("/", (req, res) => {
  res.json({ message: "Socket.io server running" });
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  // Send a welcome message to confirm connection
  socket.emit("welcome", { message: "Connected to server successfully!" });

  // Listen for a custom event from client
  socket.on("message", (data) => {
    console.log("📨 Message from client:", data);
    // Emit a response event back to the client
    socket.emit("messageResponse", data);
  });

  // Handle QR scan results
  socket.on("qrScanned", (data) => {
    console.log("📱 QR Code scanned:", data);
    socket.emit("messageResponse", data);

    // You might want to broadcast to other clients or handle the data
    // socket.broadcast.emit("qrResult", data);
  });

  // Handle check events with better logging
  socket.on("check", (data) => {
    console.log("✅ Check event received from:", socket.id);
    console.log("📊 Check data:", data);

    // Send acknowledgment back to client
    socket.emit("checkResponse", {
      message: "Check received successfully!",
      timestamp: new Date().toISOString(),
      receivedData: data,
    });
  });

  // Example: Send startScan command (you can trigger this manually or via API)
  socket.on("requestScan", () => {
    console.log("🎯 Scan requested by:", socket.id);
    socket.broadcast.emit("startScan");
  });

  socket.on("response", (data) => {
    console.log("obtained data", data);
    socket.broadcast.emit("response", data);
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("🚨 Socket error:", error);
  });
});

// Add error handling for the server
server.on("error", (error) => {
  console.error("🚨 Server error:", error);
});

io.on("error", (error) => {
  console.error("🚨 Socket.IO error:", error);
});

// Optional: Add a route to manually trigger startScan for testing
app.post("/trigger-scan", (req, res) => {
  console.log("🎯 Manually triggering scan for all connected clients");
  io.emit("startScan");
  res.json({ message: "Scan triggered for all clients" });
});

// Add route to see connected clients
app.get("/clients", (req, res) => {
  const clients = [];
  io.sockets.sockets.forEach((socket) => {
    clients.push({
      id: socket.id,
      connected: socket.connected,
      rooms: Array.from(socket.rooms),
    });
  });
  res.json({
    totalClients: clients.length,
    clients: clients,
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 View connected clients: http://localhost:${PORT}/clients`);
  console.log(
    `🎯 Trigger scan manually: POST http://localhost:${PORT}/trigger-scan`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
