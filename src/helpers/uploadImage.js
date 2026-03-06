import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadImage = async (filePath, folder = "general") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    // borrar archivo temporal local
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

/**
 * Eliminar imagen de Cloudinary
 * @param {string} publicId public_id guardado en BD
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
  }
};