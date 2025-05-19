import Cart from "../../../../DB/Models/cart.model.js";

export const addCart = async (userId, product, quantity, price, currency) => {
    const cartObject = {
        userId,
        products: [
            {
                productId: product._id,
                quantity,
                originalPrice: price,
                finalPrice: price * quantity,
                title: product.title
            }
        ],
        totalAmount: price * quantity,
        currency
    };
    const newCart = await Cart.create(cartObject);
    return newCart;
};