import Cart from "../../../DB/Models/cart.model.js";
import Order from "../../../DB/Models/order.model.js";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import User from "../../../DB/Models/user.model.js";
import sendEmailService from "../../services/send-email.services.js";
import { createCharge } from "../../services/tapPayment.js";
import { APIFeatures } from "../../utils/api-feature.js";
import { orderDeliveredTemplate, orderPaidTemplate, orderPlacedTemplate, prePaymentOrderTemplate } from "../../utils/templates/order.js";

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
        const shippingPrice = 0;
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
        
        const user = await User.findById(userId);
        if(!user){
            return next({ message:"هذا المستخدم غير موجود",cause: 400 })
        }
        const emailSubject = `استلمنا طلب الدفع – في انتظار التأكيد`;
        const isEmailSentClient = await sendEmailService({
            to: user.email,
            subject: emailSubject,
            message: prePaymentOrderTemplate(user.username,order),
        });
        if(!isEmailSentClient) {
            return {
                status: false,
                message: "Email failed to send, but session was created"
            }
        }
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
    let {page, size} = req.query;
    if(!page) page = 1;
    const feature = new APIFeatures(req.query, Order.find().populate("orderItems.productId").sort({createdAt: -1}));
    feature.pagination({page, size});
    const orders = await feature.mongooseQuery;
    const queryFilter = {};
    const numberOfPages = Math.ceil(await Order.countDocuments(queryFilter) / (size ? size : 10) )
    return res.status(200).json({success:true, orders, numberOfPages });
};

//& ==================== Change Order Status ====================
export const changeOrderStatus = async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;
    console.log(orderId, status);
    const order = await Order.findById(orderId).populate("userId");
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
    if (status === "Paid") {
        const emailSubject = `تم التأكيد على طلبك – في انتظار التسليم`;
        const isEmailSentClient = await sendEmailService({
            to: order.userId.email,
            subject: emailSubject,
            message: orderPaidTemplate(order.userId.username, order),
        });
        if(!isEmailSentClient) {
            return {
                status: false,
                message: "Email failed to send, but session was created"
            }
        }
    }
    if(status === "Placed") {
        const emailSubject = `طلبك في الطريق!`;
        const isEmailSentClient = await sendEmailService({
            to: order.userId.email,
            subject: emailSubject,
            message: orderPlacedTemplate(order.userId.username, order),
        });
        if(!isEmailSentClient) {
            return {
                status: false,
                message: "Email failed to send, but session was created"
            }
        }
    } 
    if(status === "Cancelled") {
        const emailSubject = `تم إلغاء طلبك – نأسف للإزعاج`;
        const isEmailSentClient = await sendEmailService({
            to: order.userId.email,
            subject: emailSubject,
            message: `<p>مرحبًا ${order.userId.username}،</p>
                      <p>نأسف لإبلاغك أنه تم إلغاء طلبك.</p>
                      <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
                      <p>مع خالص التحيات،</p>
                      <p>فريق Arab ADHD</p>`,
        });
        if(!isEmailSentClient) {
            return {
                status: false,
                message: "Email failed to send, but session was created"
            }
        }
    }
    if(status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = new Date();
        order.deleveredBy = req.authUser._id;
        const feedbackLink = `${process.env.CLIENT_URL}/profile/orders/${order._id}/feedback`;
        const emailSubject = `وصل لك الطلب؟ شاركنا رأيك`;
        const isEmailSentClient = await sendEmailService({
            to: order.userId.email,
            subject: emailSubject,
            message: orderDeliveredTemplate(order.userId.username, feedbackLink),
        });
        if(!isEmailSentClient) {
            return {
                status: false,
                message: "Email failed to send, but session was created"
            }
        }
    }
    order.orderStatus = status;
    await order.save();
    return res.status(200).json({success:true, message: "Order status updated successfully", order });
}