import { Router } from "express";
import { verifyJWT } from "@/middlewares/auth";

import PhotosController from "@/controllers/photos/photos.controller";
import MarsIntegration from "@/controllers/manifests/manifests.controller";

import validation from "@/validation/photos.valid";

const PhotosRoutes = Router();

PhotosRoutes.post(
  "/period",
  validation.getByPeriod,
  PhotosController.getByPeriod
);

PhotosRoutes.post(
  "/sync",
  verifyJWT,
  validation.photosSync,
  MarsIntegration.sync_photos
);

export default PhotosRoutes;
