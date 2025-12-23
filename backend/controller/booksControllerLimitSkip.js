// Controller to fetch books with pagination (limit and skip).

const BookList = require('../models/bookScheme');

// Fetches a limited number of books for a specific page.
const getAllLimitedBooks = async (req, res) => {
  const fetchLimit = 8; // Sets the number of books to be fetched per page.
  const { page } = req.query;
  const pageNumber = Number(page);

  // If the page number is not provided or is the first page.
  if (!pageNumber || pageNumber === 1) {
    const result = await BookList.find().limit(fetchLimit);
    return res.status(200).json({ success: true, totalHits: result.length, data: result });
  } else {
    // For subsequent pages, calculate the number of documents to skip.
    const skipFetch = (pageNumber - 1) * fetchLimit;
    const result = await BookList.find().limit(fetchLimit).skip(skipFetch);
    return res.status(200).json({ success: true, totalHits: result.length, data: result });
  }
};

module.exports = { getAllLimitedBooks };