import { Request, Response, NextFunction } from "express";
import { upload } from "./upload";
import { uploadRawFileToSpaces } from "../../helper/upload/uploadRawFileToSpaces";
import { uploadImageToSpaces } from "../../helper/upload/uploadImageToSpaces";
import { normalizeAndResize } from "../../helper/upload/imageTransform";
import {
  checkDocumentFileType,
  checkImageFileType, isPdfFile,
} from "../../helper/upload/fileTypes";

export interface CustomRequest extends Request {
  user?: any;
  uploadedFilesMap?: Record<string, string | string[] | undefined>;
}

export type ImageFormatOption = "png" | "jpeg" | "webp";

export interface ImageProcessOptions {
  /**
   * Si true, sube el archivo original sin resize ni conversión.
   * Útil si quieres conservar exactamente la calidad original.
   */
  keepOriginal?: boolean;

  /**
   * Ancho máximo. Si la imagen es menor, no la agranda.
   */
  maxWidth?: number;

  /**
   * Alto máximo opcional.
   */
  maxHeight?: number;

  /**
   * Formato final.
   */
  format?: ImageFormatOption;

  /**
   * Calidad para jpeg/webp.
   * Recomendado: 85 - 95.
   */
  quality?: number;

  /**
   * Fit de sharp.
   */
  fit?: "cover" | "contain" | "inside" | "outside" | "fill";
}

export interface UploadFieldConfig {
  name: string;
  maxCount: number;
  folder?: string;
  kind?: "image" | "document" | "file";
  imageOptions?: ImageProcessOptions;
}

export const createUploadFieldsProcessor =
  (fields: UploadFieldConfig[]) =>
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    upload.fields(
      fields.map((field) => ({
        name: field.name,
        maxCount: field.maxCount,
      })),
    )(req, res, async (err) => {
      if (err) return next(err);

      try {
        const filesByField = (req.files || {}) as Record<
          string,
          Express.Multer.File[]
        >;

        req.uploadedFilesMap = {};

        for (const field of fields) {
          const incomingFiles = Array.isArray(filesByField?.[field.name])
            ? filesByField[field.name]
            : [];

          if (!incomingFiles.length) {
            req.uploadedFilesMap[field.name] =
              field.maxCount === 1 ? undefined : [];
            continue;
          }

          const urls: string[] = [];

          for (const file of incomingFiles) {
            const kind = field.kind || "document";
            const folder = field.folder || "perfil";

            if (kind === "file") {
              const uploaded = await uploadRawFileToSpaces(file, folder);
              urls.push(uploaded.url);
              continue;
            }

            if (kind === "image") {
              if (!checkImageFileType(file)) {
                throw new Error(`El campo ${field.name} solo permite imágenes`);
              }

              if (field.imageOptions?.keepOriginal) {
                const uploaded = await uploadRawFileToSpaces(file, folder);
                urls.push(uploaded.url);
                continue;
              }

              const resizedBuffer = await normalizeAndResize(
                file,
                field.imageOptions,
              );
              const uploaded = await uploadImageToSpaces(resizedBuffer, folder);
              urls.push(uploaded.url);
              continue;
            }

            if (!checkDocumentFileType(file)) {
              throw new Error(
                `El campo ${field.name} solo permite imágenes o PDF`,
              );
            }

            if (isPdfFile(file)) {
              const uploaded = await uploadRawFileToSpaces(file, folder);
              urls.push(uploaded.url);
              continue;
            }

            const resizedBuffer = await normalizeAndResize(file);
            const uploaded = await uploadImageToSpaces(resizedBuffer, folder);
            urls.push(uploaded.url);
          }

          req.uploadedFilesMap[field.name] =
            field.maxCount === 1 ? urls[0] : urls;
        }

        return next();
      } catch (error) {
        console.log("createUploadFieldsProcessor error:", error);
        return next(error);
      }
    });
  };
