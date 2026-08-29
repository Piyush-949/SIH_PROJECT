import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("[KRISHI SETU Server] Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach Socket.IO to the unified HTTP server
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Attach io to global for API routes & backend services
  (global as any).io = io;

  io.on("connection", (socket) => {
    // Client joins a specific centre queue room
    socket.on("join_centre", (centreId: string) => {
      if (centreId) {
        const room = `centre:${centreId}`;
        socket.join(room);
      }
    });

    socket.on("leave_centre", (centreId: string) => {
      if (centreId) {
        socket.leave(`centre:${centreId}`);
      }
    });

    // Client joins a specific booking lifecycle room
    socket.on("join_booking", (bookingId: string) => {
      if (bookingId) {
        socket.join(`booking:${bookingId}`);
      }
    });

    socket.on("leave_booking", (bookingId: string) => {
      if (bookingId) {
        socket.leave(`booking:${bookingId}`);
      }
    });

    // Farmer personal room
    socket.on("join_farmer", (farmerId: string) => {
      if (farmerId) {
        socket.join(`farmer:${farmerId}`);
      }
    });

    // Admin room
    socket.on("join_admin", () => {
      socket.join("admin:analytics");
    });

    // Client disconnect
    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  httpServer.listen(port, () => {
    console.log(`> KRISHI SETU Unified Server running at http://${hostname}:${port}`);
    console.log(`> Real-time Socket.IO active at http://${hostname}:${port}/api/socket`);
    console.log(`> Browser Portal Ready: Open http://${hostname}:${port} in your web browser`);
  });
});
