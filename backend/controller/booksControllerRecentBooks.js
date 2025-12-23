// Controller to fetch the most recently added books.

const BookList = require('../models/bookScheme');

// Fetches the 4 most recently added books, sorted by their creation date.
const getAllRecentBooks = async (req, res) => {
  // The .sort() method with { createdAdded: -1 } sorts the documents in descending order based on the creation date.
  // The .limit(4) method restricts the output to a maximum of 4 documents.
  const result = await BookList.find().sort({ createdAdded: -1 }).limit(4);

  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

module.exports = { getAllRecentBooks };