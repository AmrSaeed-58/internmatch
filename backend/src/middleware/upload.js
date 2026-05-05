const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'misc';
    if (file.fieldname === 'resume') subDir = 'resumes';
    else if (file.fieldname === 'profilePicture') subDir = 'profiles';
    else if (file.fieldname === 'companyLogo') subDir = 'logos';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const resumeFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF and DOCX files are allowed', 400), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPG, PNG, and WebP images are allowed', 400), false);
  }
};

const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('resume');

const uploadProfilePicture = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('profilePicture');

const uploadCompanyLogo = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('companyLogo');

module.exports = { uploadResume, uploadProfilePicture, uploadCompanyLogo };
