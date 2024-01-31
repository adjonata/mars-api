import Manifests from "@/models/manifests.model";
import { Request, Response } from "express";
import { CallbackError } from "mongoose";

export default {
  async getAllRoverManifests(req: Request, res: Response) {
    return await Manifests.find()
      .then((resAPI) => {
        return res.status(200).json(resAPI);
      })
      .catch((errorAPI: CallbackError) => {
        return res.status(500).json(errorAPI);
      });
  },
};
