// middleware/validate.middleware.js
import { ZodError } from "zod";

export const validate = ({ body, params, query }) => {
  return (req, res, next) => {
    try {
      if (body) {
        req.validatedBody = body.parse(req.body);
      }

      if (params) {
        req.validatedParams = params.parse(req.params);
      }

      if (query) {
        req.validatedQuery = query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Datos de entrada no válidos",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      return res.status(500).json({
        error: "Error validando la petición",
      });
    }
  };
};