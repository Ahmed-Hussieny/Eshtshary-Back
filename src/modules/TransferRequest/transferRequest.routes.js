import { Router } from "express";
import * as transferRequestController from "./transferRequest.controller.js";
import expressAsyncHandler from 'express-async-handler';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.middleware.js";

const transferRequestRouter = Router();

transferRequestRouter.post(
  "/create",
  userAuth([systemRoles.THERAPIST]),
  expressAsyncHandler(transferRequestController.createTransferRequest)
);

transferRequestRouter.get(
  "/get-therapist-transfer-requests",
  userAuth([systemRoles.THERAPIST]),
  expressAsyncHandler(transferRequestController.getTherapistTransferRequests)
);

transferRequestRouter.get(
    "/get-all-transfer-requests",
    auth([systemRoles.ADMIN]),
    expressAsyncHandler(transferRequestController.getAllTransferRequests)
);

transferRequestRouter.put(
    "/update-transfer-request-status/:requestId",
    auth([systemRoles.ADMIN]),
    expressAsyncHandler(transferRequestController.updateTransferRequestStatus)
);
export default transferRequestRouter;