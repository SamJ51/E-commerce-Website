// test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = require('./index');
const db = require('./config/db');

jest.mock('./models/User'); // Tells Jest to mock all methods in User

jest.mock('./config/db', () => ({
    query: jest.fn(),
}));

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

describe('GET /products', () => {
    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
    });

    it('should return products with default pagination', async () => {
        // Mock the DB calls for products + count
        db.query
            // First .mockResolvedValueOnce for the main products query
            .mockResolvedValueOnce({
                rows: [
                    {
                        product_id: 1,
                        name: 'Example Product',
                        description: 'An example product description',
                        price: 50,
                    },
                ],
            })
            // Then for the count query
            .mockResolvedValueOnce({
                rows: [{ count: '1' }],
            });

        const response = await request(app).get('/products');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('products');
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0]).toMatchObject({
            product_id: 1,
            name: 'Example Product',
            description: 'An example product description',
            price: 50,
        });
        expect(response.body.pagination).toMatchObject({
            totalProducts: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 10, // default limit in your route
        });
    });

    it('should return products filtered by category', async () => {
        // Mock DB calls for filtered products + count
        db.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        product_id: 2,
                        name: 'Filtered Product',
                        description: 'Matches category',
                        price: 100,
                    },
                ],
            })
            .mockResolvedValueOnce({
                rows: [{ count: '1' }],
            });

        const response = await request(app).get('/products?category=Electronics');
        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        // This ensures our mock DB call got the right query parameters
        // (In a real test, you might check the actual SQL or the db.query calls if you’re verifying the query.)
    });

    it('should handle server errors', async () => {
        db.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).get('/products');
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Failed to fetch products' });
    });


});
describe('GET /products/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the details of a specific product', async () => {
        const productId = 1;

        // Mock the database query for product details
        db.query.mockResolvedValueOnce({
            rows: [
                {
                    product_id: 1,
                    name: 'Example Product',
                    description: 'This is an example product',
                    price: 99.99,
                    stock: 50,
                    main_image_url: 'http://example.com/image.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                    categories: ['Electronics'],
                    tags: ['BestSeller'],
                },
            ],
        });

        const response = await request(app).get(`/products/${productId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('product');
        expect(response.body.product).toMatchObject({
            id: 1,
            name: 'Example Product',
            description: 'This is an example product',
            price: 99.99,
            stock: 50,
            mainImageUrl: 'http://example.com/image.jpg',
            categories: ['Electronics'],
            tags: ['BestSeller'],
        });
    });

    it('should return 400 if the product ID is invalid', async () => {
        const response = await request(app).get('/products/invalid');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid product ID.' });
    });

    it('should return 404 if the product is not found', async () => {
        const productId = 999;

        // Mock the database query to return no results
        db.query.mockResolvedValueOnce({
            rowCount: 0,
            rows: [],
        });

        const response = await request(app).get(`/products/${productId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Product not found.' });
    });

    it('should return 500 if there is a server error', async () => {
        const productId = 1;

        // Mock the database query to throw an error
        db.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).get(`/products/${productId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Failed to fetch product details.' });
    });
});

describe('Admin Product Routes', () => {
    let adminToken, userToken;

    beforeAll(() => {
        // We'll create an admin token and a regular user token for the tests.
        // Suppose role_id = 2 is admin
        adminToken = jwt.sign({ id: 1, role_id: 2 }, process.env.JWT_SECRET);
        userToken = jwt.sign({ id: 2, role_id: 1 }, process.env.JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // By default, let findById() return an admin user (role_id=2).
        User.findById.mockResolvedValue({
            user_id: 1,
            username: 'adminUser',
            email: 'admin@example.com',
            role_id: 2,
        });
    });

    // ----------- POST /products -----------
    describe('POST /products', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app)
                .post('/products')
                .send({ name: 'New Product', description: 'Desc', price: 10, stock: 5 });
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 403 if user is not admin', async () => {
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'normalUser',
                email: 'user@example.com',
                role_id: 1, // Not admin
            });
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'New Product', description: 'Desc', price: 10, stock: 5 });
            expect(response.status).toBe(403);
            expect(response.body).toEqual({ message: 'Forbidden: Admins only.' });
        });

        it('should create a new product for admin', async () => {
            // Mock DB response for an insert
            db.query.mockResolvedValueOnce({
                rows: [
                    {
                        id: 123,
                        name: 'New Product',
                        description: 'Desc',
                        price: 10,
                        stock: 5,
                        main_image_url: null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                ],
            });

            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Product',
                    description: 'Desc',
                    price: 10,
                    stock: 5
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Product created successfully.');
            expect(response.body).toHaveProperty('product');
            expect(response.body.product).toMatchObject({
                id: 123,
                name: 'New Product',
                description: 'Desc',
                price: 10,
                stock: 5,
            });
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); // missing required fields
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Missing required fields.' });
        });

        it('should return 500 on server error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Product',
                    description: 'Desc',
                    price: 10,
                    stock: 5
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create product.' });
        });
    });

    // ----------- PATCH /products/:id -----------
    describe('PATCH /products/:id', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app)
                .patch('/products/123')
                .send({ price: 20 });
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 403 if user is not admin', async () => {
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'normalUser',
                email: 'user@example.com',
                role_id: 1, // Not admin
            });
            const response = await request(app)
                .patch('/products/123')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ price: 20 });
            expect(response.status).toBe(403);
            expect(response.body).toEqual({ message: 'Forbidden: Admins only.' });
        });

        it('should update a product for admin', async () => {
            db.query.mockResolvedValueOnce({
                rows: [
                    {
                        id: 123,
                        name: 'Existing Product',
                        description: 'Desc',
                        price: 20,
                        stock: 5,
                        main_image_url: null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                ],
                rowCount: 1,
            });

            const response = await request(app)
                .patch('/products/123')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 20 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('product');
            expect(response.body.product).toMatchObject({
                id: 123,
                price: 20,
            });
        });

        it('should return 400 if product ID is invalid', async () => {
            const response = await request(app)
                .patch('/products/invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 20 });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid product ID.' });
        });

        it('should return 400 if no fields to update', async () => {
            const response = await request(app)
                .patch('/products/123')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'No valid fields provided for update.'
            });
        });

        it('should return 404 if the product is not found', async () => {
            db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

            const response = await request(app)
                .patch('/products/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 20 });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Product not found.' });
        });

        it('should return 500 on server error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .patch('/products/123')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 20 });
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update product.' });
        });
    });

    // ----------- DELETE /products/:id -----------
    describe('DELETE /products/:id', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app).delete('/products/123');
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 403 if user is not admin', async () => {
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'normalUser',
                email: 'user@example.com',
                role_id: 1, // Not admin
            });
            const response = await request(app)
                .delete('/products/123')
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(403);
            expect(response.body).toEqual({ message: 'Forbidden: Admins only.' });
        });

        it('should delete a product for admin', async () => {
            db.query.mockResolvedValueOnce({ rowCount: 1 });

            const response = await request(app)
                .delete('/products/123')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Product deleted successfully.' });
        });

        it('should return 400 if product ID is invalid', async () => {
            const response = await request(app)
                .delete('/products/invalid')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid product ID.' });
        });

        it('should return 404 if product is not found', async () => {
            db.query.mockResolvedValueOnce({ rowCount: 0 });

            const response = await request(app)
                .delete('/products/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Product not found.' });
        });

        it('should return 500 on server error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete('/products/123')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete product.' });
        });
    });
});
