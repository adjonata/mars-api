import { Router } from "express";

import { verifyJWT } from "@/middlewares/auth";

const ManifestsRoutes = Router();

import MarsIntegration from "@/controllers/manifests/manifests.controller";

ManifestsRoutes.post("/sync", verifyJWT, MarsIntegration.sync_manifests);

export default ManifestsRoutes;
