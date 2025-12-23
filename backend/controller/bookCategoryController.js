// Controller to fetch book categories.
const BooksModel = require("../models/bookScheme");

// Handles a POST request to find and return book categories that match a user's search query.
const postBookCategory = async (req, res) => {
  // Extract the user's search term from the request body.
  const userInputCategory = req.body.user_input_category;

  // Use the .distinct() method from MongoDB to find all unique categories that match the search term.
  const similarCategories = await BooksModel.distinct("category", {
    category: { $regex: userInputCategory, $options: "i" },
  });

  // Return a success response with the array of matching categories.
  return res.status(200).json({
    success: true,
    book_category: similarCategories,
  });
};

// Handles a GET request to fetch all unique book categories.
const getAllCategories = async (req, res) => {
  try {
    const result = await BooksModel.distinct("category");
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
};

module.exports = {
  postBookCategory,
  getAllCategories, // Export the new function
};