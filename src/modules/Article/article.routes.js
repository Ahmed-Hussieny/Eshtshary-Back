import { Router } from "express";
import * as articleController from "./article.controller.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { articleEndPoints } from "./article.endPoints.roles.js";
import expressAsyncHandler from 'express-async-handler';
const articleRouter = Router();
articleRouter.post(
  "/add-article",
  auth(articleEndPoints.ADMIN),
  multerMiddlewareLocal({
    destinationFolder: "Articles",
    extensions: allowedExtensions.image,
    fields: [{ name: "image", maxCount: 1 },
      { name:"contentFile", maxCount:1 },
    ],
  }),
  expressAsyncHandler(articleController.addArticle)
);
articleRouter.get("/get-articles", expressAsyncHandler(articleController.getArticles));
articleRouter.get("/get-article/:id", expressAsyncHandler(articleController.getArticleById));
articleRouter.put(
  "/update-article/:id",
  auth(articleEndPoints.ADMIN),
  multerMiddlewareLocal({
    destinationFolder: "Articles",
    extensions: allowedExtensions.image,
    fields: [{ name: "image", maxCount: 1 },
      { name:"contentFile", maxCount:1 },
    ],
  }),
  expressAsyncHandler(articleController.updateArticle)
);
articleRouter.delete("/delete-article/:id",auth(articleEndPoints.ADMIN), expressAsyncHandler(articleController.deleteArticle));
export default articleRouter;
