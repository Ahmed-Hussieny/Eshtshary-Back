import { checkProductAvailabilityInCart } from "./check-product-in-cart.js";

export const updateProductQuantity = async (userCart, productId, quantity, price, currency) => {
    const isProductAvailable = await checkProductAvailabilityInCart(userCart, productId);
    if (!isProductAvailable) {
        return null;
    }

    userCart?.products.forEach((product) => {
        if (product.productId.toString() === productId.toString()) {
            product.quantity = quantity;
            product.finalPrice = price * quantity;
            product.currency = currency;
        }
    });
    userCart.totalAmount = price * quantity;
    userCart.currency = currency;
    return await userCart.save();
};