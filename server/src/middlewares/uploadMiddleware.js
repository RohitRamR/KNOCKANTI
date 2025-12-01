const multer = require('multer');
const path = require('path');

// Set storage engine (Memory storage for processing without saving to disk, or Disk storage)
// For CSV processing, memory storage is often easier if files are small.
const storage = multer.memoryStorage();

// Check file type
const checkFileType = (file, cb) => {
    const filetypes = /csv|jpeg|jpg|png|webp|avif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images (jpeg, jpg, png, webp) or CSV Files Only!');
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
