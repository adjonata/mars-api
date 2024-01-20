import PhotosManifest from "./PhotosManifest";

export default interface Manifest {
  photo_manifest: {
    name: string;
    landing_date: Date;
    launch_date: Date;
    status: string;
    max_sol: number;
    max_date: Date;
    total_photos: number;
    photos: PhotosManifest[];
  };
}
