import { Router } from "express";
import * as cartController from "./cart.controller.js";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import expressAsyncHandler from "express-async-handler";
import { systemRoles } from "../../utils/system-roles.js";
const cartRouter = Router();

cartRouter.post(
  "/add-to-cart",
  userAuth([systemRoles.USER]),
  expressAsyncHandler(cartController.addToCart)
);
cartRouter.delete(
  "/remove-from-cart/:productId",
  userAuth([systemRoles.USER]),
  expressAsyncHandler(cartController.removeFromCart)
);
cartRouter.get(
  "/get-cart",
  userAuth([systemRoles.USER]),
  expressAsyncHandler(cartController.getCart)
);
cartRouter.post(
  "/clear-cart",
  userAuth([systemRoles.USER]),
  expressAsyncHandler(cartController.clearCart)
);
cartRouter.put(
  "/update-product-quantity",
  userAuth([systemRoles.USER]),
  expressAsyncHandler(cartController.updateProductQuantityInCart)
);

export default cartRouter;
