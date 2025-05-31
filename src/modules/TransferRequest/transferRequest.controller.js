import Therapist from "../../../DB/Models/therapist.model.js";
import TransferRequest from "../../../DB/Models/transferRequest.model.js";
import sendEmailService from "../../services/send-email.services.js";
import { APIFeatures } from "../../utils/api-feature.js";

//& ======================= CREATE TRANSFER REQUEST ======================= //
export const createTransferRequest = async (req, res, next) => {
    const {id:therapistId} = req.authTherapist;
    const { transferAccount, transferMethod, currency, amount } = req.body;
    // check if the therapist has an existing transfer request piending
    const existingRequest = await TransferRequest.findOne({
        therapistId,
        status: "pending"
    });
    if (existingRequest) {
        return next({
            message: "لديك طلب تحويل قيد الانتظار بالفعل",
            cause: 400
        });
    }
    // create a new transfer request
    const newTransferRequest = await TransferRequest.create({
        therapistId,
        transferAccount,
        transferMethod,
        currency,
        amount
    });
    return res.status(201).json({
        success: true,
        message: " تم انشاء طلب تحويل بنجاح",
        data: newTransferRequest
    });
};

//& ======================= GET THERAPIST TRANSFER REQUESTS ======================= //
export const getTherapistTransferRequests = async (req, res, next) => {
    const {_id:therapistId} = req.authTherapist;
    // find all transfer requests for the therapist
    const transferRequests = await TransferRequest.find({ therapistId });
    return res.status(200).json({
        message: "Transfer requests retrieved successfully",
        data: transferRequests
    });
};


//& ======================= UPDATE TRANSFER REQUEST STATUS ======================= //
export const updateTransferRequestStatus = async (req, res, next) => {
    const { requestId } = req.params;
    const { status } = req.body;
    // validate status
    if (!["accepted", "rejected"].includes(status)) {
        return next({
            message: "Invalid status",
            cause: 400
        });
    }
    // find the transfer request and update its status
    const updatedRequest = await TransferRequest.findById(
        requestId
    ).populate("therapistId", "full_name walletUsd walletEgp email");
    if (!updatedRequest) {
        return next({
            message: "Transfer request not found",
            cause: 404
        });
    }
    // update the therapist's wallet if the request is accepted
    if (status === "accepted") {
        const therapist = await Therapist.findById(
            updatedRequest.therapistId
        );
        if (!therapist) {
            return next({
                message: "Therapist not found",
                cause: 404
            });
        }
        if(updatedRequest.currency === "EGP") {
            if (therapist.walletEgp < updatedRequest.amount) {
                return next({
                    message: "هناك رصيد غير كافي في محفظة الجنيه المصري",
                    cause: 400
                });
            }
            updatedRequest.status = "accepted";
            await updatedRequest.save();
            therapist.walletEgp -= updatedRequest.amount;
        } else if (updatedRequest.currency === "USD") {
            if (therapist.walletUsd < updatedRequest.amount) {
                return next({
                    message: "هناك رصيد غير كافي في محفظة الدولار الأمريكي",
                    cause: 400
                });
            }
            updatedRequest.status = "accepted";
            await updatedRequest.save();
            therapist.walletUsd -= updatedRequest.amount;
        }
        await therapist.save();
        // Optionally, you can send a notification to the therapist about the accepted request

        const isEmailSent = await sendEmailService({
            to: therapist.email,
            subject: "Notification Email",
            message: `
                <h1>Transfer Request Accepted</h1>
                <p>Your transfer request has been accepted.</p>
                <p>Amount: ${updatedRequest.amount} ${updatedRequest.currency}</p>
                <p>Transfer Method: ${updatedRequest.transferMethod}</p>
                <p>Transfer Account: ${updatedRequest.transferAccount}</p>
                <p>Status: ${updatedRequest.status}</p>
                <p>Thank you for using our service!</p>
            `,
        });
        if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });

    } else if (status === "rejected") {
        updatedRequest.status = "rejected";
        await updatedRequest.save();

        const isEmailSent = await sendEmailService({
            to: updatedRequest.therapistId.email,
            subject: "Transfer Request Rejected",
            message: `
                <h1>Transfer Request Rejected</h1>
                <p>Your transfer request has been rejected.</p>
                <p>Amount: ${updatedRequest.amount} ${updatedRequest.currency}</p>
                <p>Transfer Method: ${updatedRequest.transferMethod}</p>
                <p>Transfer Account: ${updatedRequest.transferAccount}</p>
                <p>Status: ${updatedRequest.status}</p>
                <p>Thank you for using our service!</p>
            `,
        });
        if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
    }
    return res.status(200).json({
        message: "Transfer request status updated successfully",
        transferRequest: updatedRequest
    });
};

//& ======================= GET ALL TRANSFER REQUESTS ======================= //
export const getAllTransferRequests = async (req, res, next) => {
    // find all transfer requests
    let {page, size, ...search} = req.query;
    if(!page) page = 1;
    const feature = new APIFeatures(req.query, TransferRequest.find({ status: { $nin: ["rejected", "accepted"] }}).populate("therapistId", "full_name walletUsd walletEgp email"));
    feature.pagination({page, size});
    feature.search(search);
    const transferRequests = await feature.mongooseQuery;
    if (!transferRequests) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    const numberOfPages = Math.ceil(await TransferRequest.countDocuments() / (size ? size : 10) )
    
    return res.status(200).json({
        message: "All transfer requests retrieved successfully",
        data: transferRequests,
        numberOfPages
    });
};

//& ======================= GET TRANSFER REQUEST BY ID ======================= //
export const getTransferRequestById = async (req, res, next) => {
    const { requestId } = req.params;
    // find the transfer request by id
    const transferRequest = await TransferRequest.findById(requestId).populate("therapistId", "-password");
    if (!transferRequest) {
        return next({
            message: "Transfer request not found",
            cause: 404
        });
    }
    return res.status(200).json({
        message: "Transfer request retrieved successfully",
        data: transferRequest
    });
};
//& ======================= DELETE TRANSFER REQUEST ======================= //
export const deleteTransferRequest = async (req, res, next) => {
    const { requestId } = req.params;
    // find the transfer request and delete it
    const deletedRequest = await TransferRequest.findByIdAndDelete(requestId);
    if (!deletedRequest) {
        return next({
            message: "Transfer request not found",
            cause: 404
        });
    }
    return res.status(200).json({
        message: "Transfer request deleted successfully",
        data: deletedRequest
    });
};