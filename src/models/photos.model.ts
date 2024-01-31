import mongoose, { Schema, Document } from "mongoose";

export interface IPhotos {
  id_base?: number;
  earth_date: Date | string;
  sol: number;
  camera: string;
  src: string;
}

export interface IPhotosDocument extends IPhotos, Document {}

const Photos = new Schema({
  id_base: Schema.Types.Number,
  earth_date: Schema.Types.Date,
  sol: Schema.Types.Number,
  camera: Schema.Types.String,
  src: String,
});

export default mongoose.model<IPhotosDocument>("Photos", Photos);
