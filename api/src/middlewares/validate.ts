import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type RequestTarget = "body" | "query" | "params";

export function validate(schema: ZodType, target: RequestTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    if (target === "body") {
      req.body = parsed.data;
    } else {
      // Express 5 : query/params sont en lecture seule
      Object.defineProperty(req, target, {
        value: parsed.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
}
