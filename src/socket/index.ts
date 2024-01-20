import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

type Message = {
  command: "sync-images";
  data: {
    minDate: string;
    maxDate: string;
  };
};

export const openSocket = (server: HttpServer) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("SOCKET - New user connected");
    socket.on("message", (message: string) => {
      try {
        const messageJson = JSON.parse(message) as Message;

        switch (messageJson.command) {
          case "sync-images":
            console.log(messageJson.data);
        }
      } catch (error) {
        console.error("SOCKET - Error in decode message");
      }
    });
  });
};
