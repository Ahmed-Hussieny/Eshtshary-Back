import { Router } from "express";
import * as sessionController from "./session.controller.js";
import expressasyncHandler from 'express-async-handler';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { auth } from "../../middlewares/auth.middleware.js";
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
  "/createSessionWithCard",
  userAuth([systemRoles.USER]),
  multerMiddlewareLocal({
      destinationFolder: "PaymentWallets",
      extensions: allowedExtensions.image,
      fields: [{ name: "transactionImage", maxCount: 1 }],
  }),
  expressasyncHandler(sessionController.createSessionWithCard)
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


sessionRouter.post(
  "/webhook",
  sessionController.webhookHandler
)

sessionRouter.post(
  "/rate-session/:sessionId",
  expressasyncHandler(sessionController.rateSession)
)

sessionRouter.get(
  "/getRates",
  auth([systemRoles.ADMIN]),
  expressasyncHandler(sessionController.getRates)
);

sessionRouter.get(
  "/getShowRates",
  expressasyncHandler(sessionController.getShowRates)
);

sessionRouter.put(
  "/updateRate/:rateId",
  auth([systemRoles.ADMIN]),
  expressasyncHandler(sessionController.updateRate)
);

sessionRouter.delete(
  "/deleteRate/:rateId",
  auth([systemRoles.ADMIN]),
  expressasyncHandler(sessionController.deleteRate)
);

sessionRouter.post(
  "/answerSessionQuestions/:sessionId",
  expressasyncHandler(sessionController.answerSessionQuestions)
)
export default sessionRouter;