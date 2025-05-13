import { Router } from "express";
import * as therapistController from "./therapist.controller.js";
import expressasyncHandler from "express-async-handler";
import { allowedExtensions } from '../../utils/allowedExtensions.js';
import { multerMiddlewareLocal } from '../../middlewares/multer.js';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
const therapistRouter = Router();
therapistRouter.post("/signup", multerMiddlewareLocal({
    destinationFolder: "Therapists",
    extensions: allowedExtensions.document,
    fields: [{ name: "cv", maxCount: 1 },  {name: "professionalCertificates", maxCount: 5}],
  }), expressasyncHandler(therapistController.signUp));

therapistRouter.post("/acceptTherapist/:id", expressasyncHandler(therapistController.acceptTherapist));
therapistRouter.put("/addAppointments/:id",
  userAuth([systemRoles.THERAPIST])
  ,expressasyncHandler(therapistController.addAppointments));

therapistRouter.put("/updateTherapistImage/:id",
  multerMiddlewareLocal({
    destinationFolder: "Therapists",
    extensions: allowedExtensions.image,
    fields: [{ name: "profilePicture", maxCount: 1 }],
  }), expressasyncHandler(therapistController.updateTherapistImage));

therapistRouter.post("/signin", expressasyncHandler(therapistController.signIn));
therapistRouter.post("/verifyEmail/:token", expressasyncHandler(therapistController.verifyEmail));
therapistRouter.post('/forgotPassword', expressasyncHandler(therapistController.forgotPassword));
therapistRouter.put('/resetPassword/:token', expressasyncHandler(therapistController.resetPassword));
therapistRouter.get('/getAllTherapists', expressasyncHandler(therapistController.getAllTherapists));
therapistRouter.get('/getTherapist/:id', expressasyncHandler(therapistController.getTherapistById));
therapistRouter.get('/getLoggedInTherapist',
  userAuth([systemRoles.THERAPIST])
  , expressasyncHandler(therapistController.getLoggedInTherapist));
therapistRouter.put('/updateTherapist',
  userAuth([systemRoles.THERAPIST])
, expressasyncHandler(therapistController.updateTherapist));
therapistRouter.delete('/deleteTherapist/:id', expressasyncHandler(therapistController.deleteTherapist));
therapistRouter.get('/getAvailableSlots/:id/:date', expressasyncHandler(therapistController.getAvailableSlots));
export default therapistRouter;