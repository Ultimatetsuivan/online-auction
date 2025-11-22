const multer = require("multer");

const MAX_IMAGE_FILES = 20;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per design guidance

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g,"-") + "-" + file.originalname);

    },
});

function fileFilter(req, file, cb){
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
        cb(null, true);

    }else{
        cb(null, false);
    }
}
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: MAX_IMAGE_FILES,
    }
});
module.exports = { upload };
