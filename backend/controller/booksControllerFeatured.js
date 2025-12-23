// Controller to fetch all books that are marked as 'featured'.

const BookList = require('../models/bookScheme');

// Fetches all books where the 'featured' property is true.
const getAllFeaturedBooks = async (req, res) => {
  // The find method is filtered to only return documents where featured is true.
  const result = await BookList.find({ featured: true });

  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

module.exports = { getAllFeaturedBooks };