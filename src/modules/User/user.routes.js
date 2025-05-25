import { Router } from "express";
import * as userController from "./user.controller.js";
import expressAsyncHandler from "express-async-handler";
const userRouter = Router();
userRouter.post("/signup", expressAsyncHandler(userController.signUp));
userRouter.post("/signin", expressAsyncHandler(userController.signIn));
userRouter.post("/verifyEmail/:token", expressAsyncHandler(userController.verifyEmail));
userRouter.post('/forgotPassword', expressAsyncHandler(userController.forgotPassword));
userRouter.post(
    "/verifyResetToken",
    expressAsyncHandler(userController.verifyResetToken)
);
userRouter.put('/resetPassword/:token', expressAsyncHandler(userController.resetPassword));
userRouter.get('/getAllUsers', expressAsyncHandler(userController.getAllUsers));
userRouter.get('/getUser/:id', expressAsyncHandler(userController.getUserById));
userRouter.put('/updateUser/:id', expressAsyncHandler(userController.updateUser));
userRouter.delete('/deleteUser/:id', expressAsyncHandler(userController.deleteUser));
export default userRouter;