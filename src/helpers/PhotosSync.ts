import { Request, Response } from "express";
import Timer, { ITimer } from "@/utils/timer";
import ManifestsModel, { IManifest } from "@/models/manifests.model";
import PhotosModel, { IPhotos } from "@/models/photos.model";
import PhotosService from "@/services/photos.service";

import PhotosManifest from "@/types/PhotosManifest";
import Photo from "@/types/Photo";
import {
  differenceInDays,
  parseISO,
  subDays,
  addDays,
  formatISO,
} from "date-fns";

interface PhotosSyncProps {
  totalPhotosAdded: number;
  timer: ITimer | undefined;
  minDate: Date;
  maxDate: Date;
  maxPeriod: number;
}

type SyncPeriod = {
  minDate: Date;
  maxDate: Date;
};
type LogFunc = (message: string) => Promise<void> | void;
interface PhotosSyncConstructor {
  syncPeriod: SyncPeriod;
  onError: (data: { cause: string }) => Promise<void> | void;
  onFinish: (data: {
    totalDays: number;
    totalPhotos: number;
    totalTime?: number;
    message?: string;
  }) => Promise<void> | void;
  onLog: LogFunc;
}

export default class PhotosSync implements PhotosSyncProps {
  totalPhotosAdded = 0;
  timer: ITimer | undefined = undefined;
  minDate = new Date();
  maxDate = new Date();
  maxPeriod = 400;

  constructor(props: PhotosSyncConstructor) {
    this.timer = new Timer();
    this.syncPhotosByPeriod(props);
  }

  async syncPhotosByPeriod(props: PhotosSyncConstructor) {
    const { syncPeriod } = props;
    this.minDate = syncPeriod.minDate;
    this.maxDate = syncPeriod.maxDate;

    const validPeriod = this.validatePeriodRange();

    if (!validPeriod) {
      return props.onError({
        cause: `The maximum period is ${this.maxPeriod} days.`,
      });
    }
    props.onLog(
      `Synchronization is started to period ${formatISO(
        this.minDate
      )} at ${formatISO(this.maxDate)}!`
    );

    const manifestsFromPeriod = await this.findManifestsOfPeriod();

    if (manifestsFromPeriod.length <= 0) {
      return props.onError({
        cause: "There are no manifests in that period.",
      });
    }

    const solsToBeSynchronized = await this.comparePhotosOfTheBases(
      manifestsFromPeriod
    );

    if (solsToBeSynchronized.length === 0) {
      return props.onFinish({
        totalDays: 0,
        totalPhotos: 0,
        totalTime: this.timer?.getSeconds(),
        message: "All photos from this period have already been synced.",
      });
    }

    props.onLog(`${solsToBeSynchronized.length} days need to be synchronized`);

    const photosNotFoundInLocal = await this.findNotFoundPhotosBySun(
      solsToBeSynchronized,
      props.onLog
    );

    props.onLog(
      `${photosNotFoundInLocal.length} photos need to be synchronized`
    );

    await this.savePhotos(photosNotFoundInLocal).then(() => {
      this.timer?.break();
    });

    return props.onFinish({
      message: "Success in synchronization!",
      totalPhotos: this.totalPhotosAdded,
      totalDays: solsToBeSynchronized.length,
      totalTime: this.timer?.getSeconds(),
    });
  }

  validatePeriodRange() {
    return differenceInDays(this.maxDate, this.minDate) <= this.maxPeriod;
  }

  async findManifestsOfPeriod() {
    return await ManifestsModel.find({
      earth_date: {
        $gte: subDays(this.minDate, 1),
        $lt: addDays(this.maxDate, 1),
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

  async findNotFoundPhotosBySun(sols: number[], log: LogFunc) {
    const photosNotFound: Photo[] = [];

    for (const solIndex in sols) {
      const sol = sols[solIndex];
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
        if (totalPhotosInSol > 0) {
          log(
            `Are ${totalPhotosInSol} photos of sol ${sol} to be sync (Sun ${
              Number(solIndex) + 1
            }/${sols.length})`
          );
        }
      });
    }
    return photosNotFound;
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

  async savePhotos(photos: Photo[]) {
    const photosToSave: IPhotos[] = [];
    for (const photo of photos) {
      photosToSave.push(this.makePhotoToLocalDatabase(photo));
    }

    await PhotosModel.insertMany(photosToSave).then(() => {
      this.totalPhotosAdded = photosToSave.length;
    });
  }
}
