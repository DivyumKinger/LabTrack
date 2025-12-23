// Controller to generate book recommendations for a user.
const { analyzeUserPreferences } = require('./bookRecommendationAlgorithm');
const UserLastBookModel = require('../models/userLastBook');

// Fetches recommended books based on a user's borrowing history.
const getRecommendedBooks = async (req, res) => {
  // The user's ID is extracted from the request object (added by the authentication middleware).
  const userId = req.userId;

  // Find the last book the user borrowed from the UserLastBookModel collection.
  const userLastBook = await UserLastBookModel.findOne({ userId });

  // If the user has no borrowing history, return an empty list.
  if (!userLastBook) {
    return res.status(200).json({ totalHits: 0, data: [] });
  }

  const { lastBorrowedBookId } = userLastBook;

  // Call the core recommendation algorithm with the user's ID and their last borrowed book's ID.
  const result = await analyzeUserPreferences(userId, lastBorrowedBookId);

  // Return the list of recommended books as a JSON response.
  res.status(200).json({ totalHits: result.length, data: result });
};

module.exports = { getRecommendedBooks };