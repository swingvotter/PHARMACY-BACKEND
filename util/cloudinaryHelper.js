const cloudinary = require("../config/cloudinaryConfig");

const cloudinaryUploader = async (filePaths, options = {}) => {
  try {
    filePaths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const result = await Promise.all(
      filePaths.map((filePath) => cloudinary.uploader.upload(filePath, options))
    );
    return result;
  } catch (error) {
    console.log(error);
  }
};

const cloudinaryDelete = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { cloudinaryUploader, cloudinaryDelete };
