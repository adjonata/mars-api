import { Router } from "express";

import { verifyJWTRequest } from "@/middlewares/auth";

const ManifestsRoutes = Router();

import SyncController from "@/controllers/sync/sync.controller";

ManifestsRoutes.post("/sync", verifyJWTRequest, SyncController.sync_manifests);

export default ManifestsRoutes;
