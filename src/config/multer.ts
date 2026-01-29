const multer = require('multer');
const path = require('path');
import { Request } from 'express';

//configure multer storage
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isMimeTypeOk = allowedTypes.test(file.mimetype);
    const isExtOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isMimeTypeOk && isExtOk) {
        return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
};

const uploads = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export { uploads, storage, fileFilter };
