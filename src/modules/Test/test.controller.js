import Test from "../../../DB/Models/test.model.js";
import Therapist from "../../../DB/Models/therapist.model.js";
import path from "path";
import fs from "fs";
import { APIFeatures } from "../../utils/api-feature.js";
//& ===================== CREATE TEST =====================
export const createTest = async (req, res, next) => {
    const { title, description, time, type, questions, totalPoints, results } = req.body;
    //& check if the image is exists
    if(!req.files.image[0].path) {
        return next({ message: "Image is required", status: 400 });
    }
    const thumbnail = req.files.image[0].path;
    const imageUrl = `${process.env.SERVER_URL}/uploads${thumbnail.split("/uploads")[1]}`;
    if(!imageUrl) {
        return next({ message: "Image is required", status: 400 });
    }

    // Parse questions if it's a string
    let parsedQuestions;
    try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    } catch (error) {
        return next({ message: "Invalid questions format", status: 400 });
    }

    // Validate that parsedQuestions is an array
    if (!Array.isArray(parsedQuestions)) {
        return next({ message: "Questions must be an array", status: 400 });
    }

    console.log("parsedQuestions", results);
    // handle results
    let parsedResults;
    try {
        parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
    } catch (error) {
        return next({ message: "Invalid results format", status: 400 });
    }

    // Validate that parsedResults is an array
    if (!Array.isArray(parsedResults)) {
        return next({ message: "Results must be an array", status: 400 });
    }
    //& create the test
    const test = await Test.create({
        title,
        description,
        image: imageUrl,
        time,
        type,
        results: parsedResults.map(result => ({
            from: Number(result.from),
            to: Number(result.to),
            description: result.description
        })),
        questions: parsedQuestions.map(question => ({
            question: question.question,
            options: question.options.map(option => ({
                option: option.option,
                points: Number(option.points)
            }))
        })),
        totalPoints
    });
    if(!test) {
        console.log("Test not created");
        return next({ message: "Test not created", status: 400 });
    }
    return res.status(201).json({
        success: true,
        message: "Test created successfully",
        test
    });
}

//& ===================== GET TESTS =====================
export const getTests = async (req, res, next) => {
    let {page, size, ...search} = req.query;
    if(!page) page = 1;
    const feature = new APIFeatures(req.query, Test.find());
    feature.pagination({page, size});
    feature.search(search);
    const tests = await feature.mongooseQuery;
    if (!tests) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    const queryFilter = {};
    if(search.title) queryFilter.title = { $regex: search.title, $options: 'i' };
    const numberOfPages = Math.ceil(await Test.countDocuments(queryFilter) / (size ? size : 10) )
    
    return res.status(200).json({
        success: true,
        message: "Tests fetched successfully",
        tests,
        numberOfPages
    });
}

//& ===================== GET TEST BY ID =====================
export const getTestById = async (req, res, next) => {
    const { id } = req.params;
    const test = await Test.findById(id);
    return res.status(200).json({
        message: "Test fetched successfully",
        test
    });
}

//& ===================== ANSWER THE TEST =====================
export const answerTest = async (req, res, next) => {
    const { id } = req.params;
    const { answers } = req.body;
    const test = await Test.findById(id);
    if(!test) {
        return next({ message: "Test not found", status: 404 });
    }
    let totalPoints = test.totalPoints;
    let userPoints = 0;
    for(const answer of answers) {
        const question = test.questions.find(question => question.id === answer.questionId);
        if(question) {
            const option = question.options.find(option => option.id === answer.optionId);
            if(option) {
                userPoints += option.points;
            }
        }
    }
    // get the result based on the userPoints
    let result = test.results.find(result => userPoints >= result.from && userPoints <= result.to);
    if(!result) {
        result = test.results.find(result => userPoints >= result.from);
    }
    return res.status(200).json({
        success: true,
        message: "Test answered successfully",
        userPoints,
        totalPoints,
        result: result.description
    });
}

//& ===================== UPDATE TEST =====================
export const updateTest = async (req, res, next) => {
    const { id } = req.params;
    const { title, description, time, type, questions, totalPoints, results } = req.body;
    const test = await Test.findById(id);
    if(!test) {
        return next({ message: "Test not found", status: 404 });
    }
    if(req.files.image) {
        //& remove the old image
        const oldImage = test.image;
        if(oldImage) {
            const imagePath = path.join(
                process.cwd(),
                oldImage.replace(`${process.env.SERVER_URL}`, "")
            );
            if(fs.existsSync(imagePath)){
                fs.unlinkSync(imagePath);
            }
        }
        const imageUrl = `${process.env.SERVER_URL}/uploads${req.files.image[0].path.split("/uploads")[1]}`;
        if(!imageUrl) {
            return next({ message: "Image is required", status: 400 });
        }
        test.image = imageUrl;
    }
    test.title = title || test.title;
    test.description = description || test.description;
    test.time = time || test.time;
    test.type = type || test.type;
    let parsedQuestions;
    try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    } catch (error) {
        return next({ message: "Invalid questions format", status: 400 });
    }

    // Validate that parsedQuestions is an array
    if (!Array.isArray(parsedQuestions)) {
        return next({ message: "Questions must be an array", status: 400 });
    }
    test.questions = parsedQuestions.map(question => ({
        question: question.question,
        options: question.options.map(option => ({
            option: option.option,
            points: Number(option.points) // Ensure points is a number
        }))
    })) || test.questions;
    test.totalPoints = totalPoints || test.totalPoints;

    // handle results
    let parsedResults;
    try {
        parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
    } catch (error) {
        return next({ message: "Invalid results format", status: 400 });
    }
    // Validate that parsedResults is an array
    if (!Array.isArray(parsedResults)) {
        return next({ message: "Results must be an array", status: 400 });
    }
    test.results = parsedResults.map(result => ({
        from: Number(result.from),
        to: Number(result.to),
        description: result.description
    })) || test.results;
    //& save the test
    const updatedTest = await test.save();
    if(!updatedTest) {
        return next({ message: "Test not updated", status: 400 });
    }
    return res.status(200).json({
        success: true,
        message: "Test updated successfully",
        updatedTest
    });
}

//& ===================== DELETE TEST =====================
export const deleteTest = async (req, res, next) => {
    const { id } = req.params;
    const test = await Test.findByIdAndDelete(id);
    if(!test) {
        return next({ message: "Test not found", status: 404 });
    }
    //& remove the image
    const image = test.image;
    if(image) {
        const imagePath = path.join(
            process.cwd(),
            image.replace(`${process.env.SERVER_URL}`, "")
        );
        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath);
        }
    }
    return res.status(200).json({
        success: true,
        message: "Test deleted successfully",
        test
    });
}

//& ===================== ADD USER DATA TO TEST =====================
export const addUserDataToTest = async (req, res, next) => {
    const { id } = req.params;
    const { name, email, whatsapp } = req.body;
    const test = await Test.findById(id);
    if(!test) {
        return next({ message: "Test not found", status: 404 });
    }
    //& check if the user already exists in the test
    const userExists = test.usersData.find(user => user.email === email);
    if(userExists) {
        test.usersData = test.usersData.map(user => {
            if(user.email === email) {
                return {
                    ...user,
                    name: name || user.name,
                    whatsapp: whatsapp || user.whatsapp
                };
            }
            return user;
        });
    } else {
        test.usersData.push({
            name,
            email,
            whatsapp
        });
    }
    const updatedTest = await test.save();
    if(!updatedTest) {
        return next({ message: "User data not added to the test", status: 400 });
    }
    return res.status(200).json({
        success: true,
        message: "User data added to the test successfully",
        updatedTest
    });
}