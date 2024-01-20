import { NextFunction, Request, Response } from "express";
import { formatISO } from "date-fns";

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(
    `${req.method} - ${formatISO(new Date(), { format: "extended" }).slice(
      0,
      19
    )} - ${req.path}`
  );
  next();
}
