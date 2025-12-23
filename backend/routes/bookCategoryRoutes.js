const express = require("express");
const bookCategoryRouter = express.Router();

const { postBookCategory, getAllCategories } = require("../controller/bookCategoryController");

bookCategoryRouter.route("/")
  .post(postBookCategory)
  .get(getAllCategories);

module.exports = bookCategoryRouter;
