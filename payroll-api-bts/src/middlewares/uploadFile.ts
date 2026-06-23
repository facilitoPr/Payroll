// middlewares/uploadFile.ts
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = `file-${uniqueSuffix}${extension}`;
    console.log(
      `📂 Archivo recibido: ${file.originalname} -> Guardado como: ${filename}`
    );
    cb(null, filename);
  },
});

export const uploadComercialFileMiddleware = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
}).single("file");
