import { Router } from "express";
import * as videoController from "./video.controller.js";
import expressasyncHandler from 'express-async-handler';
import { userAuth } from "../../middlewares/userAuth.middleware.js";
import { systemRoles } from "../../utils/system-roles.js";

const videoRouter = Router();

// Update video progress
videoRouter.patch(
    "/:videoId/progress",
    userAuth([systemRoles.USER]),
    expressasyncHandler(videoController.updateVideoProgress)
);

// Submit quiz answers
videoRouter.post(
    "/submitQuizAnswers/:videoId",
    userAuth([systemRoles.USER]),
    expressasyncHandler(videoController.submitQuizAnswers)
);

// Get next video
videoRouter.get(
    "/:videoId/next",
    userAuth([systemRoles.USER]),
    expressasyncHandler(videoController.getNextVideo)
);

// Get user progress for a video
videoRouter.get(
    "/:videoId/progress",
    userAuth([systemRoles.USER]),
    expressasyncHandler(videoController.getUserProgress)
);


// Get video quiz
videoRouter.get(
    "/:videoId/quiz",
    userAuth([systemRoles.USER]),
    expressasyncHandler(videoController.getVideoQuiz)
);

export default videoRouter;
