import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class ErrorResponse extends Error {
   constructor(
      public message: string = 'Internal server error',
      public statusCode: number = 500,
      public data?: any,
   ) {
      super(message)
      this.name = 'ErrorResponse'
   }
}

export function errorMiddleware(err: ErrorResponse | ZodError, req: Request, res: Response, next: NextFunction): void {
   if (err instanceof ZodError) {
      res.status(400).json({
         message: err.message,
         data: err.flatten().fieldErrors,
      })
      return
   }

   if (err.message !== 'Unauthorized') console.error(err)
   res.status(err.statusCode || 500).json({
      message: err.message,
      data: err.data || null,
   })
}
