import { createServer } from "node:http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { initializeDatabase } from "./config/initializeDatabase.js";
import { attachChatSockets } from "./realtime/chatSockets.js";
async function startServer() {
  await connectDatabase();
  await initializeDatabase();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  app.set("io", io);
  attachChatSockets(io);
  const port = Number(process.env.PORT ?? 3002);
  httpServer.listen(port, "127.0.0.1", () =>
    console.log(`Messenger API running at http://127.0.0.1:${port}`),
  );
  const shutdown = () => {
    io.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
startServer().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
