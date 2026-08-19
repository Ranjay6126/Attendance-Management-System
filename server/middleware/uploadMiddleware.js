const multer = require('multer');
const path = require('path');

// For memory storage (to convert to base64)
const memoryStorage = multer.memoryStorage();

const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
};

const upload = multer({
    storage: memoryStorage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

const uploadMiddleware = upload.single('profileImage');

module.exports = { upload, uploadMiddleware };
