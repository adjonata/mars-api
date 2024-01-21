import PhotosSync from "@/helpers/PhotosSync";
import { parseISO } from "date-fns";
import { Socket } from "socket.io";

type Message = {
  command: string;
  data: object;
};

export const triggerCommand = (socket: Socket, message: string) => {
  try {
    const { command, data } = JSON.parse(message) as Message;

    switch (command) {
      case "sync-images":
        return commands.syncImages(socket, data);
    }
  } catch (error) {
    console.error("Socket - Error in decode message");
    socket.emit("error", "Invalid command");
    socket.disconnect();
  }
};

const commands = {
  syncImages: (socket: Socket, data: object) => {
    if (
      "minDate" in data === false ||
      typeof data.minDate !== "string" ||
      "maxDate" in data === false ||
      typeof data.maxDate !== "string"
    ) {
      socket.emit("error", { cause: "Invalid dates" });
      socket.disconnect();
      return;
    }

    let minDate: Date;
    let maxDate: Date;
    try {
      minDate = parseISO(data.minDate);
      maxDate = parseISO(data.maxDate);
    } catch (_error) {
      socket.emit("error", { cause: "Invalid date range" });
      socket.disconnect();
      return;
    }
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
  },
};
