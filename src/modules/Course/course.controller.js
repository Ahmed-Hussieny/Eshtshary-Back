import Course from "../../../DB/Models/course.model.js";
import Question from "../../../DB/Models/question.model.js";
import Video from "../../../DB/Models/video.mode.js";
import UserProgress from "../../../DB/Models/userProgress.model.js";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import sendEmailService from "../../services/send-email.services.js";
import { HandleGenerateCertificate } from "./utils/generateCertificate.js";
import User from "../../../DB/Models/user.model.js";

//& ===================== ADD COURSE =====================
export const createCourse = async (req, res, next) => {
    const { id } = req.authTherapist;
    const { title, description, priceUSD,priceEGP, videos } = req.body;
    // Parse the videos string if it's a string
    let videosData = [];
    try {
        videosData = typeof videos === 'string' ? JSON.parse(videos) : videos;
    } catch (err) {
        return next({ message: "صيغة الفيديوهات غير صالحة", status: 400 });
    }

    // thumbnail validation
    if(!req.files?.thumbnail) {
        return next({ message: "يرجى رفع صورة مصغرة للدورة", status: 400 });
    }
    
    const thumbnail = `${process.env.SERVER_URL}/uploads${
        req.files.thumbnail[0].path.split("/uploads")[1]
    }`;

    // check if course already exists
    const courseExists = await Course.findOne({
        title,
        therapistId: id,
    });
    if (courseExists) {
        return next({ message: "الدورة موجودة بالفعل", status: 400 });
    }

    // create course
    const course = await Course.create({
        title,
        description,
        priceUSD,
        priceEGP,
        therapistId: id,
        thumbnail,
    });

    // add videos to course
    if (videosData && videosData.length > 0) {
        const videoIds = [];
        for (const video of videosData) {
            const { title, videoUrl, duration, order } = video;
            const newVideo = await Video.create({
                courseId: course._id,
                title,
                videoUrl,
                duration,
                order,
            });
            videoIds.push(newVideo._id);
            let questionIds = [];
            if (video.questions && video.questions.length > 0) {
                for (const question of video.questions) {
                    const newQuestion = await Question.create({
                        ...question,
                        videoId: newVideo._id
                    });
                    questionIds.push(newQuestion._id);
                }
            }
        }
        
        course.videos = videoIds;
        await course.save();
    }

    return res.status(201).json({
        status: "success",
        data: {
            course,
        },
    });
};

//& ===================== ENROLL IN COURSE =====================
export const enrollInCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const { id: userId } = req.authUser;
    console.log("req.files", req.body);

    const { paymentMethod, amount, currency, transferNumber, transferAccount } = req.body;

    // transactionImage
    if(!req.files?.transactionImage) {
        return next({ message: "يرجى رفع صورة الدفع", status: 400 });
    }
    // Check if course exists

    const transactionImage = req.files.transactionImage[0].path;
    if (!transactionImage) {
      return next({ message: "Transaction image is required", cause: 400 });
    }
    const transactionImageUrl = `${process.env.SERVER_URL}/uploads${
      req.files.transactionImage[0].path.split("/uploads")[1]
    }`;


    const course = await Course.findById(courseId);
    if (!course) {
        return next({ message: "الدورة غير موجودة", status: 404 });
    }

    // Check if user is already enrolled
    const isEnrolled = course.enrolledUsers.includes(userId);
    if (isEnrolled) {
        return next({ message: "أنت مسجل بالفعل في هذه الدورة", status: 400 });
    }
    // handel payment
    const paymentWallet = await PaymentWallet.create({
        userId,
        therapistId: course.therapistId,
        courseId,
        amount,
        paymentMethod,
        currency,
        type: "course",
        account: transferNumber || transferAccount,
        transactionImage: transactionImageUrl,
    });
    if(!paymentWallet) {
        return next({ message: "فشل الدفع", status: 400 });
    }
    // return response
    return res.status(200).json({
        success: true,
        status: "success",
        message: "تم انشاء الدفعة بنجاح بمجرد تاكيد الدفع سيتم ارسال اشعار بالبريد الالكتروني"
    });
};

// & ======================= Enroll course For the user when the payment is approved =======================
export const acceptPayment = async (req, res, next) => {
    const { paymentWalletId } = req.params;
    console.log("paymentWalletId", paymentWalletId);
     // get and complete the payment
    const paymentWallet = await PaymentWallet.findById(paymentWalletId).populate("userId courseId");
    if(!paymentWallet) {
        return next({ message: "الدفعة غير موجودة", status: 404 });
    }
    paymentWallet.status = "completed";
    await paymentWallet.save();

    // get the course
    const course = await Course.findById(paymentWallet.courseId);
    if(!course) {
        return next({ message: "الدورة غير موجودة", status: 404 });
    }

    // add user to enrolled users
    course.enrolledUsers.push(paymentWallet.userId);
    course.enrolledUsersCount++;
    await course.save();

    // send email to the user
    const emailSubject = `تم التسجيل في الدورة`;
    const emailMessage = `تم التسجيل في الدورة ${course.title} بنجاح`;
    const isEmailSentClient = await sendEmailService({
        to: paymentWallet.userId.email,
        subject: emailSubject,
        message: emailMessage
      });
      
      if(!isEmailSentClient) {
        console.error('Email failed to send, but session was created');
      }

    return res.status(200).json({
        success: true,
        status: "success",
        message: "تم التسجيل في الدورة بنجاح",
    });
    
}

