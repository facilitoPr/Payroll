import path from "path";

export const checkImageFileType = (file: Express.Multer.File) => {
  const filetypes = /jpeg|jpg|png|gif|webp|jfif|svg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  return extname && mimetype;
};

export const checkDocumentFileType = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [
    ".jpeg",
    ".jpg",
    ".png",
    ".gif",
    ".webp",
    ".jfif",
    ".svg",
    ".pdf",
  ];
  const allowedMime = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
  ];

  return allowedExt.includes(ext) && allowedMime.includes(file.mimetype);
};

export const isPdfFile = (file: Express.Multer.File) => {
  return file.mimetype === "application/pdf";
};