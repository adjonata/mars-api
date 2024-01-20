import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

import mongoose from "mongoose";
import app from "./app";
import socket from "socket.io";
import { openSocket } from "./socket";

const port = process.env.PORT || 3001;

mongoose.set("useCreateIndex", true);

mongoose
  .connect(process.env.CONNECTION!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Application running on port ${port}`);
    });
    openSocket(server);
  })
  .catch((error) => {
    console.log("Mongoose error");
    console.error(error);
  });
