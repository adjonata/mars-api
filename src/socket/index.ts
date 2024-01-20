import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import syncController from "@/controllers/sync/sync.controller";
import PhotosSync from "@/helpers/PhotosSync";
import { parseISO } from "date-fns";
import { verifyJWT, verifyRequestJWT } from "@/middlewares/auth";

type Message = {
  command: "sync-images";
  data: {
    minDate: string;
    maxDate: string;
  };
};

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
  }).on("connection", async (socket) => {
    console.log("SOCKET - New user connected");
    socket.on("message", (message: string) => {
      try {
        const messageJson = JSON.parse(message) as Message;

        switch (messageJson.command) {
          case "sync-images":
            const [minDate, maxDate] = [
              parseISO(messageJson.data.minDate),
              parseISO(messageJson.data.maxDate),
            ];
            new PhotosSync({
              syncPeriod: { minDate, maxDate },
              onError(data) {
                socket.emit("error", data);
              },
              onFinish(data) {
                socket.emit("success", data);
              },
              onLog(data) {
                socket.emit("status", data);
              },
            });
            break;
        }
      } catch (error) {
        console.error("SOCKET - Error in decode message");
      }
    });
  });
};
