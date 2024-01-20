import ManifestsSync from "@/helpers/ManifestsSync";
import PhotosSync from "@/helpers/PhotosSync";
import { Request, Response } from "express";

export default {
  async sync_manifests(req: Request, res: Response) {
    return new ManifestsSync(req, res);
  },
};
