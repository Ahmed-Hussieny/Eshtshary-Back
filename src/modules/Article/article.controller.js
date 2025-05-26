import Article from "../../../DB/Models/article.model.js";
import fs from "fs";
import path from "path";
import { APIFeatures } from "../../utils/api-feature.js";
//& ====================== ADD ARTICLE ====================== &//
export const addArticle = async (req, res, next) => {
  try {
    const { title, description, link } = req.body;
    if (!req.files?.image) {
      return next({
        message: "Image is required",
        cause: 400,
      });
    }
    // Check if article with the same title exists
    const articleExists = await Article.findOne({ title });
    if (articleExists) {
      return next({
        message: "Article with the same title already exists",
        cause: 400,
      });
    }

    // Save the article
    const article = await Article.create({
      title,
      content: req.files?.contentFile
        ? `${process.env.SERVER_URL}/uploads/Articles/${req.files.contentFile[0].filename}`
        : "",
      image: `${process.env.SERVER_URL}/uploads/Articles/${req.files.image[0].filename}`,
      description,
      link,
    });
    if (!article) {
      return next({
        message: "Article not created",
        cause: 400,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    return next({
      message: "Server error",
      cause: 500,
      error: error.message, // Include the error message in the response
    });
  }
};
//& ====================== GET ARTICLES ====================== &//
export const getArticles = async (req, res, next) => {
  const { page, ...search } = req.query;

  const fetures = new APIFeatures(
    req.query,
    Article.find().sort({ createdAt: -1 })
  );
  fetures.search(search);
  fetures.pagination({
    size: 30,
    page: page || 1,
  });
  const articles = await fetures.mongooseQuery;
  const numberOfArticles = await Article.countDocuments();
  if (!articles) {
    return next({
      message: "Articles not found",
      cause: 400,
    });
  }
  return res.status(200).json({
    success: true,
    articles,
    numberOfPages: Math.ceil(numberOfArticles / 30),
  });
};

//& ====================== GET ARTICLE BY ID ====================== &//
export const getArticleById = async (req, res, next) => {
  const { id } = req.params;
  const article = await Article.findById(id);
  if (!article) {
    return next({
      message: "Article not found",
      cause: 400,
    });
  }
  return res.status(200).json({
    success: true,
    article,
  });
};

//& ====================== UPDATE ARTICLE ====================== &//
export const updateArticle = async (req, res, next) => {
  const { id } = req.params;
  const { title, content, description } = req.body;

  const article = await Article.findById(id);
  if (!article) {
    return next({
      message: "Article not found",
      cause: 400,
    });
  }

  if (title) article.title = title;
  if (req.files?.contentFile) {
    // delete the old image
    if (article.contentFile) {
      const imagePath = path.join(
        process.cwd(),
        article.image.replace(`${process.env.SERVER_URL}`, "")
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    // save the new image
    article.content = `${process.env.SERVER_URL}/uploads/Articles/${req.files.contentFile[0].filename}`;
  }
  if (description) article.description = description;
  if (req.files?.image) {
    // delete the old image
    if (article.image) {
      const imagePath = path.join(
        process.cwd(),
        article.image.replace(`${process.env.SERVER_URL}`, "")
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    // save the new image
    article.image = `${process.env.SERVER_URL}/uploads/Articles/${req.files.image[0].filename}`;
  }
  await article.save();

  return res.status(200).json({
    success: true,
    message: "Article updated successfully",
    article,
  });
};

//& ====================== DELETE ARTICLE ====================== &//
export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) {
      return next({
        message: "Article not found",
        cause: 400,
      });
    }

    // Extract the local file path from the image URL
    if (article.image) {
      const imagePath = path.join(
        process.cwd(), // Get the root directory of the project
        article.image.replace(`${process.env.SERVER_URL}`, "") // Convert URL to local path
      );

      // Check if the file exists before deleting
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the article from the database
    const deletedArticle = await Article.findByIdAndDelete(id);

    if (!deletedArticle) {
      return next({
        message: "Article not deleted",
        cause: 400,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully",
      article: deletedArticle,
    });
  } catch (error) {
    return next({
      message: "Server error",
      cause: 500,
      error,
    });
  }
};
