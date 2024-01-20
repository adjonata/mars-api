import { Request, Response } from "express";
import Timer, { ITimer } from "@/utils/timer";
import ManifestsModel from "@/models/manifests.model";
import ManifestsService from "@/services/manifests.service";

import PhotosManifest from "@/types/PhotosManifest";

interface IManifestsSync {
  totalAdded: number;
  daysAdded: Date[];
  timer: ITimer | undefined;
}

export default class ManifestsSync implements IManifestsSync {
  totalAdded = 0;
  daysAdded: Date[] = [];
  timer: ITimer | undefined = undefined;

  constructor(request: Request, response: Response) {
    this.timer = new Timer();
    this.syncAllManifests(response);
  }

  async syncAllManifests(response: Response) {
    try {
      const manifestsAtTheBase = await this.getManifestsAtTheBase();
      const listOfSavedSols = await this.fetchTheListOfSavedSols();

      const manifestsToSave: PhotosManifest[] = [];

      for (let photoManifest of manifestsAtTheBase) {
        if (listOfSavedSols.includes(photoManifest.sol)) continue;
        else {
          manifestsToSave.push(photoManifest);
          this.registerManifestAdded(photoManifest.earth_date);
        }
      }

      if (!manifestsToSave.length) {
        return response
          .status(200)
          .json(
            this.createSuccessfulResponse(
              "All manifests have already been synchronized."
            )
          );
      }

      await this.saveAllManifests(manifestsToSave);

      this.timer?.break();

      const successfullResponse = this.createSuccessfulResponse();

      return response.status(200).json(successfullResponse);
    } catch (error) {
      return response.status(500).json(error);
    }
  }

  createSuccessfulResponse(message?: string) {
    return {
      message: message || "Synchronization success",
      syncSeconds: this.timer?.getSeconds() || 1,
      syncMilliSeconds: this.timer?.getMilliSeconds() || 1,
      totalAdded: this.totalAdded,
      daysAdded: this.daysAdded,
    };
  }

  registerManifestAdded(earth_date: Date) {
    this.daysAdded.push(earth_date);
    this.totalAdded++;
    console.log("Manifests added:", earth_date);
  }

  async saveAllManifests(manifests: PhotosManifest[]) {
    return await ManifestsModel.insertMany(manifests);
  }

  async fetchTheListOfSavedSols(): Promise<number[]> {
    const listOfSavedSols = await this.getTheSavedManifests();
    return listOfSavedSols.map((saved) => saved.sol);
  }

  async getManifestsAtTheBase(): Promise<PhotosManifest[]> {
    return await ManifestsService.getRoverManifests()
      .then((manifests) => manifests.photo_manifest.photos)
      .catch((error) => error);
  }

  async getTheSavedManifests() {
    const savedManifests = await ManifestsModel.find();
    return savedManifests || [];
  }
}
