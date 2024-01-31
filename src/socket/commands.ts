import PhotosSync from "@/helpers/PhotosSync";
import { parseISO } from "date-fns";
import { Socket } from "socket.io";

export type SyncImagesData = {
  minDate: string;
  maxDate: string;
};

export const commands = {
  syncImages: (socket: Socket, data: SyncImagesData) => {
    if (
      typeof data !== "object" ||
      "minDate" in data === false ||
      typeof data.minDate !== "string" ||
      "maxDate" in data === false
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
        socket.disconnect();
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
