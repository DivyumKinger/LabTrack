// This controller handles all CRUD (Create, Read, Update, Delete) operations for books.

const BookList = require('../models/bookScheme');
const fs = require('fs');
const path = require('path');

// Controller to fetch all books from the database.
const getAllBooks = async (req, res) => {
  const result = await BookList.find({});
  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

// Controller to add a new book to the database.
const postBook = async (req, res) => {
  // Multer middleware handles the file upload and provides the file path in req.file.path.
  const image = req.file.path;
  const { title, description, language, author, category } = req.body;

  // Convert string 'true'/'false' from form data to boolean values.
  let featured = req.body.featured === 'true';
  let available = req.body.available === 'true';

  // Create a new book document in the database with the provided details.
  const result = await BookList.create({
    title,
    description,
    language,
    author,
    category,
    featured,
    available,
    image,
  });

  res.status(201).json({ success: true, data: result });
};

// Controller to fetch a single book by its unique ID.
const getSingleBook = async (req, res) => {
  const { id: bookID } = req.params;
  const result = await BookList.findById({ _id: bookID });

  // If no book is found with the given ID, return a 404 error.
  if (!result) {
    return res.status(404).json({
      status: 'fail',
      message: `Book with id ${bookID} doesn't exist.`,
    });
  }

  res.status(200).json({ success: true, data: result });
};

// Controller to update the details of a single book.
const patchBook = async (req, res) => {
  const { id: bookID } = req.params;

  // Find the book by its ID and update it with the new data from the request body.
  const result = await BookList.findByIdAndUpdate({ _id: bookID }, req.body, {
    new: true, // This option returns the modified document instead of the original.
    runValidators: true, // This ensures that the update operation adheres to the schema's validation rules.
  });

  if (!result) {
    return res.status(404).json({
      status: 'fail',
      message: `Book with id ${bookID} doesn't exist.`,
    });
  }

  res.status(200).json({ success: true, data: result });
};

// Controller to delete a single book by its ID.
const deleteBook = async (req, res) => {
  const { id: bookID } = req.params;

  // First, find the book to get the path of its associated image file.
  const book = await BookList.findById(bookID);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: `Book with id ${bookID} doesn't exist.`,
    });
  }

  const imageFilename = book.image;

  // Delete the book document from the database.
  const result = await BookList.findByIdAndDelete({ _id: bookID });
  if (!result) {
    // This case is unlikely if the findById above succeeded, but it's good practice for robustness.
    return res.status(404).json({
      status: 'fail',
      message: `Book with id ${bookID} doesn't exist.`,
    });
  }

  // If an image path exists, delete the corresponding image file from the 'uploads' folder.
  if (imageFilename) {
    const imagePath = path.join(__dirname, '..', imageFilename);
    fs.unlink(imagePath, (err) => {
      if (err) {
        // Log an error if file deletion fails, but still proceed with the success response.
        console.error(`Error deleting image file: ${err}`);
      }
    });
  }

  res.status(200).json({ status: 'success', data: null });
};

module.exports = {
  getAllBooks,
  postBook,
  getSingleBook,
  patchBook,
  deleteBook,
};