// This controller handles updating a book's image.
// It replaces the old image file path in the database with the new one and deletes the old image file from the server's 'uploads' folder.

const BookModel = require('../models/bookScheme');
const fs = require('fs');
const path = require('path');

// This function updates the image for a specific book.
const updateBookImage = async (req, res) => {
  // Extract the book's ID from the request parameters.
  const { id: bookID } = req.params;
  // Get the path of the newly uploaded image file provided by multer.
  const new_imageFileLocation = req.file.path;

  // Find the book in the database using its ID to get its details.
  const getBookDetails = await BookModel.findById(bookID);

  // If no book is found with the given ID, return an error.
  if (!getBookDetails) {
    return res.status(400).json({
      status: 'fail',
      message: `Book with id ${bookID} doesn't exist.`,
    });
  }

  // Get the file path of the old image from the book details.
  const old_imageFileLocation = getBookDetails.image;

  // Find the book by its ID and update the 'image' field with the new file path.
  await BookModel.findByIdAndUpdate(
    { _id: bookID },
    { image: new_imageFileLocation },
    {
      new: true, // Returns the modified document instead of the original.
      runValidators: true, // Ensures that update operations adhere to the schema's validation rules.
    }
  );

  // Construct the absolute path to the old image file to delete it from the filesystem.
  const imagePath = path.join(__dirname, '..', old_imageFileLocation);

  // Use the 'fs.unlink' method to delete the old image file.
  // This is an asynchronous operation; a callback handles any potential errors.
  fs.unlink(imagePath, (err) => {
    if (err) {
      // Log an error if the file deletion fails but don't block the response.
      console.error(`Error deleting image file: ${err}`);
    }
  });

  // Send a success response, including the details of the book before the image was updated.
  res.status(200).json({ success: true, data: getBookDetails });
};

module.exports = updateBookImage;