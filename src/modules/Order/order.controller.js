import Cart from "../../../DB/Models/cart.model.js";
import Order from "../../../DB/Models/order.model.js";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";

//& ==================== CREATE ORDER ====================
export const createOrder = async (req, res, next) => {
    const { _id:userId } = req.authUser;
    const { paymentMethod, shippingAddress, transferAccount, transferNumber} = req.body;
    console.log(req.body);
    const shippingData = JSON.parse(shippingAddress);
    const userCart = await Cart.findOne({ userId }).populate("products.productId");
    if (!userCart) {
        return next({ message: "Cart not found", status: 404 });
    }
    console.log(userCart.products[0].productId);
    if(paymentMethod === "vodafoneCash" || paymentMethod === "instaPay"){
        if(!req.files.transferReceipt){
            return next({ message: "يرجي ارفاق وصل الدفع", cause: 400 });
        }
        const transferReceipt = `${process.env.SERVER_URL}/uploads${
        req.files.transferReceipt[0].path.split("/uploads")[1]}`;
        const transferNumberOrAccount = transferAccount || transferNumber;
        if(!transferNumberOrAccount){
            return next({ message: "يرجي ارفاق رقم الحساب او رقم الهاتف", cause: 400 });
        }
        console.log(transferNumberOrAccount);
        if(!transferNumberOrAccount.match(/^(010|011|012|015)[0-9]{8}$/)){
            return next({ message: "يرجي ارفاق رقم حساب صحيح", cause: 400 });
        }
        const orderItems = userCart.products.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.originalPrice,
        productId: item.productId._id
        }));
        const shippingPrice = 50;
        const currency = userCart.currency || "EGP";
        let totalPrice = 0;
        if (currency === "EGP") {
            totalPrice = userCart.products.reduce((acc, item) => acc + (item.productId.priceEg * item.quantity), 0) + shippingPrice;
        }else if (currency === "USD") {
            totalPrice = userCart.products.reduce((acc, item) => acc + (item.productId.priceUsd * item.quantity), 0) + shippingPrice;
        }

        const paymentWalletTransaction = await PaymentWallet.create({
        userId,
        amount: totalPrice,
        paymentMethod,
        currency,
        type: "product",
        account: transferNumber || transferAccount,
        transactionImage: transferReceipt,
    });
    if(!paymentWalletTransaction) {
        return next({ message: "فشل الدفع", status: 400 });
    }   
        const order = await Order.create({
            userId,
            orderItems,
            shippingAddress: {
                address: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postalCode,
                country: shippingData.country
            },
            phoneNumber: shippingData.phoneNumber,
            shippingPrice,
            totalPrice,
            paymentMethod,
            transferReceipt
        });
        await order.save();
        // Clear the cart after creating the order
        userCart.products = [];
        userCart.totalAmount = 0;
        await userCart.save();
        // Create PaymentWallet transaction
        
        return res.status(201).json({success:true, message: "Order created successfully" });
    }
    
    // const orderItems = userCart.cartItems.map(item => ({
    //     title: item.productId.title,
    //     quantity: item.quantity,
    //     price: item.productId.price,
    //     productId: item.productId._id
    // }));
    // const shippingPrice = 0;
    // const totalPrice = userCart.cartItems.reduce((acc, item) => acc + (item.productId.price * item.quantity), 0) + shippingPrice;
    // const order = await Order.create({
    //     userId,
    //     orderItems,
    //     shippingAddress: {
    //         address,
    //         city,
    //         postalCode,
    //         country
    //     },
    //     phoneNumber,
    //     shippingPrice,
    //     totalPrice,
    //     paymentMethod
    // });
    // await order.save();
    
    // // Clear the cart after creating the order
    // await Cart.findOneAndUpdate({ userId }, { $set: { cartItems: [] } });
    
    return res.status(201).json({success:true, message: "Order created successfully" });

};