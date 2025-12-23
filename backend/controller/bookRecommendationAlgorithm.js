// This file contains the core logic for the content-based filtering recommendation algorithm.

const BooksModel = require('../models/bookScheme');
const BookTransactionModel = require('../models/bookTransaction');

/**
 * Analyzes a user's borrowing history to generate personalized book recommendations.
 * @param {string} userId - The ID of the user for whom to generate recommendations.
 * @param {string} bookId - The ID of the last book the user borrowed.
 * @returns {Array} An array of recommended book objects, limited to a maximum of 4.
 */
const analyzeUserPreferences = async (userId, bookId) => {
  // Step 1: Fetch the user's entire borrowing history where the issue status was 'ACCEPTED'.
  const userBookDetails = await BookTransactionModel.find({ userId, issueStatus: 'ACCEPTED' });

  // Extract the book IDs from the user's borrowing history.
  const bookIdArray = userBookDetails.map((obj) => obj.bookId);

  // Get the full details of all books the user has previously borrowed.
  const queriedBookData = await BooksModel.find({ _id: { $in: bookIdArray } });

  // Step 2: Build a profile of the user's preferences based on their history.
  // Extract unique categories, authors, and languages from the books they've read.
  const categoryArray = [...new Set(queriedBookData.map((obj) => obj.category))];
  const authorArray = [...new Set(queriedBookData.map((obj) => obj.author))];
  const languageArray = [...new Set(queriedBookData.map((obj) => obj.language))];

  // --- Include preferences from the most recently borrowed book ---
  const lastBorrowedBook = await BooksModel.findOne({ _id: bookId });
  
  // If the last borrowed book is found, add its properties to the profile.
  if (lastBorrowedBook) {
    const { category, author, language } = lastBorrowedBook;

    // Add the last book's details to the user's preference profile if they aren't already there.
    if (!categoryArray.includes(category)) {
      categoryArray.push(category);
    }
    if (!languageArray.includes(language)) {
      languageArray.push(language);
    }
    if (!authorArray.includes(author)) {
      authorArray.push(author);
    }
  }

  // Step 3: Find potential recommendations.
  // Find all available books that match the user's preferred languages, excluding books they've already read.
  let similarLanguageBooks = await BooksModel.find({
    available: true,
    language: { $in: languageArray },
    _id: { $nin: bookIdArray, $ne: bookId }, // Exclude already read books and the last borrowed one.
  });

  // From the language-matched books, filter for books by the same author as the last borrowed book.
  const similarAuthorBooks = lastBorrowedBook ? similarLanguageBooks.filter((filter_para) => {
    return filter_para.author == lastBorrowedBook.author;
  }) : [];

  // From the language-matched books, filter for books in the user's preferred categories, but exclude the current author to increase diversity.
  const similarCategoryBooks = lastBorrowedBook ? similarLanguageBooks.filter((filter_para) => {
    return (
      categoryArray.includes(filter_para.category) &&
      filter_para.author !== lastBorrowedBook.author
    );
  }) : similarLanguageBooks.filter((filter_para) => categoryArray.includes(filter_para.category)); // Fallback if no last book

  // Step 4: Assemble the final recommendation list (up to 4 books).
  let recommendationBooks;

  // Prioritize books by the same author, then add books from similar categories.
  if (similarAuthorBooks.length <= 2) {
    recommendationBooks = similarAuthorBooks.concat(similarCategoryBooks);
    recommendationBooks = recommendationBooks.slice(0, 4);

    // If the list is still not full, supplement with more books from similar languages.
    if (recommendationBooks.length < 4) {
      let updatedBooks = similarLanguageBooks.filter((book) => {
        // Exclude books already in the recommendation list.
        return !recommendationBooks.some((recBook) => recBook._id.equals(book._id));
      });
      recommendationBooks = recommendationBooks.concat(updatedBooks).slice(0, 4);
    }
  } else {
    // If there are many books by the same author, take the first 2 and supplement with category matches.
    const newAuthorBooks = similarAuthorBooks.slice(0, 2);
    recommendationBooks = newAuthorBooks.concat(similarCategoryBooks);
    recommendationBooks = recommendationBooks.slice(0, 4);
  }

  return recommendationBooks;
};

// An internal testing endpoint to validate the recommendation algorithm.
const algoTest = async (req, res) => {
  const result = await analyzeUserPreferences(
    '649179774afae22ac6166b6e', // Test user ID
    '64967c201faf3efe0d583f2e'  // Test book ID
  );

  // Format the output for easier debugging.
  const titlesAndCategories = result.map((book) => ({
    id: book._id,
    title: book.title,
    category: book.category,
    author: book.author,
  }));

  res.status(200).json({
    totalHits: titlesAndCategories.length,
    recommendedBooks: titlesAndCategories,
  });
};

module.exports = { analyzeUserPreferences, algoTest };