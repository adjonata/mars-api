import { Router } from "express";

import PhotosController from "@/controllers/photos/photos.controller";

import validation from "@/validation/photos.valid";

const PhotosRoutes = Router();

PhotosRoutes.post(
  "/period",
  validation.getByPeriod,
  PhotosController.getByPeriod
);

export default PhotosRoutes;
