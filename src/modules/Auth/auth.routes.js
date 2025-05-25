import { Router } from "express";
import * as authController from "./auth.controller.js";
import expressAsyncHandler from "express-async-handler";
const authRouter = Router();
authRouter.post("/signup", expressAsyncHandler(authController.signUp));
authRouter.post("/signin", expressAsyncHandler(authController.signIn));
authRouter.put("/verifyEmail/:token", expressAsyncHandler(authController.verifyEmail));
authRouter.post('/forgotPassword', expressAsyncHandler(authController.forgotPassword));
authRouter.post(
    "/verifyResetToken",
    expressAsyncHandler(authController.verifyResetToken)
);
authRouter.put('/resetPassword/:token', expressAsyncHandler(authController.resetPassword));
authRouter.get('/getAllUsers', expressAsyncHandler(authController.getAllUsers));
authRouter.get('/getUser/:id', expressAsyncHandler(authController.getUserById));
authRouter.put('/updateUser/:id', expressAsyncHandler(authController.updateUser));
authRouter.delete('/deleteUser/:id', expressAsyncHandler(authController.deleteUser));
export default authRouter;