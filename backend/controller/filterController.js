// Controller to filter books based on multiple query parameters.

const BookList = require('../models/bookScheme');

// This function dynamically builds a MongoDB query object based on the filter parameters provided in the request.
const getFilterData = async (req, res) => {
  const { title, available, category, author, language, featured } = req.query;
  const queryObject = {}; // Initialize an empty object to build the query.

  // For each potential filter, check if it exists in the query and add it to the queryObject.

  if (title) {
    // Use $regex for partial, case-insensitive title matching.
    queryObject.title = { $regex: title, $options: 'i' };
  }

  if (available) {
    // Convert string 'true'/'false' to a boolean.
    queryObject.available = available === 'true';
  }

  if (featured) {
    queryObject.featured = featured === 'true';
  }

  if (category) {
    // Handle multiple categories by splitting the comma-separated string into an array of regex patterns.
    const categories = category.split(',').map((cat) => new RegExp(cat, 'i'));
    queryObject.category = { $in: categories }; // Use $in to match any category in the array.
  }

  if (author) {
    queryObject.author = { $regex: author, $options: 'i' };
  }

  if (language) {
    queryObject.language = { $regex: language, $options: 'i' };
  }

  // Execute the query with the dynamically built queryObject.
  const result = await BookList.find(queryObject);

  res.status(200).json({ total: result.length, data: result });
};

module.exports = { getFilterData };