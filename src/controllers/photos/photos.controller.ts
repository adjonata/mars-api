import Photos, { IPhotosDocument } from "@/models/photos.model";
import { Request, Response } from "express";
import { parseISO, differenceInMonths, differenceInDays } from "date-fns";
import { Pagination } from "@/types/Pagination";

interface GetByPeriodBody
  extends Pagination<
    IPhotosDocument[],
    {
      minDate?: string;
      maxDate?: string;
      cameras?: string[];
    }
  > {}

interface GetByPeriodRequest extends Request {
  body: GetByPeriodBody;
}

export default {
  async getByPeriod(req: GetByPeriodRequest, res: Response) {
    let { minDate, maxDate, cameras } = req.body?.filters || {};
    const { itemsPerPage = 10, page = 1 } = req.body;

    if (!minDate || !maxDate) {
      return res.status(400).json({ message: "Invalid period." });
    }

    const [minDateISO, maxDateISO] = [parseISO(minDate), parseISO(maxDate)];

    if (differenceInMonths(maxDateISO, minDateISO) > 2) {
      return res.status(401).json({
        message: "The maximum period is 2 months.",
      });
    }

    if (differenceInDays(maxDateISO, minDateISO) < 1) {
      return res.status(401).json({
        message: "The minimum period is one day.",
      });
    }

    const query: {
      camera?: object;
      earth_date: object;
    } = {
      earth_date: {
        $gte: minDateISO,
        $lte: maxDateISO,
      },
    };

    if (cameras && cameras.length > 0) {
      query["camera"] = {
        $in: cameras,
      };
    }

    const totalItems = await Photos.find(query).countDocuments();

    const photos = await Photos.find(query)
      .skip(page * itemsPerPage)
      .limit(itemsPerPage)
      .then((response) => {
        return response.map((photo) => {
          photo.src = "https://mars.nasa.gov/" + photo.src;
          return photo;
        });
      });

    return res.status(200).json({
      page,
      totalPages: Math.round(totalItems / itemsPerPage),
      totalItems,
      itemsPerPage,
      filters: req.body.filters,
      itemsCount: photos.length,
      items: photos,
    } as GetByPeriodBody);
  },
};
