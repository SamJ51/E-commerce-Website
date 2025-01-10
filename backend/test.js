// test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = require('./index');

jest.mock('./models/User'); // Tells Jest to mock all methods in User

process.env.JWT_SECRET = 'mocksecret';

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('mockedHashedPassword');
  });

  it('should register a user successfully', async () => {
    User.findByUsernameOrEmail.mockResolvedValue(null); // No existing user
    User.create.mockResolvedValue({
      user_id: 1,
      username: 'testuser',
      email: 'testuser@example.com',
      role_id: 1,
      created_at: new Date(),
    });

    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully.');
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if fields are missing', async () => {
    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      // missing email, password, role_id
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'All fields are required.' });
  });

  it('should return 409 if username or email already exists', async () => {
    User.findByUsernameOrEmail.mockResolvedValue({ user_id: 1 });

    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: 'Username or email already exists.',
    });
  });

  it('should return 500 for a server error', async () => {
    User.findByUsernameOrEmail.mockRejectedValue(new Error('Database error'));

    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      role_id: 1,
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error.' });
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with correct credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    User.findByEmail.mockResolvedValue({
      user_id: 1,
      email: 'testuser@example.com',
      password_hash: hashedPassword,
      role_id: 1,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body).toHaveProperty('token');
  });

  it('should return 400 if email or password is missing', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      // missing password
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Email and password are required',
    });
  });

  it('should return 401 if email does not exist', async () => {
    User.findByEmail.mockResolvedValue(null);

    const response = await request(app).post('/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Invalid email or password',
    });
  });

  it('should return 401 if password is incorrect', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    User.findByEmail.mockResolvedValue({
      user_id: 1,
      email: 'testuser@example.com',
      password_hash: hashedPassword,
      role_id: 1,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      password: 'wrongpass',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Invalid email or password',
    });
  });

  it('should return 500 for a server error', async () => {
    User.findByEmail.mockRejectedValue(new Error('Database error'));

    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('GET /users/profile', () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    // We'll assume a "real" user to pass the middleware
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  });

  it('should return the current user profile', async () => {
    // 1) The middleware call: findById → returning a user
    // 2) The route call: findById → returning the same user
    User.findById
      .mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role_id: 1,
      })
      .mockResolvedValueOnce({
        user_id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role_id: 1,
      });

    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        user_id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role_id: 1,
      })
    );
  });

  it('should return 401 if token is missing', async () => {
    const response = await request(app).get('/users/profile');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Access denied. No token provided.',
    });
  });

  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', 'Bearer invalidtoken');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid token.' });
  });

  it('should return 404 if user is not found', async () => {
    // First call: middleware
    User.findById.mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  it('should return 500 on server error', async () => {
    // Middleware passes:
    User.findById.mockResolvedValueOnce({
      user_id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role_id: 1,
    });
    // Then the route calls findById again → error
    User.findById.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Server error' });
  });
});

describe('PATCH /users/profile', () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  });

  it('should update the user profile successfully', async () => {
    // Make the middleware succeed
    User.findById.mockResolvedValue({ user_id: 1 });
    // Then the route calls User.update
    User.update.mockResolvedValue({
      user_id: 1,
      username: 'updatedUser',
      email: 'updated@example.com',
      role_id: 1,
    });

    const response = await request(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'updatedUser', email: 'updated@example.com' });

    expect(User.update).toHaveBeenCalledWith(1, {
      username: 'updatedUser',
      email: 'updated@example.com',
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        user_id: 1,
        username: 'updatedUser',
        email: 'updated@example.com',
        role_id: 1,
      })
    );
  });

  it('should return 400 if no fields are provided for update', async () => {
    User.findById.mockResolvedValue({ user_id: 1 });

    const response = await request(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'At least one field (username or email) is required to update.',
    });
  });

  it('should return 401 if token is missing', async () => {
    const response = await request(app).patch('/users/profile').send({
      username: 'updatedUser',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Access denied. No token provided.',
    });
  });

  it('should return 404 if user is not found', async () => {
    // Middleware fails in a “user not found” sense
    User.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'updatedUser' });

    // The route never calls User.update because middleware returns 404 first
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  it('should return 500 on server error', async () => {
    // 1) Middleware passes
    User.findById.mockResolvedValue({ user_id: 1 });
    // 2) Then route calls update → error
    User.update.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .patch('/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'updatedUser' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Server error' });
  });
});
