 // types/CustomRequest.ts
import { Request } from "express";

export interface CustomRequest extends Request {
  documentURL?: string;
  file?: Express.Multer.File;
  uploaded?: {
    images: string[];
    files: string[];
    all: string[];
    docs?: any[]
  }
}
