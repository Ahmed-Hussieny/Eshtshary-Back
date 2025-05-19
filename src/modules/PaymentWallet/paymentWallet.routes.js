import { Router } from "express";
import * as paymentWalletController from "./paymentWallet.controller.js";
import expressasyncHandler from "express-async-handler";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";

const paymentWalletRouter = Router();
paymentWalletRouter.post(
  "/createPaymentWallet",
  userAuth([systemRoles.USER]),
  multerMiddlewareLocal({
    destinationFolder: "PaymentWallets",
    extensions: allowedExtensions.image,
    fields: [{ name: "transactionImage", maxCount: 1 }],
  }),
  expressasyncHandler(paymentWalletController.createPaymentWallet)
);

paymentWalletRouter.get(
    "/getAllPaymentWallets",
    userAuth([systemRoles.ADMIN]),
    expressasyncHandler(paymentWalletController.getAllPaymentWallets)
    );

paymentWalletRouter.put(
    "/approvePaymentWallet/:id",
    userAuth([systemRoles.ADMIN]),
    expressasyncHandler(paymentWalletController.approvePaymentWallet)
);
paymentWalletRouter.put(
    "/rejectPaymentWallet/:id",
    userAuth([systemRoles.ADMIN]),
    expressasyncHandler(paymentWalletController.rejectPaymentWallet)
);


paymentWalletRouter.get(
    "/getPaymentWalletForUser",
    userAuth([systemRoles.USER]),
    expressasyncHandler(paymentWalletController.getPaymentWalletForUser)
);

paymentWalletRouter.get(
    "/getPaymentWalletByCourseId/:courseId",
    userAuth([systemRoles.USER]),
    expressasyncHandler(paymentWalletController.getPaymentWalletByCourseId)
);
export default paymentWalletRouter;
