import Video from "../../../DB/Models/video.mode.js";
import Course from "../../../DB/Models/course.model.js";
import Question from "../../../DB/Models/question.model.js";
import UserProgress from "../../../DB/Models/userProgress.model.js";

//& ===================== UPDATE VIDEO PROGRESS =====================
export const updateVideoProgress = async (req, res, next) => {
    const { videoId } = req.params;
    const { id: userId } = req.authUser;
    const { progress } = req.body;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        return next({ message: "Video not found", status: 404 });
    }

    // Check if user is enrolled in the course
    const course = await Course.findOne({
        _id: video.courseId,
        enrolledUsers: userId
    });

    if (!course) {
        return next({ message: "You are not enrolled in this course", status: 403 });
    }

    // Update or create user progress
    const userProgress = await UserProgress.findOneAndUpdate(
        { userId, videoId },
        {
            progress,
            lastWatchedAt: new Date(),
            completed: progress >= 100
        },
        { upsert: true, new: true }
    );

    return res.status(200).json({
        status: "success",
        message: "Video progress updated successfully",
        data: {
            userProgress
        }
    });
};

//& ===================== SUBMIT QUIZ ANSWERS =====================
export const submitQuizAnswers = async (req, res, next) => {
    const { videoId } = req.params;
    const { id: userId } = req.authUser;
    const { answers } = req.body;
    console.log(answers);
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        return next({ message: "Video not found", status: 404 });
    }

    // Check if user is enrolled in the course
    const course = await Course.findOne({
        _id: video.courseId,
        enrolledUsers: userId
    });

    if (!course) {
        return next({ message: "You are not enrolled in this course", status: 403 });
    }

    // Get all questions for the video
    const questions = await Question.find({ videoId });
    
    // Validate answers
    let score = 0;
    const results = [];

    for (const question of questions) {
        const userAnswer = answers.find(a => a.questionId.toString() === question._id.toString());
        const isCorrect = userAnswer && userAnswer.answer === question.correctAnswer;
        
        if (isCorrect) {
            score++;
        }

        results.push({
            questionId: question._id,
            isCorrect,
            correctAnswer: question.correctAnswer
        });
    }

    // Calculate percentage
    const percentage = (score / questions.length) * 100;
    const passed = percentage >= 70; // Assuming 70% is passing score

    // Update user progress
    const userProgress = await UserProgress.findOneAndUpdate(
        { userId, videoId },
        {
            quizScore: percentage,
            progress: percentage,
            quizPassed: passed,
            completed: passed,
            order: video.order,
            lastWatchedAt: new Date()
        },
        { upsert: true, new: true }
    );
    console.log(userProgress);

    return res.status(200).json({
        success: true,
        status: "success",
        message: passed ? "Quiz passed successfully" : "Quiz failed",
        data: {
            score,
            totalQuestions: questions.length,
            percentage,
            passed,
            results,
            userProgress
        }
    });
};

//& ===================== GET NEXT VIDEO =====================
export const getNextVideo = async (req, res, next) => {
    const { videoId } = req.params;
    const { id: userId } = req.authUser;

    // Get current video
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return next({ message: "Video not found", status: 404 });
    }

    // Check if user is enrolled in the course
    const course = await Course.findOne({
        _id: currentVideo.courseId,
        enrolledUsers: userId
    });

    if (!course) {
        return next({ message: "You are not enrolled in this course", status: 403 });
    }

    // Check if current video is completed
    const currentProgress = await UserProgress.findOne({ userId, videoId });
    if (!currentProgress?.completed) {
        return next({ 
            message: "You must complete the current video and pass its quiz before proceeding", 
            status: 403 
        });
    }

    // Get next video based on order
    const nextVideo = await Video.findOne({
        courseId: currentVideo.courseId,
        order: currentVideo.order + 1
    });

    if (!nextVideo) {
        return res.status(200).json({
            status: "success",
            message: "This is the last video in the course",
            data: null
        });
    }

    // Get user's progress for the next video
    const nextVideoProgress = await UserProgress.findOne({ 
        userId, 
        videoId: nextVideo._id 
    });

    return res.status(200).json({
        status: "success",
        data: {
            nextVideo,
            progress: nextVideoProgress || {
                progress: 0,
                completed: false,
                quizPassed: false
            }
        }
    });
};

//& ===================== GET USER PROGRESS =====================
export const getUserProgress = async (req, res, next) => {
    const { videoId } = req.params;
    const { id: userId } = req.authUser;

    const progress = await UserProgress.findOne({ userId, videoId });
    
    if (!progress) {
        return res.status(200).json({
            status: "success",
            data: {
                progress: 0,
                completed: false,
                quizPassed: false
            }
        });
    }

    return res.status(200).json({
        status: "success",
        data: {
            progress
        }
    });
};

//& ===================== GET VIDEO QUIZ =====================
export const getVideoQuiz = async (req, res, next) => {
    const { videoId } = req.params;
    const { id: userId } = req.authUser;

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        return next({ message: "Video not found", status: 404 });
    }

    // Check if user is enrolled in the course
    const course = await Course.findOne({
        _id: video.courseId,
        enrolledUsers: userId
    });

    if (!course) {
        return next({ message: "You are not enrolled in this course", status: 403 });
    }

    // Get all questions for the video
    const questions = await Question.find({ videoId }).select('-correctAnswer');

    return res.status(200).json({
        status: "success",
        data: {
            questions
        }
    });
};
