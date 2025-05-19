    
export const addProductToCart = async (userCart, product, quantity, price, currency) => {
    userCart?.products.push({
        productId: product._id,
        quantity,
        originalPrice: price,
        finalPrice: price * quantity,
        title: product.title,
        currency
    });

    userCart.totalAmount = price * quantity;
    userCart.currency = currency;

    return await userCart.save();
};