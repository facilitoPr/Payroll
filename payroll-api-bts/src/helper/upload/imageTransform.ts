import path from "path";
import sharp from "sharp";
import { checkImageFileType } from "./fileTypes";

export type ImageFormatOption = "png" | "jpeg" | "webp";

export interface ImageProcessOptions {
  keepOriginal?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  format?: ImageFormatOption;
  quality?: number;
  fit?: "cover" | "contain" | "inside" | "outside" | "fill";
}

export const convertWebPToPNG = async (imageBuffer: Buffer) => {
  try {
    const convertedImage = await sharp(imageBuffer).toFormat("png").toBuffer();
    return convertedImage;
  } catch (error) {
    console.error("Error al convertir la imagen:", error);
    throw new Error("Error al convertir la imagen WebP a PNG");
  }
};

const getDefaultFormatByExtension = (filename: string): ImageFormatOption => {
  const ext = path.extname(filename || "").toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "jpeg";
  if (ext === ".webp") return "webp";

  return "png";
};

export const normalizeAndResize = async (
  file: Express.Multer.File,
  options: ImageProcessOptions = {},
) => {
  const isFileTypeValid = checkImageFileType(file);

  if (!isFileTypeValid) {
    throw new Error("Error: Invalid file type");
  }

  const {
    maxWidth = 1200,
    maxHeight,
    format = getDefaultFormatByExtension(file.originalname),
    quality = 90,
    fit = "inside",
  } = options;

  let imageBuffer = file.buffer;

  /**
   * Si viene WebP y quieres convertirlo, sharp puede leerlo directamente.
   * No es obligatorio convertirlo a PNG antes.
   */
  let processor = sharp(imageBuffer).rotate();

  if (maxWidth || maxHeight) {
    processor = processor.resize({
      width: maxWidth,
      height: maxHeight,
      fit,
      withoutEnlargement: true,
    });
  }

  if (format === "jpeg") {
    return processor
      .jpeg({
        quality,
        mozjpeg: true,
      })
      .toBuffer();
  }

  if (format === "webp") {
    return processor
      .webp({
        quality,
      })
      .toBuffer();
  }

  return processor
    .png({
      compressionLevel: 8,
    })
    .toBuffer();
};