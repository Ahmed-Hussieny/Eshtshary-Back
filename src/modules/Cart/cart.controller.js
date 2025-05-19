import Cart from "../../../DB/Models/cart.model.js";
import { addCart } from "./utils/add-cart.js";
import { addProductToCart } from "./utils/add-product-to-cart.js";
import { checkProductAvailability } from "./utils/check-product-in-db.js";
import { getUserCart } from "./utils/get-user-cart.js";
import { updateProductQuantity } from "./utils/update-product-quantity.js";

//& ===================== ADD TO CART ===================== &//
export const addToCart = async (req, res, next) => {
    const { productId, quantity = 1, price, currency } = req.body;
    const {_id:userId} = req.authUser;
    console.log({productId, quantity, price, currency, userId});
    // Check if product exists
    const product = await checkProductAvailability(productId, quantity);
    if(!product){
        return next({message: 'Product not found', cause: 404});
    }
    // check if user has cart or not
    const userCart = await getUserCart(userId);
    if(!userCart){ // if user has no cart, create one
        const newCart = await addCart(userId, product, quantity, price, currency);
        if(!newCart){
            return next({message: 'Failed to add product to cart', cause: 500});
        }
        // return new cart
        return res.status(200).json({
            success: true,
            message: 'تمت إضافة المنتج إلى السلة بنجاح',
            cart: newCart
        });
    }
    // if user has cart and product is not in the cart
    const isUpdated = await updateProductQuantity(userCart, productId, quantity, price, currency);
    if(!isUpdated){
        // if product is not in the cart, add it
        const newCart = await addProductToCart(userCart, product, quantity, price, currency);
        if(!newCart){
            return next({message: 'Failed to add product to cart', cause: 500});
        }
    }
    // return updated cart
    return res.status(200).json({
        success: true,
        message: 'Product added to cart successfully',
        cart: userCart
    });
};

//& ===================== REMOVE FROME CART ===================== &//
export const removeFromCart = async (req, res, next) => {
    const { productId } = req.params;
    const {_id:userId} = req.authUser;
    // check if user has cart
    const userCart = await Cart.findOne({userId});
    if(!userCart){
        return next({message: 'Product not found in cart', cause: 404});
    }
    console.log({userCart: userCart.products});
    // remove product from cart
    userCart.products = userCart.products.filter(product => product.productId.toString() !== productId);
    userCart.totalAmount = userCart.products.reduce((acc, product) => acc + product.finalPrice, 0);
    const updatedCart = await userCart.save();
    if(!updatedCart){
        return next({message: 'Failed to remove product from cart', cause: 500});
    }
    // return updated cart
    return res.status(200).json({
        success: true,
        message: 'Product removed from cart successfully',
        cart: updatedCart
    });
};

//& ===================== GET CART ===================== &//
export const getCart = async (req, res, next) => {
    const {_id:userId} = req.authUser;
    // check if user has cart
    const userCart = await getUserCart(userId);
    if(!userCart){
        return next({message: 'Cart not found', cause: 404});
    }
    // return user cart
    return res.status(200).json({
        success: true,
        cart: userCart
    });
};

//& ===================== CLEAR CART ===================== &//
export const clearCart = async (req, res, next) => {
    const {_id:userId} = req.authUser;
    // check if user has cart
    const userCart = await getUserCart(userId);
    if(!userCart){
        return next({message: 'Cart not found', cause: 404});
    }
    // clear cart
    userCart.products = [];
    userCart.totalAmount = 0;
    const updatedCart = await userCart.save();
    if(!updatedCart){
        return next({message: 'Failed to clear cart', cause: 500});
    }
    // return updated cart
    return res.status(200).json({
        success: true,
        message: 'Cart cleared successfully',
        cart: updatedCart
    });
};

//& ===================== handle update Product Quantity ===================== &//
export const updateProductQuantityInCart = async (req, res, next) => {
    const { productId, quantity, currency = "EGP" } = req.body;
    const {_id:userId} = req.authUser;
    // check if user has cart
    const userCart = await getUserCart(userId);
    const product = await checkProductAvailability(productId, quantity);
    if(!product){
        return next({message: 'Product not found', cause: 404});
    }
    console.log({product, userCart});
    const isUpdated = await updateProductQuantity(userCart, productId, quantity, currency==="EGP" ? product.priceEg : product.priceUsd, currency);  
    if(!isUpdated){
        return next({message: 'Failed to update product quantity', cause: 500});
    }
    // return updated cart
    return res.status(200).json({
        success: true,
        message: 'Product quantity updated successfully',
        cart: userCart
    });
};
