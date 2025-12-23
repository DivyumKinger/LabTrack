// This Controller fetches all the necessary information that are shown at ADMIN Home PAGE

const UserModel = require('../models/signUpModel')
const BookModel = require('../models/bookScheme')
const BookTransaction = require('../models/bookTransaction')

// Controller function to gather aggregated data for the admin dashboard.
const adminHomePageInfo = async (req, res) => {
  try {
    // Use Promise.all to run all independent queries concurrently for better performance.
    const [
      totalBooks,
      uniqueCategories,
      uniqueAuthors,
      totalBookRequests,
      totalIssuedBooks,
      totalRegisteredUsers,
    ] = await Promise.all([
      // 1. Get total count of all books
      BookModel.countDocuments({}),

      // 2. Get distinct categories
      BookModel.distinct('category'),

      // 3. Get distinct authors
      BookModel.distinct('author'),

      // 4. Get count of pending book requests
      BookTransaction.countDocuments({ issueStatus: 'PENDING' }),

      // 5. Get count of currently issued (accepted but not returned) books
      BookTransaction.countDocuments({
        isReturned: false,
        issueStatus: 'ACCEPTED',
      }),

      // 6. Get count of all registered normal users
      UserModel.countDocuments({ userType: 'normal_user' }),
    ])

    // Section 4: Send the final aggregated data as a JSON response.
    // This data will be used to populate the dashboard widgets on the admin home page.
    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalCategories: uniqueCategories.length,
        totalAuthors: uniqueAuthors.length,
        totalBookRequests,
        totalIssuedBooks,
        totalRegisteredUsers,
      },
    })
  } catch (error) {
    console.error('Error fetching admin dashboard info:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching dashboard data.',
    })
  }
}

module.exports = adminHomePageInfo