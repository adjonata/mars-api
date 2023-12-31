import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

import mongoose from "mongoose";
import app from "./app";

const port = process.env.PORT || 3000;;

mongoose.set("useCreateIndex", true);

mongoose
  .connect(process.env.CONNECTION!, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Application running on port ${port}`);
    });
  })
  .catch(error => {
    console.log("Mongoose error");
    console.error(error);
  });
