import { Router } from "express";
import * as orderController from "./order.controller.js";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import expressAsyncHandler from 'express-async-handler';
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
const orderRouter = Router();
orderRouter.post("/create-order",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
            destinationFolder: "PaymentWallets",
            extensions: allowedExtensions.image,
            fields: [{ name: "transferReceipt", maxCount: 1 }],
        })
    , expressAsyncHandler(orderController.createOrder));

export default orderRouter;