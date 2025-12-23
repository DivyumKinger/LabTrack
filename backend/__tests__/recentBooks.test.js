const request = require('supertest');
const express = require('express');
const booksRouterRecentBooks = require('../routes/booksRoutesRecentBooks');
const Book = require('../models/bookScheme');

// Mock the model
jest.mock('../models/bookScheme');

const app = express();
app.use('/api/v1/recentBooks', booksRouterRecentBooks);

describe('Recent Books API Test', () => {
  test('GET /api/v1/recentBooks should return recent books', async () => {
    const mockRecentBooks = [{ title: 'A New Book' }];
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockRecentBooks),
    };
    Book.find.mockReturnValue(mockQuery);

    const response = await request(app).get('/api/v1/recentBooks');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockRecentBooks);
  });
});
