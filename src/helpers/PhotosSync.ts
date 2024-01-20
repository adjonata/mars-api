import { Request, Response } from "express";
import Timer, { ITimer } from "@/utils/timer";
import ManifestsModel, { IManifest } from "@/models/manifests.model";
import PhotosModel, { IPhotos } from "@/models/photos.model";
import PhotosService from "@/services/photos.service";

import PhotosManifest from "@/types/PhotosManifest";
import Photo from "@/types/Photo";
import { differenceInDays, parseISO, subDays, addDays } from "date-fns";

interface PhotosRequest extends Request {
  body: {
    minDate: string;
    maxDate: string;
  };
}

interface IPhotosSync {
  totalPhotosAdded: number;
  timer: ITimer | undefined;
  minDate: string;
  maxDate: string;
  maxPeriod: number;
}

export default class PhotosSync implements IPhotosSync {
  totalPhotosAdded = 0;
  timer: ITimer | undefined = undefined;
  minDate = "";
  maxDate = "";
  maxPeriod = 200;

  constructor(request: PhotosRequest, response: Response) {
    this.timer = new Timer();
    this.syncPhotosByPeriod(request, response);
  }

  async syncPhotosByPeriod(request: PhotosRequest, response: Response) {
    const { isoMinDate, isoMaxDate } = this.extractDateFromRequest(request);

    const validPeriod = this.validatePeriodRange();

    if (!validPeriod) {
      return response.status(400).json({
        message: `The maximum period is ${this.maxPeriod} days.`,
      });
    }

    const manifestsFromPeriod = await this.findManifestsByPeriod(
      isoMinDate,
      isoMaxDate
    );

    if (manifestsFromPeriod.length <= 0) {
      return response.status(400).json({
        message: "There are no manifests in that period.",
      });
    }

    const solsToBeSynchronized = await this.comparePhotosOfTheBases(
      manifestsFromPeriod
    );

    if (solsToBeSynchronized.length === 0) {
      return response.status(201).json({
        message: "All photos from this period have already been synced.",
      });
    }

    const photosNotFoundInLocal = await this.findNotFoundPhotosBySun(
      solsToBeSynchronized
    );

    await this.savePhotos(photosNotFoundInLocal).then(() => {
      this.timer?.break();
    });

    return response.status(200).json({
      message: "Success in synchronization!",
      totalPhotosAdded: this.totalPhotosAdded,
      totalSolsAdded: solsToBeSynchronized.length,
      syncSeconds: this.timer?.getSeconds() || 1,
      syncMilliSeconds: this.timer?.getMilliSeconds() || 1,
    });
  }

  extractDateFromRequest(request: PhotosRequest) {
    const { minDate, maxDate } = request.body;

    this.minDate = minDate;
    this.maxDate = maxDate;

    return {
      isoMinDate: parseISO(this.minDate),
      isoMaxDate: parseISO(this.maxDate),
    };
  }

  validatePeriodRange() {
    const [isoMinDate, isoMaxDate] = [
      parseISO(this.minDate),
      parseISO(this.maxDate),
    ];

    return differenceInDays(isoMaxDate, isoMinDate) <= this.maxPeriod;
  }

  async findManifestsByPeriod(isoMinDate: Date, isoMaxDate: Date) {
    return await ManifestsModel.find({
      earth_date: {
        $gte: subDays(isoMinDate, 1),
        $lt: addDays(isoMinDate, 1),
      },
    }).exec();
  }

  async comparePhotosOfTheBases(manifests: IManifest[]) {
    const solsToBeSynchronized: number[] = [];

    for (let manifest of manifests) {
      await PhotosModel.countDocuments(
        { sol: manifest.sol },
        function (err, count) {
          if (err) return;

          if (count !== manifest.total_photos) {
            solsToBeSynchronized.push(manifest.sol);
          }
        }
      );
    }

    return solsToBeSynchronized;
  }

  async findNotFoundPhotosBySun(sols: number[]) {
    const photosNotFound: Photo[] = [];

    for (const sol of sols) {
      await PhotosService.queryBySol(sol).then(async (photos) => {
        let totalPhotosInSol = 0;

        for (const photo of photos) {
          const foundInDatabase = await PhotosModel.findOne({
            id_base: photo.id,
          });
          if (!foundInDatabase) {
            totalPhotosInSol++;
            photosNotFound.push(photo);
          }
        }

        console.log(
          "Sol",
          sol + "/" + sols.length,
          "-",
          totalPhotosInSol,
          `photos to be synchronized`
        );
      });
    }

    console.log("================");
    console.log(photosNotFound.length, "PHOTOS ARE GOING TO BE ADDED");

    return photosNotFound;
  }

  async savePhotos(photos: Photo[]) {
    const photosToSave: IPhotos[] = [];
    for (const photo of photos) {
      photosToSave.push(this.makePhotoToLocalDatabase(photo));
    }

    await PhotosModel.insertMany(photosToSave).then(() => {
      this.totalPhotosAdded = photosToSave.length;
    });
  }

  makePhotoToLocalDatabase(photo: Photo) {
    const { id, camera, earth_date, sol, img_src: src } = photo;

    const splittedSrc = src.split("nasa.gov/")[1];

    return {
      id_base: id,
      camera: camera.name,
      earth_date,
      sol,
      src: splittedSrc,
    } as IPhotos;
  }
}
