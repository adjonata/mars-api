import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface IAllowed extends Request {
  user?: Object;
}

export async function verifyJWTRequest(
  req: IAllowed,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["authorization"];

  return await verifyJWT(token)
    .then((user) => {
      if (user) {
        req.user = user;
      }
      next();
    })
    .catch(() => {
      return res.status(401).json({ message: "Failed to authenticate token." });
    });
}

export function verifyJWT(token?: string) {
  return new Promise<object>((res, rej) => {
    if (!token) return rej();
    jwt.verify(String(token), String(process.env.SECRET), (err, decoded) => {
      if (err) {
        return rej();
      }
      if (decoded) {
        return res(decoded);
      }
      return rej();
    });
  });
}

export function noLogged(req: IAllowed, res: Response, next: NextFunction) {
  const token = req.headers["authorization"];

  if (!token) return next();

  jwt.verify(String(token), String(process.env.SECRET), (err, decoded) => {
    if (err) {
      return next();
    }

    return res.status(200).json({
      message: "Already logged in.",
    });
  });
}

export function registrationEnabled(
  req: IAllowed,
  res: Response,
  next: NextFunction
) {
  const registrationEnv = Boolean(process.env.ENABLE_REGISTRATION);

  if (registrationEnv) {
    return next();
  } else {
    return res.status(400).json({
      message: "Registration off.",
    });
  }
}
