// Controller to fetch books that are similar to a given book.

const BookModel = require('../models/bookScheme');

// Fetches up to 4 similar books based on category and language.
const fetchSimilarBooks = async (req, res) => {
  const { bookId } = req.params;

  // Find the original book to determine its category and language.
  const originalBook = await BookModel.findById(bookId);
  if (!originalBook) {
    return res.status(404).json({ success: false, message: "Original book not found." });
  }
  const { category, language } = originalBook;

  // First, try to find available books in the same category, excluding the original book.
  let similarBooks = await BookModel.find({
    _id: { $ne: bookId }, // Exclude the current book itself.
    category,
    available: true,
  }).limit(4).exec();

  // If no books are found in the same category, fall back to finding books in the same language.
  if (similarBooks.length === 0) {
    similarBooks = await BookModel.find({
      _id: { $ne: bookId },
      language,
      available: true,
    }).limit(4).exec();
  }

  return res.status(200).json({ success: true, data: similarBooks });
};

module.exports = { fetchSimilarBooks };