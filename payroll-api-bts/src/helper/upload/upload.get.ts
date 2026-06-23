import { AuthRequest } from "../../middlewares/validate-jwt";

export const getUploadedFileFromMap = (
  req: AuthRequest,
  fieldName: string,
) => {
  const uploadedFilesMap = req.uploadedFilesMap || {};

  const fileUrl = uploadedFilesMap[fieldName];

  if (typeof fileUrl === "string" && fileUrl.trim()) {
    return fileUrl.trim();
  }

  return "";
};

export const getFileUrl = (file: any): string => {
  if (!file) return "";

  if (typeof file === "string") return file;

  return (
    file.url ||
    file.location ||
    file.fileUrl ||
    file.secure_url ||
    file.path ||
    ""
  );
};

export const getUploadedFieldUrl = (req: AuthRequest, fieldName: string): string => {
  const uploaded = req.uploadedFilesMap || {};

  const directUploaded = uploaded[fieldName];

  if (directUploaded) {
    if (Array.isArray(directUploaded)) {
      return getFileUrl(directUploaded[0]);
    }

    return getFileUrl(directUploaded);
  }

  /**
   * Compatibilidad con middlewares que guardan todo en uploaded.images.
   */
  if (Array.isArray(uploaded.images)) {
    const found = uploaded.images.find((item: any) => {
      return (
        item?.fieldname === fieldName ||
        item?.fieldName === fieldName ||
        item?.name === fieldName ||
        item?.key === fieldName
      );
    });

    if (found) return getFileUrl(found);
  }

  const files: any = req.files;

  if (!files) return "";

  /**
   * Multer fields:
   * req.files.logo[0], req.files.cover[0]
   */
  if (!Array.isArray(files) && files[fieldName]?.[0]) {
    return getFileUrl(files[fieldName][0]);
  }

  /**
   * Multer array:
   * req.files = [{ fieldname: "logo", ... }]
   */
  if (Array.isArray(files)) {
    const found = files.find((item: any) => item?.fieldname === fieldName);
    if (found) return getFileUrl(found);
  }

  return "";
};
