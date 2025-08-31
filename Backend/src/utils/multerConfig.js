import multer from 'multer';
import path from 'path';

// Set up storage configuration for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Different directories for activities and events
    const uploadPath = req.params.type === 'activity' ? './uploads/activities' : './uploads/events';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Use the current timestamp as the file name
  }
});

// Set up file filtering to only allow image files (JPG, PNG, GIF)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
  }
};

// Initialize multer with storage and file filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // Limit the file size to 5MB
  fileFilter: fileFilter
});

export default upload;
