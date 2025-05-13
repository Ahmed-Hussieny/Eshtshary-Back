import Course from "../../../DB/Models/course.model.js";
import Question from "../../../DB/Models/question.model.js";
import Video from "../../../DB/Models/video.mode.js";

//& ===================== ADD COURSE =====================
export const createCourse = async (req, res, next) => {
    const { id } = req.authTherapist;
    const { title, description, price, videos } = req.body;
    console.log(req.body);
    // Parse the videos string if it's a string
    let videosData = [];
    try {
        videosData = typeof videos === 'string' ? JSON.parse(videos) : videos;
    } catch (err) {
        return next({ message: "Invalid videos format", status: 400 });
    }

    // thumbnail validation
    if(!req.files?.thumbnail) {
        return next({ message: "Please upload a thumbnail", status: 400 });
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
        return next({ message: "Course already exists", status: 400 });
    }

    // create course
    const course = await Course.create({
        title,
        description,
        price,
        therapistId: id,
        thumbnail,
    });

    // add videos to course
    if (videosData && videosData.length > 0) {
        const videoIds = [];
        for (const video of videosData) {
            // add questions
            
            
            const { title, videoUrl, duration, order } = video;
            const newVideo = await Video.create({
                courseId: course._id,
                title,
                videoUrl,
                duration,
                order,
                // questions: questionIds,
            });
            videoIds.push(newVideo._id);
            let questionIds = [];
            if (video.questions && video.questions.length > 0) {
                for (const question of video.questions) {
                    const newQuestion = await Question.create({
                        ...question,
                        videoId: newVideo._id // Make sure to include videoId if needed
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