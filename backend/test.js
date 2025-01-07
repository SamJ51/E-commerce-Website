const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Mock this model
const registerRoute = require('./routes/authorisation/register'); // Import the route

jest.mock('./models/User'); // Mock User model

const app = express();
app.use(express.json());
app.use(registerRoute);

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    };

    User.findByUsernameOrEmail.mockResolvedValue(null); // No existing user
    User.create.mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      email: 'testuser@example.com',
      role_id: 1,
      created_at: new Date(),
    });

    const response = await request(app).post('/auth/register').send(mockUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'User registered successfully.',
        user: expect.objectContaining({
          username: 'testuser',
          email: 'testuser@example.com',
          role_id: 1,
        }),
      })
    );
  });

  it('should return 400 if fields are missing', async () => {
    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'All fields are required.',
    });
  });

  it('should return 409 if username or email already exists', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    };

    User.findByUsernameOrEmail.mockResolvedValue(mockUser); // Existing user

    const response = await request(app).post('/auth/register').send(mockUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: 'Username or email already exists.',
    });
  });

  it('should return 500 for a server error', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    };

    User.findByUsernameOrEmail.mockRejectedValue(new Error('Database error')); // Simulate DB error

    const response = await request(app).post('/auth/register').send(mockUser);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error.',
    });
  });
});
