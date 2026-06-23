import { Response, NextFunction } from "express";
import multer from "multer";
import { Endpoint, S3 } from "aws-sdk";
import path from "path";
import crypto from "crypto";
import { CustomRequest } from "../types/CustomRequest";

// --------------------
// Configuración S3 y Multer
// --------------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  // Opcional: limita tamaño total por archivo
  // limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const spacesEndPoint = new Endpoint(process.env.ENDPOINTSPACE as string);

const awsS3 = new S3({
  endpoint: spacesEndPoint,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  s3ForcePathStyle: true, // recomendable con Spaces
});

// --------------------
// Validación de tipos
// --------------------
const ALLOWED_MIMES = [
  // imágenes
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  // hojas de cálculo
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // comprimidos
  "application/zip",
  "application/x-zip-compressed",
  // audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/aac",
  // video
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

const checkFileType = (file: Express.Multer.File) => {
  const okByMime = ALLOWED_MIMES.includes((file.mimetype || "").toLowerCase());
  // Si quieres permitir todo, devuelve true aquí y elimina la lista:
  // return true;
  if (okByMime) return true;

  // fallback por extensión (opcional)
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const allowedExt = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "pdf",
    "doc",
    "docx",
    "txt",
    "xls",
    "xlsx",
    "csv",
    "zip",
    "mp3",
    "wav",
    "m4a",
    "aac",
    "mp4",
    "mov",
    "avi",
    "mkv",
  ];
  return allowedExt.includes(ext);
};

// --------------------
// Subida a DigitalOcean Spaces
// --------------------
const uploadDocumentToAWSS3 = async (
  file: Express.Multer.File,
  folder: string
) => {
  const ext = path.extname(file.originalname) || "";
  const randomName = crypto.randomBytes(16).toString("hex");
  const key = `${folder}/${new Date()
    .toISOString()
    .slice(0, 10)}/${randomName}${ext}`;

  const uploadResult = await awsS3
    .upload({
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype || "application/octet-stream",
    })
    .promise();

  return { url: uploadResult.Location, key };
};

// --------------------
// Helper para borrar por URL
// --------------------
const extractKeyFromUrl = (url: string) => {
  // Asumiendo Location como https://<space>.<region>.digitaloceanspaces.com/<Key>
  const idx = url.indexOf(".com/");
  if (idx === -1) return null;
  return url.substring(idx + 5);
};

// --------------------
// Middleware: cualquier campo (any)
// --------------------
const processUploadsAny = () => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    // 👇 Acepta cualquier fieldname (cv, photoID, idCopy, etc.)
    upload.any()(req as any, res, (err: any) => {
      if (err) {
        console.error("[processUploadsAny] Error de multer:", err);
        return next(err);
      }

      const files = (req.files as Express.Multer.File[]) || [];
      console.log("[processUploadsAny] Archivos recibidos:", files.length);

      if (!files.length) {
        // sin archivos -> continúa al controller
        return next();
      }

      // Separamos la parte async en un IIFE
      (async () => {
        try {
          // 1) Validar tipos primero
          for (const f of files) {
            if (!checkFileType(f)) {
              throw new Error(
                `Tipo de archivo no permitido: ${f.originalname}`
              );
            }
          }

          // 2) Subir en paralelo a S3 (o DO Spaces)
          const results = await Promise.all(
            files.map((f) => uploadDocumentToAWSS3(f, "documents"))
          );

          const urlsImages: string[] = [];
          const urlsFiles: string[] = [];
          const docs: any[] = [];

          files.forEach((f, i) => {
            const url = results[i].url;
            const isImage = (f.mimetype || "").startsWith("image/");

            if (isImage) urlsImages.push(url);
            else urlsFiles.push(url);

            docs.push({
              fieldname: f.fieldname, // "cv", "photoID", "idCopy", etc.
              originalname: f.originalname,
              mimetype: f.mimetype,
              size: f.size,
              url,
              isImage,
            });
          });

          // 👇 Aquí guardas todo para usarlo en el controller
          req.uploaded = {
            images: urlsImages,
            files: urlsFiles,
            all: [...urlsImages, ...urlsFiles],
            docs,
          };

          console.log("[processUploadsAny] Subidas OK, next()");
          next();
        } catch (error) {
          console.error("[processUploadsAny] Error procesando uploads:", error);
          next(error);
        }
      })();
    });
  };
};


// --------------------
// Middleware: campo fijo (array)
// --------------------
const processUploadsArray = (fieldName = "files") => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    upload.array(fieldName)(req as any, res, async (err) => {
      if (err) return next(err);

      const files = (req.files as Express.Multer.File[]) || [];
      if (!files.length) {
        return next(); // opcional lanzar error
      }

      try {
        for (const f of files) {
          if (!checkFileType(f)) {
            throw new Error(`Tipo de archivo no permitido: ${f.originalname}`);
          }
        }

        const results = await Promise.all(
          files.map((f) => uploadDocumentToAWSS3(f, "problem-reports"))
        );

        const urlsImages: string[] = [];
        const urlsFiles: string[] = [];

        files.forEach((f, i) => {
          const url = results[i].url;
          if ((f.mimetype || "").startsWith("image/")) urlsImages.push(url);
          else urlsFiles.push(url);
        });

        req.uploaded = {
          images: urlsImages,
          files: urlsFiles,
          all: [...urlsImages, ...urlsFiles],
        };

        return next();
      } catch (error) {
        console.error("[processUploadsArray] ", error);
        return next(error);
      }
    });
  };
};

