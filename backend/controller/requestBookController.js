// This controller manages all aspects of book transactions, including requests, issues, and returns.

const BookTransaction = require("../models/bookTransaction");
const BookSchema = require("../models/bookScheme");
const PopularBookSchema = require("../models/PopularBooks");
const UserSchema = require("../models/signUpModel");
const UserLastBookModel = require("../models/userLastBook");

// Controller for a user to request a book.
const postBooks = async (req, res) => {
  // Extract user and book details from the request.
  const { userId, username, userEmail } = req;
  const { bookId } = req.body;

  // Rule 1: Check if the user has any overdue books.
  const allUsersBooksTransaction = await BookTransaction.find({ userId });
  const hasAnyUnreturnedBooks = allUsersBooksTransaction.some(
    (item) => item.extraCharge !== 0 && !item.isReturned
  );

  if (hasAnyUnreturnedBooks) {
    return res.status(400).json({
      success: false,
      message: `Book Request Blocked! Return 'Due' books to Continue`,
    });
  }

  // Rule 2: Check if the user has reached the maximum limit of 5 requested books.
  const { totalRequestedBooks } = await UserSchema.findById(userId);
  if (totalRequestedBooks >= 5) {
    return res.status(400).json({ success: false, message: `Books Limit Reached` });
  }

  // Rule 3: Check if the user has already requested this specific book and not returned it.
  const checkPrevRequest = await BookTransaction.find({ userId, bookId });
  if (checkPrevRequest.length > 0) {
    const isBookAlreadyRequested = checkPrevRequest.some((map_para) => !map_para.isReturned);
    if (isBookAlreadyRequested) {
      return res.status(400).json({ success: false, message: "Book already Requested" });
    }
  }

  // If all rules pass, create the book transaction.
  const { title } = await BookSchema.findById(bookId);
  await createBookTransaction(req, res, userId, bookId, userEmail, username, title, totalRequestedBooks);
};

// Helper function to create a new book transaction record.
async function createBookTransaction(req, res, userId, bookId, userEmail, username, title, totalRequestedBooks) {
  const result = await BookTransaction.create({
    userId,
    bookId,
    userEmail,
    username,
    bookTitle: title,
  });

  // Increment the user's total requested books count.
  await UserSchema.findByIdAndUpdate(userId, {
    totalRequestedBooks: totalRequestedBooks + 1,
  });

  // Emit a WebSocket event to all clients
  req.io.emit('notification', { message: `Book "${title}" was just requested by ${username}!` });

  return res.status(200).json({ success: true, data: result });
}

// Controller for an admin to issue a book directly to a user.
const postIssueBooks = async (req, res) => {
  const { bookId, userEmail } = req.body;
  const getUserData = await UserSchema.findOne({ email: userEmail });

  if (!getUserData) {
    return res.status(400).json({ success: false, message: `Email doesn't Exist` });
  }

  const { totalRequestedBooks, totalAcceptedBooks, _id, username } = getUserData;
  const userId = _id.toString();

  // Similar checks as the user request, but performed by an admin.
  if (totalRequestedBooks >= 5) {
    return res.status(400).json({ success: false, message: `Books Limit Reached` });
  }

  const { title } = await BookSchema.findById(bookId);
  const checkPrevRequest = await BookTransaction.find({ userId, bookId });

  if (checkPrevRequest.length > 0) {
    const isBookAlreadyRequested = checkPrevRequest.some((map_para) => !map_para.isReturned);
    if (isBookAlreadyRequested) {
      return res.status(400).json({ success: false, message: "Book already Requested" });
    }
  }

  // Create the transaction with an 'ACCEPTED' status and set issue/return dates.
  const result = await BookTransaction.create({
    userId,
    bookId,
    userEmail,
    username,
    bookTitle: title,
    issueStatus: "ACCEPTED",
    issueDate: new Date(),
    returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now.
  });

  // Update user's book counts.
  await UserSchema.findByIdAndUpdate(userId, {
    totalAcceptedBooks: totalAcceptedBooks + 1,
    totalRequestedBooks: totalRequestedBooks + 1,
  });

  // Record this as the user's last borrowed book.
  await updateUserLastBook(userId, userEmail, bookId, title);

  return res.status(200).json({ success: true, data: result });
};

