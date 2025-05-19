import { Router } from "express";
import * as productController from './product.controller.js';
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowedExtensions.js";
import expressasyncHandler from "express-async-handler";
const productRouter = Router();

productRouter.post('/add-product', 
    multerMiddlewareLocal({
        destinationFolder: "Products",
        extensions: allowedExtensions.image,
        fields: [{ name: "images", maxCount: 10 }],
    }),
    expressasyncHandler(productController.addProduct)
);

productRouter.get('/get-all-products', expressasyncHandler(productController.getAllProducts));
productRouter.get('/get-product-by-id/:id', expressasyncHandler(productController.getProductById));
productRouter.put('/update-product/:id', 
    multerMiddlewareLocal({
        destinationFolder: "Products",
        extensions: allowedExtensions.image,
        fields: [{ name: "images", maxCount: 10 }],
    }), expressasyncHandler(productController.updateProduct));

productRouter.delete('/delete-product/:id', expressasyncHandler(productController.deleteProduct));

export default productRouter;