// --------------------
// Subida de documento único (campo: document)
// --------------------
const processDocumentUpload = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  upload.single("document")(req as any, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      if (!checkFileType(req.file)) {
        throw new Error("Error: Invalid document type");
      }

      const uploadedFile = await uploadDocumentToAWSS3(req.file, "documentos");
      req.documentURL = uploadedFile.url;
      next();
    } catch (error) {
      console.error(error);
      next(error);
    }
  });
};

const processDocumentUploadContract = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  upload.single("document")(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new Error("Error: No document uploaded"));

    try {
      const isFileTypeValid = checkFileType(req.file);
      if (!isFileTypeValid) {
        throw new Error("Error: Invalid document type");
      }

      const uploadedFile = await uploadDocumentToAWSS3(req.file, "contratos");
      req.documentURL = uploadedFile.url;
      next();
    } catch (error) {
      console.error(error);
      next(error);
    }
  });
};

// ----------
// Documents and images
// --------
const sanitizeFolder = (input: any) => {
  const raw = String(input || "").trim();
  // solo permite letras, números, /, -, _
  const cleaned = raw.replace(/[^a-zA-Z0-9/_-]/g, "");
  // quita dobles slash
  return cleaned.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
};

const resolveFolderFromReq = (req: any) => {
  // prioridad: params > body > query
  const fromParams = req.params?.folder;
  const fromBody = req.body?.folder;
  const fromQuery = req.query?.folder;
  const folder = sanitizeFolder(fromParams || fromBody || fromQuery);
  return folder || "uploads"; // fallback
};


export const processUploadsGeneral = (opts?: {
  folderParamName?: string; // si quieres usar otro param distinto a "folder"
  basePrefix?: string;
  maxDocuments?: number;
  maxImages?: number;
}) => {
  const {
    folderParamName = "folder",
    basePrefix = "",
    maxDocuments = 10,
    maxImages = 10,
  } = opts || {};

  return (req: CustomRequest, res: Response, next: NextFunction) => {
    upload.fields([
      { name: "documents", maxCount: maxDocuments },
      { name: "images", maxCount: maxImages },
    ])(req as any, res, async (err: any) => {
      if (err) return next(err);

      const docs = ((req.files as any)?.documents ||
        []) as Express.Multer.File[];
      const imgs = ((req.files as any)?.images || []) as Express.Multer.File[];

      const all = [...docs, ...imgs];
      if (!all.length) return next();

      try {
        // ✅ valida tipos usando tu helper actual
        for (const f of all) {
          if (!checkFileType(f)) {
            throw new Error(`Tipo de archivo no permitido: ${f.originalname}`);
          }
        }

        // ✅ folder dinámico (puede venir por params/body/query)
        // si quieres usar paramName distinto, lo tomas aquí:
        const folderRaw =
          req.params?.[folderParamName] ?? resolveFolderFromReq(req);
        const folderSafe = sanitizeFolder(folderRaw);

        const folderBase = sanitizeFolder(
          basePrefix ? `${basePrefix}/${folderSafe}` : folderSafe
        );

        // ✅ subimos a una MISMA carpeta base, separando por tipo
        const uploadsResults = await Promise.all(
          all.map((f) => {
            const isImage = (f.mimetype || "").startsWith("image/");
            const folder = `${folderBase}/${isImage ? "images" : "documents"}`;
            return uploadDocumentToAWSS3(f, folder); // tu helper actual
          })
        );

        const uploadedDocs: any[] = [];
        const imagesUrls: string[] = [];
        const filesUrls: string[] = [];

        all.forEach((f, i) => {
          const url = uploadsResults[i].url;
          const isImage = (f.mimetype || "").startsWith("image/");
          if (isImage) imagesUrls.push(url);
          else filesUrls.push(url);

          uploadedDocs.push({
            fieldname: f.fieldname, // "documents" o "images"
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            url,
            isImage,
          });
        });

        req.uploaded = {
          images: imagesUrls,
          files: filesUrls,
          all: [...imagesUrls, ...filesUrls],
          docs: uploadedDocs,
        };

        return next();
      } catch (e) {
        return next(e);
      }
    });
  };
};

// --------------------
// Eliminar documento de DigitalOcean
// --------------------
const deleteDocument = async (url: string) => {
  const key = extractKeyFromUrl(url);
  if (!key) return;

  const params = {
    Bucket: process.env.BUCKET_NAME as string,
    Key: key,
  };

  try {
    await awsS3.deleteObject(params).promise();
    console.log("Documento eliminado correctamente.");
  } catch (error: any) {
    if (error.code === "NoSuchKey") {
      console.log("El documento no existe en el espacio.");
    } else {
      console.error("Error al eliminar el documento:", error);
    }
  }
};

// --------------------
// Exportaciones
// --------------------
export {
  processDocumentUpload,
  deleteDocument,
  processUploadsAny,
  processUploadsArray,
  processDocumentUploadContract,
};