// Fetches all book requests that are currently 'PENDING' or 'READY' for pickup.
const getRequestedBooks = async (req, res) => {
  const result = await BookTransaction.find({
    issueStatus: { $in: ["PENDING", "READY"] },
  }).sort({ issueDate: -1 });
  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

// Fetches all books that have been issued ('ACCEPTED') but not yet returned.
const getNotReturnedBooks = async (req, res) => {
  const result = await BookTransaction.find({
    issueStatus: "ACCEPTED",
    isReturned: false,
  });
  res.status(200).json({ success: true, totalHits: result.length, data: result });
};

// Controller to update the status of a book transaction (e.g., accept, cancel, return).
const patchRequestedBooks = async (req, res) => {
  const { id, issueStatus, isReturned } = req.body;

  // Handle DELETION (e.g., user removing their own pending request)
  if (issueStatus === "DELETE") {
    const transaction = await BookTransaction.findById(id);
    if (transaction) {
      // Decrement user's request count
      const user = await UserSchema.findById(transaction.userId);
      if (user) {
        await UserSchema.findByIdAndUpdate(transaction.userId, {
          totalRequestedBooks: user.totalRequestedBooks - 1,
        });
      }
    }
    await BookTransaction.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: `Book request removed.` });
  }

  // Handle CANCELLATION (e.g., admin cancelling a request)
  if (issueStatus === "CANCELLED") {
    const transaction = await BookTransaction.findById(id);
    if (transaction) {
      // --- WebSocket Notification for Admin Cancel ---
      const userSocketId = req.userSocketMap[transaction.userId];
      if (userSocketId) {
        req.io.to(userSocketId).emit('request-update', { 
          message: `Your request for "${transaction.bookTitle}" was cancelled by the admin.` 
        });
      }
      // --- End WebSocket Notification ---

      // Decrement user's request count
      const user = await UserSchema.findById(transaction.userId);
      if (user) {
        await UserSchema.findByIdAndUpdate(transaction.userId, {
          totalRequestedBooks: user.totalRequestedBooks - 1,
        });
      }

      const updatedTransaction = await BookTransaction.findByIdAndUpdate(id, { issueStatus: 'CANCELLED' }, { new: true });
      return res.status(200).json({ success: true, data: updatedTransaction });
    }
  }

  // Handle user dismissing a previously cancelled request
  if (issueStatus === "ADMINCANCELLED") {
    // This is a cleanup action from the user's dashboard.
    // We just process it silently without sending a notification.
    const updatedTransaction = await BookTransaction.findByIdAndUpdate(id, { issueStatus: 'CANCELLED' }, { new: true });
    return res.status(200).json({ success: true, data: updatedTransaction });
  }

  // Handle other status updates (ALREADYRETURNED, ACCEPTED, READY, PENDING, etc.)
  const result = await BookTransaction.findByIdAndUpdate(id, { issueStatus, isReturned }, { new: true, runValidators: true });
  
  if (!result) {
    // If for some reason the transaction doesn't exist, handle it gracefully
    return res.status(404).json({ success: false, message: "Transaction not found." });
  }

  const { bookId, bookTitle, userId, userEmail } = result;

  // --- WebSocket Notification for other status changes ---
  const userSocketId = req.userSocketMap[userId];
  if (userSocketId) {
    if (issueStatus === 'READY') {
      req.io.to(userSocketId).emit('request-update', { 
        message: `Your book "${bookTitle}" is now ready for pickup!` 
      });
    } else if (issueStatus === 'PENDING') {
      req.io.to(userSocketId).emit('request-update', { 
        message: `The status of your request for "${bookTitle}" was updated to Pending.` 
      });
    }
  }
  // --- End WebSocket Notification ---

  // Logic for when a book is marked as returned.
  if (isReturned) {
    const user = await UserSchema.findById(userId);
    if (user) {
      // Decrement user's counts for accepted books.
      await UserSchema.findByIdAndUpdate(userId, {
        totalAcceptedBooks: user.totalAcceptedBooks - 1,
      });
    }

    // Perform the correct update in a single call
    const updatedTransaction = await BookTransaction.findByIdAndUpdate(id, { 
      issueStatus: "RETURNED",
      isReturned: true 
    }, { new: true });

    // --- WebSocket Notification for Return ---
    const userSocketId = req.userSocketMap[userId];
    if (userSocketId) {
      req.io.to(userSocketId).emit('request-update', { 
        message: `Your book "${bookTitle}" has been successfully returned. Thank you!` 
      });
    }
    // --- End WebSocket Notification ---

    // Return the correct, fully updated transaction data
    return res.status(200).json({ success: true, data: updatedTransaction });
  }

  // Logic for when a book request is accepted by an admin.
  if (issueStatus === "ACCEPTED") {
    await BookTransaction.findByIdAndUpdate(id, {
      issueDate: new Date(),
      returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });
    const user = await UserSchema.findById(userId);
    await UserSchema.findByIdAndUpdate(userId, { totalAcceptedBooks: user.totalAcceptedBooks + 1 });

    // --- WebSocket Notification ---
    const userSocketId = req.userSocketMap[userId];
    if (userSocketId) {
      req.io.to(userSocketId).emit('request-update', { 
        message: `Your request for "${bookTitle}" has been approved!` 
      });
    }
    // --- End WebSocket Notification ---

    // Update user's last borrowed book and update the popular books collection.
    await updateUserLastBook(userId, userEmail, bookId, bookTitle);
    await createOrUpdatePopularBook(bookId, bookTitle);
  }

  res.status(200).json({ success: true, data: result });
};

// Helper to track a book's popularity.
const createOrUpdatePopularBook = async (bookId, bookTitle) => {
  const popularBook = await PopularBookSchema.findOne({ bookId });
  if (!popularBook) {
    await PopularBookSchema.create({ bookId, bookTitle });
  } else {
    await PopularBookSchema.findOneAndUpdate({ bookId }, { $inc: { issueQuantity: 1 } });
  }
};

// Helper to update the user's last borrowed book record.
const updateUserLastBook = async (userId, userEmail, bookId, bookTitle) => {
  await UserLastBookModel.findOneAndUpdate(
    { userId },
    { userId, userEmail, lastBorrowedBookId: bookId, lastBorrowedBookTitle: title },
    { upsert: true, new: true, runValidators: true } // Upsert creates the document if it doesn't exist.
  );
};

module.exports = {
  postBooks,
  getRequestedBooks,
  patchRequestedBooks,
  getNotReturnedBooks,
  postIssueBooks,
};