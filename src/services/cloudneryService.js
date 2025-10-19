import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  secure: true
});

// Log the configuration
// console.log(cloudinary.config());

export default cloudinary;