import { Router } from "express";

import { verifyJWTRequest } from "@/middlewares/auth";

const ManifestsRoutes = Router();

import SyncController from "@/controllers/sync/sync.controller";
import manifestsController from "@/controllers/manifests/manifests.controller";

ManifestsRoutes.post("/sync", verifyJWTRequest, SyncController.sync_manifests);
ManifestsRoutes.get("/", manifestsController.getAllRoverManifests);

export default ManifestsRoutes;
