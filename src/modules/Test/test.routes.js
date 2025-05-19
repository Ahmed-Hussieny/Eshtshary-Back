import { Router } from "express";
import * as testController from "./test.controller.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { systemRoles } from "../../utils/system-roles.js";
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import expressAsyncHandler from "express-async-handler";
const testRouter = Router();

testRouter.post("/create",
    userAuth([systemRoles.THERAPIST]),
    multerMiddlewareLocal({
    destinationFolder: "Tests",
    extensions: allowedExtensions.image,
    fields: [{ name: "image", maxCount: 1 }],
  }), expressAsyncHandler(testController.createTest));

testRouter.get("/getTests", expressAsyncHandler(testController.getTests));
testRouter.get("/getTestById/:id", expressAsyncHandler(testController.getTestById));
testRouter.post("/answerTest/:id", expressAsyncHandler(testController.answerTest));
testRouter.put("/updateTest/:id",
  multerMiddlewareLocal({
  destinationFolder: "Tests",
  extensions: allowedExtensions.image,
  fields: [{ name: "image", maxCount: 1 }],
}), expressAsyncHandler(testController.updateTest));
testRouter.delete("/deleteTest/:id", expressAsyncHandler(testController.deleteTest));

export default testRouter;