//& ===================== GET ENROLLED COURSES =====================
export const getEnrolledCourses = async (req, res, next) => {
    const { id: userId } = req.authUser;

    const enrolledCourses = await Course.find({
        enrolledUsers: userId
    }).populate('videos');

    return res.status(200).json({
        success: true,
        status: "success",
        data: {
            courses: enrolledCourses
        }
    });
};

//& ===================== GET ENROLLED COURSE DETAILS =====================
export const getEnrolledCourseDetails = async (req, res, next) => {
    const { courseId } = req.params;
    const { id: userId } = req.authUser;

    // Get course with basic video information
    const course = await Course.findById(courseId)
        .populate({
            path: 'videos',
            select: 'title order duration videoUrl',
            populate: {
                path: 'questions',
                select: 'questionText options correctAnswer type'
            }
        });

    if (!course) {
        return next({ message: "الدورة غير موجودة", status: 404 });
    }

    // Check if user is enrolled
    if (!course.enrolledUsers.includes(userId)) {
        return next({ message: "أنت غير مسجل في هذه الدورة", status: 403 });
    }

    // Get user progress for all videos in the course
    const userProgress = await UserProgress.find({
        userId,
        videoId: { $in: course.videos.map(v => v._id) }
    });
    // Create a map of video progress for easy lookup
    const progressMap = userProgress.reduce((map, progress) => {
        map[progress.videoId.toString()] = progress;
        return map;
    }, {});

    // Get the last completed video
    const completedVideos = userProgress.filter(p => p.completed);
    const lastCompletedVideo = completedVideos.length > 0 
        ? completedVideos.reduce((latest, current) => {
            const latestVideo = course.videos.find(v => v._id.toString() === latest.videoId.toString());
            const currentVideo = course.videos.find(v => v._id.toString() === current.videoId.toString());
            return currentVideo.order > latestVideo.order ? current : latest;
        })
        : null;

    // Determine the next available video
    const nextVideoOrder = lastCompletedVideo 
        ? course.videos.find(v => v._id.toString() === lastCompletedVideo.videoId.toString()).order + 1
        : 1;

    const nextVideo = course.videos.find(v => v.order === nextVideoOrder);

    // Format the response with all video information
    const formattedVideos = course.videos.map(video => {
        const progress = progressMap[video._id.toString()];
        const isNextVideo = nextVideo && video._id.toString() === nextVideo._id.toString();
        const isCompleted = progress?.completed;

        return {
            _id: video._id,
            title: video.title,
            order: video.order,
            duration: video.duration,
            progress: progress?.progress || 0,
            completed: progress?.completed || false,
            quizScore: progress?.quizScore || 0,
            quizPassed: progress?.quizPassed || false,
            lastWatchedAt: progress?.lastWatchedAt,
            videoUrl: video.videoUrl,
            questions: video.questions,
            isQueued: isNextVideo,
            locked: !isCompleted && !isNextVideo
        };
    });

    // Sort videos by order
    formattedVideos.sort((a, b) => a.order - b.order);

    return res.status(200).json({
        status: "success",
        data: {
            course: {
                _id: course._id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                videos: formattedVideos,
                queuedVideo: nextVideo ? {
                    _id: nextVideo._id,
                    title: nextVideo.title,
                    order: nextVideo.order,
                    videoUrl: nextVideo.videoUrl,
                    questions: nextVideo.questions
                } : null,
                progress: {
                    completedVideos: completedVideos.length,
                    totalVideos: course.videos.length,
                    percentage: Math.round((completedVideos.length / course.videos.length) * 100)
                }
            }
        }
    });
};

//& ===================== GET COURSES =====================
export const getCourses = async (req, res, next) => {
    const courses = await Course.find().populate("therapistId");
    return res.status(200).json({
        status: "success",
        data: {
            courses 
        }
    });
};

//& ===================== Generate Certificate =====================
export const generateCertificate = async (req, res, next) => {
    const { courseId } = req.params;
    const { id: userId } = req.authUser;
    console.log("courseId", courseId);
    // Check if course exists
    const course = await Course.findById(courseId).populate("therapistId");
    if (!course) {
        return next({ message: "الدورة غير موجودة", status: 404 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return next({ message: "المستخدم غير موجود", status: 404 });
    }

    // Check if user has already generated a certificate for this course
    const existingCertificate = user.certificates.find(cert => cert.courseId.toString() === courseId);
    if (existingCertificate) {
        return res.status(200).json({
            status: "success",
            data: {
                certificateUrl: existingCertificate.certificateUrl,
            },
        });
    }

    // Check if user is enrolled
    const isEnrolled = course.enrolledUsers.includes(userId);
    if (!isEnrolled) {
        return next({ message: "أنت غير مسجل في هذه الدورة", status: 403 });
    }
    // Check if course is completed
    for (const video of course.videos) {
        const progress = await UserProgress.findOne({ userId, videoId: video._id });
        if (!progress || !progress.completed) {
            return next({ message: "الدورة غير مكتملة", status: 403 });
        }
    }
    
    // Generate certificate
    const certificate = await HandleGenerateCertificate({
        course: course.title,
        user: user.username,
        therapist: course.therapistId.name,
        date: new Date(),
    });

    // Save certificate to user
    user.certificates.push({
        courseId: course._id.toString(),
        certificateUrl: `${process.env.SERVER_URL}/${certificate.toString()}`,
    });
    await user.save();
    return res.status(200).json({
        status: "success",
        data: {
            certificateUrl: `${process.env.SERVER_URL}/${certificate.toString()}`,
        },
    });
};