import { Router } from "express";

import { verifyRequestJWT } from "@/middlewares/auth";

const ManifestsRoutes = Router();

import SyncController from "@/controllers/sync/sync.controller";

ManifestsRoutes.post("/sync", verifyRequestJWT, SyncController.sync_manifests);

export default ManifestsRoutes;
