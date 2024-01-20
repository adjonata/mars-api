import Rover from "./Rover";
import { CameraDetails } from "./RoversCameras";
export default interface Photo {
  id: number;
  sol: number;
  camera: CameraDetails;
  img_src: string;
  earth_date: Date;
  rover: Rover;
}

export type PhotoRaw = {
  photos: Photo[];
};
