import { Router } from "express";
import * as orderController from "./order.controller.js";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";
import expressAsyncHandler from 'express-async-handler';
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { auth } from '../../middlewares/auth.middleware.js';

const orderRouter = Router();
orderRouter.post("/create-order",
    userAuth([systemRoles.USER]),
    multerMiddlewareLocal({
            destinationFolder: "PaymentWallets",
            extensions: allowedExtensions.image,
            fields: [{ name: "transferReceipt", maxCount: 1 }],
        })
    , expressAsyncHandler(orderController.createOrder));

orderRouter.get("/get-all-orders",
    auth([systemRoles.ADMIN]),
    expressAsyncHandler(orderController.getAllOrders));

orderRouter.put("/change-order-status/:orderId",
    auth([systemRoles.ADMIN]),
    expressAsyncHandler(orderController.changeOrderStatus));
export default orderRouter;