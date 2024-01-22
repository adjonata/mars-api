import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyJWT } from "@/middlewares/auth";
import { SyncImagesData, commands } from "./commands";

export const openSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.headers?.authorization;
    await verifyJWT(token)
      .then(() => next())
      .catch(() => {
        next(new Error());
        return;
      });
  }).on("connection", (socket: Socket) => {
    console.log(`Socket - New user connected`);

    socket.on("sync", (message: string) => {
      try {
        commands.syncImages(socket, JSON.parse(message) as SyncImagesData);
      } catch (error) {
        console.error("Error in photos sync", error);
        socket.emit("error", { cause: "Error in photos sync" });
        socket.disconnect();
      }
    });
  });
};
