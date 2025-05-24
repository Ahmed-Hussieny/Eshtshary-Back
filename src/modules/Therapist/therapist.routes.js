import { Router } from "express";
import * as therapistController from "./therapist.controller.js";
import expressAsyncHandler from "express-async-handler";
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { multerMiddlewareLocal } from '../../middlewares/multer.js';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
const therapistRouter = Router();
therapistRouter.post("/signup", multerMiddlewareLocal({
    destinationFolder: "Therapists",
    extensions: allowedExtensions.document,
    fields: [{ name: "cv", maxCount: 1 },  {name: "professionalCertificates", maxCount: 5}],
  }), expressAsyncHandler(therapistController.signUp));

therapistRouter.post("/acceptTherapist/:id", expressAsyncHandler(therapistController.acceptTherapist));
therapistRouter.put("/addAppointments/:id",
  userAuth([systemRoles.THERAPIST])
  ,expressAsyncHandler(therapistController.addAppointments));

therapistRouter.put("/updateTherapistImage/:id",
  multerMiddlewareLocal({
    destinationFolder: "Therapists",
    extensions: allowedExtensions.image,
    fields: [{ name: "profilePicture", maxCount: 1 }],
  }), expressAsyncHandler(therapistController.updateTherapistImage));

therapistRouter.post("/signin", expressAsyncHandler(therapistController.signIn));
therapistRouter.post("/verifyEmail/:token", expressAsyncHandler(therapistController.verifyEmail));
therapistRouter.post('/forgotPassword', expressAsyncHandler(therapistController.forgotPassword));
therapistRouter.put('/resetPassword/:token', expressAsyncHandler(therapistController.resetPassword));
therapistRouter.get('/getAllTherapists', expressAsyncHandler(therapistController.getAllTherapists));
therapistRouter.get('/getTherapist/:id', expressAsyncHandler(therapistController.getTherapistById));
therapistRouter.get('/getLoggedInTherapist',
  userAuth([systemRoles.THERAPIST])
  , expressAsyncHandler(therapistController.getLoggedInTherapist));
therapistRouter.put('/updateTherapist',
  userAuth([systemRoles.THERAPIST])
, expressAsyncHandler(therapistController.updateTherapist));
therapistRouter.delete('/deleteTherapist/:id', expressAsyncHandler(therapistController.deleteTherapist));
therapistRouter.get('/getAvailableSlots/:id/:date', expressAsyncHandler(therapistController.getAvailableSlots));
therapistRouter.get('/getAllTherapistsForAdmin', expressAsyncHandler(therapistController.getAllTherapistsForAdmin));

therapistRouter.post(
    "/verifyResetToken",
    expressAsyncHandler(therapistController.verifyResetToken)
);
export default therapistRouter;