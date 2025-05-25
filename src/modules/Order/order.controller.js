import Cart from "../../../DB/Models/cart.model.js";
import Order from "../../../DB/Models/order.model.js";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import { createCharge } from "../../services/tapPayment.js";

//& ==================== CREATE ORDER ====================
export const createOrder = async (req, res, next) => {
    const { _id:userId } = req.authUser;
    const { paymentMethod, shippingAddress, transferAccount, transferNumber} = req.body;

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
    
    return res.status(201).json({success:true, message: "Order created successfully" });
};

//& ==================== CREATE ORDER USING CARD =============
export const createOrderWithCard = async (req, res, next) => {
    const { shippingAddress} = req.body;
    const { _id:userId } = req.authUser;
    const shippingData = JSON.parse(shippingAddress);
    const userCart = await Cart.findOne({ userId }).populate("products.productId").populate("userId");
    if (!userCart) {
        return next({ message: "Cart not found", status: 404 });
    }
      const chargeUrl = await createCharge({
        price: +userCart.totalAmount,
        title: `Order from ${userCart.userId.username}`,
        id: userCart._id.toString(),
        username: userCart.userId.username,
        email: userCart.userId.email,
        currency: userCart.currency || "EGP",
        metadata: {
            userId: userId.toString(),
            cartId:userCart._id.toString(),
            currency: userCart.currency || "EGP",
            shippingAddress,
            amount:+userCart.totalAmount,
        },
        redirect: {
            url: `${process.env.CLIENT_URL}/profile`,
        },
        post: {
            url: `${process.env.SERVER_URL}/api/v1/order/webhook`,
        },
        });

        if (!chargeUrl) {
        return next({ message: "Failed to create charge", cause: 400 });
        }

        return res.status(200).json({
            success: true,
            message: "Order created successfully",
            chargeUrl
        });
};

//& ==================== WEBHOOK FOR ORDER PAYMENT ====================
export const webhookHandler = async (req, res, next) => {
    const { metadata, status, id } = req.body;
    if (status === "CAPTURED") {
        const { userId, cartId, shippingAddress, amount, currency } = metadata;
        const userCart = await Cart.findById(cartId).populate("products.productId").populate("userId");
        if (!userCart) {
            return next({ message: "Cart not found", status: 404 });
        }
        const orderItems = userCart.products.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.originalPrice,
            productId: item.productId._id
        }));
        let totalPrice = 0;
        if (currency === "EGP") {
            totalPrice = userCart.products.reduce((acc, item) => acc + (item.productId.priceEg * item.quantity), 0);
        } else if (currency === "USD") {
            totalPrice = userCart.products.reduce((acc, item) => acc + (item.productId.priceUsd * item.quantity), 0);
        }
        
        const order = await Order.create({
            userId,
            orderItems,
            shippingAddress: JSON.parse(shippingAddress),
            phoneNumber: JSON.parse(shippingAddress).phoneNumber,
            shippingPrice : 0,
            totalPrice,
            paymentMethod: "card",
            transactionId: id,
            isPaid: true,
            paidAt: new Date().toISOString(),
            orderStatus: "Paid"
        });
        
        // Clear the cart after creating the order
        userCart.products = [];
        userCart.totalAmount = 0;
        await userCart.save();
        
        return res.status(200).json({success:true, message: "Order created successfully" });
    }
    return res.status(400).json({success:false, message: "Payment not captured" });
        

};

//& ==================== GET ALL ORDERS ====================
export const getAllOrders = async (req, res, next) => {
    const orders = await Order.find().populate("orderItems.productId");
    if (!orders) {
        return next({ message: "No orders found", status: 404 });
    }
    return res.status(200).json({success:true, orders: orders });
};

//& ==================== Change Order Status ====================
export const changeOrderStatus = async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
        return next({ message: "Order not found", status: 404 });
    }
    if (status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = new Date();
    } else if (status === "Cancelled") {
        order.isCancelled = true;
        order.cancelledAt = new Date();
    }
    order.orderStatus = status;
    await order.save();
    return res.status(200).json({success:true, message: "Order status updated successfully", order });
}