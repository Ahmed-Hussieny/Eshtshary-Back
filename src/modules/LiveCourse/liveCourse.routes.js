import { Router } from "express";
import * as liveCourseController from "./liveCourse.controller.js";
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import expressAsyncHandler from "express-async-handler";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
const liveCourseRouter = Router();

liveCourseRouter.post(
  "/add-live-course",
  auth(systemRoles.ADMIN),
  multerMiddlewareLocal({
    destinationFolder: "LiveCourses",
    extensions: allowedExtensions.image,
    fields: [{ name: "image", maxCount: 1 }],
  }),
  expressAsyncHandler(liveCourseController.addLiveCourse)
);

liveCourseRouter.get(
    "/get-live-courses",
    expressAsyncHandler(liveCourseController.getLiveCourses)
    );

liveCourseRouter.put(
  "/update-live-course/:id",
  auth(systemRoles.ADMIN),
  multerMiddlewareLocal({
    destinationFolder: "LiveCourses",
    extensions: allowedExtensions.image,
    fields: [{ name: "image", maxCount: 1 }],
  }),
  expressAsyncHandler(liveCourseController.updateLiveCourse)
);

liveCourseRouter.delete(
  "/delete-live-course/:id",
  auth(systemRoles.ADMIN),
  expressAsyncHandler(liveCourseController.deleteLiveCourse)
);

// Enrollment
liveCourseRouter.post(
    "/enroll-live-course-by-card/:courseId",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
        destinationFolder: "Courses",
        extensions: allowedExtensions.image,
        fields: [{ name: "thumbnail", maxCount: 1 }],
    }),
    expressAsyncHandler(liveCourseController.enrollLiveCourseByCard)
);

// New routes for course enrollment
liveCourseRouter.post(
    "/enroll/:courseId",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
        destinationFolder: "PaymentWallets",
        extensions: allowedExtensions.image,
        fields: [{ name: "transactionImage", maxCount: 1 }],
    }),
    expressAsyncHandler(liveCourseController.enrollInLiveCourse)
);

liveCourseRouter.post(
    "/webhook",
    expressAsyncHandler(liveCourseController.webhookHandler)
);
export default liveCourseRouter;
