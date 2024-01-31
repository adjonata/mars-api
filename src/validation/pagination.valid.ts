import { Joi, Segments, celebrate } from "celebrate";

export const paginationValidation = celebrate({
  [Segments.BODY]: Joi.object().keys({
    page: Joi.number().optional(),
    totalPages: Joi.number().optional(),
    totalItems: Joi.number().optional(),
    itemsPerPage: Joi.number().optional(),
    filters: Joi.object().optional(),
    items: Joi.array().optional(),
    itemsCount: Joi.number().optional(),
  }),
});
