import Product from "../../../DB/Models/product.model.js";
import fs from "fs";
import path from "path";
import { APIFeatures } from "../../utils/api-feature.js";

//& ================ Add Product ================
export const addProduct = async (req, res, next) => {
    const {title, description, priceEg, priceUsd, stock, category} = req.body;
    const isExist = await Product.findOne({title, category});
    if(isExist){
        return next({
            message: "Product already exists",
            cause: 400
        });
    }

    const images = req.files.images.map(file => file.path);
    console.log(images);

    const product = await Product.create({title, description, slug:title.toLowerCase().replace(/ /g, '-'), priceEg, priceUsd, stock, category,
        images:images.map(image => `${process.env.SERVER_URL}/uploads${image.split("/uploads")[1]}`)
    });
    if(!product){
        return next({
            message: "Failed to add product",
            cause: 400
        });
    }
    res.status(201).json({
        success: true,
        message: "تم اضافة المنتج بنجاح",
        product
    });
};

//& ================ Get All Products ================
export const getAllProducts = async (req, res, next) => {
    const {page =1, size, ...search} = req.query;
    const feature = new APIFeatures(req.query, Product.find());
    feature.pagination({page, size});
    feature.search(search);
    const products = await feature.mongooseQuery;
    const queryFilter = {};
    if(search.title) queryFilter.title = { $regex: search.title, $options: 'i' };
    const numberOfPages = Math.ceil(await Product.countDocuments(queryFilter) / (size ? size : 10) )
    res.status(200).json({
        success: true,
        products,
        numberOfPages
    });
};

//& ================ Get Product By Id ================
export const getProductById = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    res.status(200).json({
        success: true,
        product
    });
};

//& ================ Update Product ================
export const updateProduct = async (req, res, next) => {
    const {title, description, priceEg, priceUsd, stock, category, existingImages} = req.body;
    let product = await Product.findById(req.params.id);
    
    // Parse existingImages if it's a string
    const parsedExistingImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    
    if(parsedExistingImages.length !== product.images.length){
        //* delete old images
        const imagesToDelete = product.images.filter(image => !parsedExistingImages.includes(image));
        for(const image of imagesToDelete){
            const imagePath = path.join(
                process.cwd(),
                image.replace(`${process.env.SERVER_URL}`, "")
            );
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
    }

    const newImages = req.files.images?.map(file => file.path) || [];
    const newImagesUrls = newImages.map(image => `${process.env.SERVER_URL}/uploads${image.split("/uploads")[1]}`);
    const images = [];
    
    // Add new images
    for(const image of newImagesUrls){
        if(!images.includes(image)){
            images.push(image);
        }
    }
    
    // Add existing images
    for(const image of parsedExistingImages){
        if(!images.includes(image)){
            images.push(image);
        }
    }

    product = await Product.findByIdAndUpdate(req.params.id, {title, description, priceEg, priceUsd, stock, category,
        images:images
    }, {new:true});
    res.status(200).json({
        success: true,
        message: "تم تحديث المنتج بنجاح",
        product
    });
};

//& ================ Delete Product ================
export const deleteProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if(!product){
        return next(new Error('Product not found', 404));
    }
    //* delete images
    for(const image of product.images){
        const imagePath = path.join(
            process.cwd(),
            image.replace(`${process.env.SERVER_URL}`, "")
        );
        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath);
        }
    }
    //* delete product
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: "تم حذف المنتج بنجاح",
        product
    });
};