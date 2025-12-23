// Controller to find and return the most popular books.

const PopularBookSchema = require('../models/PopularBooks');
const BookSchema = require('../models/bookScheme');

// Fetches the top 4 most issued books.
const getPopularBooks = async (req, res) => {
  // Step 1: Find the top 4 books from the PopularBookSchema, sorted by the number of times they've been issued.
  const fetchPopularBooks = await PopularBookSchema.find()
    .sort({ issueQuantity: -1 }) // Sort in descending order of issue quantity.
    .limit(4); // Limit the result to 4 documents.

  // Step 2: Extract just the book IDs from the popular books result.
  const bookIds = fetchPopularBooks.map((book) => book.bookId);

  // Step 3: Use the extracted book IDs to fetch the full details for each of those books from the main BookSchema.
  // The $in operator is used to find all documents where the _id is in the bookIds array.
  const result = await BookSchema.find({ _id: { $in: bookIds } });

  // Step 4: Return the full book details.
  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

module.exports = { getPopularBooks };