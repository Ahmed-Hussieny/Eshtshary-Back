import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { allowedExtensions } from '../utils/allowedExtensions.js';

export const multerMiddlewareLocal = ({
    extensions = allowedExtensions.document,
    destinationFolder,
    fields = [{name: 'image', maxCount: 1}]
})=>{
    const destination = path.resolve(`uploads/${destinationFolder}`);
    if(!fs.existsSync(destination)){
        fs.mkdirSync(destination,{recursive:true});
    }
    const storage = multer.diskStorage({
        destination : (req, file, cb)=>{
            //^ cb(error, destination)
            cb(null, destination);
        },
        filename : (req, file, cb)=>{
            //^ cb(error, filename)
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    });
    const fileFilter = (req, file, cb) => {
        // console.log('Uploaded file MIME type:', file.mimetype); // Debugging log
        if (extensions.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type '${file.mimetype}' is not supported`), false);
        }
    };
    const file = multer({fileFilter,storage, limits: {fileSize: 1024*1024*100},}).fields(fields);
    return file;
}