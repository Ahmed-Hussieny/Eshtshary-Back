import connection_DB from "../DB/connection.js";
import * as routers from './modules/index.routes.js';
import { globalResponse } from './middlewares/global-response.js';
import { rollbackUploadedFiles } from './middlewares/rollback-uploaded-files-Middleware.js';
import { rollBackSavedDocument } from './middlewares/rollback-saved-Document.Middlewares.js';
import { cronToCheckSubscription } from './utils/crons.js';

export const initiateApp = ({ app, express }) => {
    app.use(express.json());
    connection_DB();
    app.use('/api/v1/auth', routers.authRouter);
    app.use('/api/v1/therapist', routers.therapistRouter);
    app.use('/api/v1/user', routers.userRouter);
    app.use('/api/v1/session', routers.sessionRouter);
    app.use('/api/v1/paymentWallet', routers.paymentWalletRouter);
    app.use('/api/v1/course', routers.courseRouter);
    app.use('/api/v1/video', routers.videoRouter);
    app.use('/api/v1/test', routers.testRouter);
    app.use('/api/v1/product', routers.productRouter);
    app.use('/api/v1/cart', routers.cartRouter);
    app.use('/api/v1/order', routers.orderRouter);
    app.use('/api/v1/article', routers.articleRouter);
    app.use('/api/v1/live-course', routers.liveCourseRouter);
    
    app.use('/uploads/Therapists', express.static('uploads/Therapists'));
    app.use('/uploads/PaymentWallets', express.static('uploads/PaymentWallets'));
    app.use('/uploads/Courses', express.static('uploads/Courses'));
    app.use('/uploads/Tests', express.static('uploads/Tests'));
    app.use('/uploads/Products', express.static('uploads/Products'));
    app.use('/uploads/Certificates', express.static('uploads/Certificates'));
    app.use('/uploads/Articles', express.static('uploads/Articles'));

    app.use((req, res, next) => {
        next({ message: "Route not found", status: 404 });
    });

    // cronToCheckSubscription();
    app.use(globalResponse, rollbackUploadedFiles, rollBackSavedDocument);

};
