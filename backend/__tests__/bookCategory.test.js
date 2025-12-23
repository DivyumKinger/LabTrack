const request = require('supertest');
const express = require('express');
const bookCategoryRouter = require('../routes/bookCategoryRoutes');
const Book = require('../models/bookScheme');

// Mock the model
jest.mock('../models/bookScheme');

const app = express();
app.use(express.json()); // Add JSON body parser
app.use('/api/v1/book_category', bookCategoryRouter);

describe('Book Category API Test', () => {
  test('POST /api/v1/book_category should return categories', async () => {
    const mockCategories = ['Fiction', 'Science'];
    Book.distinct.mockResolvedValue(mockCategories);

    const response = await request(app)
      .post('/api/v1/book_category')
      .send({ user_input_category: 'Fict' }); // Send a POST body

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    // The controller returns a different key, so we check for that
    expect(response.body).toHaveProperty('book_category');
    expect(response.body.book_category).toEqual(mockCategories);
  });
});
