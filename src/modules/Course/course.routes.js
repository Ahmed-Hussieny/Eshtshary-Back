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

// New routes for course enrollment
courseRouter.post(
    "/enroll/:courseId",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
        destinationFolder: "PaymentWallets",
        extensions: allowedExtensions.image,
        fields: [{ name: "transactionImage", maxCount: 1 }],
    }),
    expressasyncHandler(courseController.enrollInCourse)
);

courseRouter.post(
    "/acceptPayment/:paymentWalletId",
    userAuth([systemRoles.THERAPIST]),
    expressasyncHandler(courseController.acceptPayment)
);

courseRouter.get(
    "/getEnrolledCourses",
    userAuth([systemRoles.USER]),
    expressasyncHandler(courseController.getEnrolledCourses)
);

// Get detailed information about an enrolled course
courseRouter.get(
    "/getEnrolledCourseDetails/:courseId",
    userAuth([systemRoles.USER]),
    expressasyncHandler(courseController.getEnrolledCourseDetails)
);

courseRouter.get(
    "/getCourses",
    userAuth([systemRoles.USER]),
    expressasyncHandler(courseController.getCourses)
);

export default courseRouter;
