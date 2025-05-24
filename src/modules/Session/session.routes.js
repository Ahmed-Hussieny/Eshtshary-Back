import { Router } from "express";
import * as sessionController from "./session.controller.js";
import expressasyncHandler from 'express-async-handler';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
const sessionRouter = Router();
sessionRouter.post(
  "/createSession",
  userAuth([systemRoles.USER]),
  multerMiddlewareLocal({
      destinationFolder: "PaymentWallets",
      extensions: allowedExtensions.image,
      fields: [{ name: "transactionImage", maxCount: 1 }],
  }),
  expressasyncHandler(sessionController.createSession)
);

sessionRouter.post(
  "/createZoomMeeting/:sessionId",
  // userAuth([systemRoles.USER]),
  expressasyncHandler(sessionController.createZoomMeeting)
);


sessionRouter.get(
  "/getTherapistSessions",
  userAuth([systemRoles.THERAPIST]),
  expressasyncHandler(sessionController.getTherapistSessions)
);

sessionRouter.put(
  "/markSessionAsCompleted/:sessionId",
  userAuth([systemRoles.THERAPIST]),
  expressasyncHandler(sessionController.markSessionAsCompleted)
);
export default sessionRouter;