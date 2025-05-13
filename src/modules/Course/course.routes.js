import { Router } from "express";
import * as courseController from "./course.controller.js";
import expressasyncHandler from 'express-async-handler';
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const courseRouter = Router();

courseRouter.post(
    "/createCourse",
    userAuth([systemRoles.THERAPIST]),
      multerMiddlewareLocal({
        destinationFolder: "Courses",
        extensions: allowedExtensions.image,
        fields: [{ name: "thumbnail", maxCount: 1 }],
      }),
    expressasyncHandler(courseController.createCourse)
);
export default courseRouter;
