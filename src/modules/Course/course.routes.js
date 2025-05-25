import { Router } from "express";
import * as courseController from "./course.controller.js";
import expressAsyncHandler from 'express-async-handler';
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
    expressAsyncHandler(courseController.createCourse)
);

courseRouter.post(
    "/enrollCourseByCard/:courseId",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
        destinationFolder: "Courses",
        extensions: allowedExtensions.image,
        fields: [{ name: "thumbnail", maxCount: 1 }],
    }),
    expressAsyncHandler(courseController.enrollCourseByCard)
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
    expressAsyncHandler(courseController.enrollInCourse)
);

courseRouter.post(
    "/acceptPayment/:paymentWalletId",
    userAuth([systemRoles.THERAPIST]),
    expressAsyncHandler(courseController.acceptPayment)
);

courseRouter.get(
    "/getEnrolledCourses",
    userAuth([systemRoles.USER]),
    expressAsyncHandler(courseController.getEnrolledCourses)
);

// Get detailed information about an enrolled course
courseRouter.get(
    "/getEnrolledCourseDetails/:courseId",
    userAuth([systemRoles.USER]),
    expressAsyncHandler(courseController.getEnrolledCourseDetails)
);

courseRouter.get(
    "/getCourses",
    userAuth([systemRoles.USER]),
    expressAsyncHandler(courseController.getCourses)
);

courseRouter.get(
    "/generateCertificate/:courseId",
    userAuth([systemRoles.USER]),
    expressAsyncHandler(courseController.generateCertificate)
);


// Get courses by a therapist
courseRouter.get(
    "/get-therapist-courses",
    userAuth([systemRoles.THERAPIST]),
    expressAsyncHandler(courseController.getTherapistCourses)
);

courseRouter.get(
    "/get-therapist-course-details/:courseId",
    userAuth([systemRoles.THERAPIST]),
    expressAsyncHandler(courseController.getTherapistCourseDetails)
);

courseRouter.put(
    "/edit-course-by-therapist/:courseId",
    userAuth([systemRoles.THERAPIST]),
    multerMiddlewareLocal({
        destinationFolder: "Courses",
        extensions: allowedExtensions.image,
        fields: [{ name: "thumbnail", maxCount: 1 }],
    }),
    expressAsyncHandler(courseController.updateCourseByTherapist)
);

courseRouter.post(
    "/webhook",
    expressAsyncHandler(courseController.webhookHandler)
);
export default courseRouter;
