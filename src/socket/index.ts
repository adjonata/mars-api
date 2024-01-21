import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import PhotosSync from "@/helpers/PhotosSync";
import { parseISO } from "date-fns";
import { verifyJWT } from "@/middlewares/auth";
import { triggerCommand } from "./commands";

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
  }).on("connection", (socket) => {
    console.log(`Socket - New user connected`);

    socket.on("message", (message: string) => {
      triggerCommand(socket, message);
    });
  });
};
