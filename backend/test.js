// test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = require('./index');
const db = require('./config/db');

jest.mock('./models/User'); // Tells Jest to mock all methods in User

jest.mock('./config/db', () => ({
    query: jest.fn(),
}));

process.env.JWT_SECRET = 'mocksecret';

describe('Authentication and Authorisation', () => {
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
});

describe('User Management', () => {
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
});

describe('Product Catalog', () => {
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

    describe('Admin Product Management', () => {
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
});

describe('Cart Management', () => {
    const mockToken = jwt.sign({ id: 1 }, 'mocksecret');

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock User.findById for verifyToken middleware
        User.findById.mockResolvedValue({
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role_id: 1,
        });
    });

    // GET /cart
    describe('GET /cart', () => {
        it('should fetch the user cart', async () => {
            const mockCart = { cart_id: 1, user_id: 1 };
            const mockCartItems = [
                { cart_item_id: 1, product_id: 1, quantity: 2, name: 'Product 1', price: 10, main_image_url: 'image1.jpg' },
                { cart_item_id: 2, product_id: 2, quantity: 1, name: 'Product 2', price: 20, main_image_url: 'image2.jpg' },
            ];

            // Mock db.query for fetching cart
            db.query.mockResolvedValueOnce({ rows: [mockCart] }); // First call for fetching cart
            // Mock db.query for fetching cart items
            db.query.mockResolvedValueOnce({ rows: mockCartItems }); // Second call for fetching cart items

            const response = await request(app)
                .get('/cart')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                cart_id: 1,
                user_id: 1,
                items: mockCartItems,
            });

            // Verify that db.query was called correctly
            expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM Cart WHERE user_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT ci.cart_item_id, ci.quantity, p.product_id, p.name, p.price, p.main_image_url'), [1]);

        });

        it('should return 404 if cart not found', async () => {
            // Mock db.query to return empty result for cart
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .get('/cart')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cart not found');
        });

        it('should return 500 on server error', async () => {
            // Mock db.query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/cart')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('An error occurred while fetching the cart');
        });
    });

    // POST /cart/items
    describe('POST /cart/items', () => {
        it('should add an item to the cart', async () => {
            const mockCart = { cart_id: 1, user_id: 1 };
            const mockProduct = { product_id: 1, name: 'Product 1', price: 10 };

            // 1. Mock product existence check
            db.query.mockResolvedValueOnce({ rows: [mockProduct] });
            // 2. Mock cart finding/creation
            db.query.mockResolvedValueOnce({ rows: [mockCart] });
            // 3. Mock existing cart item check
            db.query.mockResolvedValueOnce({ rows: [] });
            // 4. Mock item insertion into cart
            db.query.mockResolvedValueOnce({ rows: [{ cart_item_id: 1 }] });

            const response = await request(app)
                .post('/cart/items')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ product_id: 1, quantity: 1 });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Item added to cart');

            // Verify db.query calls (adjust call numbers if needed)
            expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM Products WHERE product_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM Cart WHERE user_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(3, 'SELECT * FROM Cart_Items WHERE cart_id = $1 AND product_id = $2', [1, 1]);
            expect(db.query).toHaveBeenNthCalledWith(4, 'INSERT INTO Cart_Items (cart_id, product_id, quantity) VALUES ($1, $2, $3)', [1, 1, 1]);

        });

        it('should update quantity if item already in cart', async () => {
            const mockCart = { cart_id: 1, user_id: 1 };
            const mockProduct = { product_id: 1, name: 'Product 1', price: 10 };
            const existingCartItem = { cart_item_id: 1, cart_id: 1, product_id: 1, quantity: 2 };

            // 1. Mock product existence check
            db.query.mockResolvedValueOnce({ rows: [mockProduct] });
            // 2. Mock cart finding
            db.query.mockResolvedValueOnce({ rows: [mockCart] });
            // 3. Mock existing cart item check (item exists)
            db.query.mockResolvedValueOnce({ rows: [existingCartItem] });
            // 4. Mock item update in cart
            db.query.mockResolvedValueOnce({ rows: [{ cart_item_id: 1 }] });

            const response = await request(app)
                .post('/cart/items')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ product_id: 1, quantity: 3 }); // Adding 3 to existing quantity of 2

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cart item quantity updated');

            // Verify db.query calls
            expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM Products WHERE product_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM Cart WHERE user_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(3, 'SELECT * FROM Cart_Items WHERE cart_id = $1 AND product_id = $2', [1, 1]);
            expect(db.query).toHaveBeenNthCalledWith(4, 'UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2', [5, 1]); // 2 + 3 = 5
        });

        it('should return 400 if product_id or quantity is missing', async () => {
            const response = await request(app)
                .post('/cart/items')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ product_id: 1 });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Product ID and quantity are required');
        });

        it('should return 404 if product does not exist', async () => {
            // Mock product existence check to return empty
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/cart/items')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ product_id: 999, quantity: 1 });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Product not found');
        });

        it('should return 500 on server error', async () => {
            // Mock db.query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/cart/items')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ product_id: 1, quantity: 1 });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('An error occurred while adding the item to the cart');
        });
    });

    // PATCH /cart/items/:id
    describe('PATCH /cart/items/:id', () => {
        it('should update the quantity of a cart item', async () => {
            const cartItemId = '1'; // cartItemId is a string now
            const mockCartItem = { cart_item_id: 1, cart_id: 1, product_id: 1, quantity: 2 };

            // Mock the query to find the cart item and verify user ownership
            db.query.mockResolvedValueOnce({ rows: [mockCartItem] });
            // Mock the update query
            db.query.mockResolvedValueOnce({ rows: [{ cart_item_id: 1, quantity: 5 }] });

            const response = await request(app)
                .patch(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cart item updated');

            // Verify db.query calls
            // The userId is 1 (from the mocked token), and cartItemId is '1' (string)
            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT ci.*'), [cartItemId, 1]); // Corrected parameters
            expect(db.query).toHaveBeenNthCalledWith(2, 'UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2', [5, cartItemId]);
        });

        it('should return 400 if quantity is invalid', async () => {
            const cartItemId = '1';

            const response = await request(app)
                .patch(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ quantity: 0 }); // Invalid quantity

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Quantity must be greater than zero');
        });

        it('should return 404 if cart item not found', async () => {
            const cartItemId = '999';

            // Mock the query to return an empty result (item not found)
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .patch(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cart item not found');
        });

        it('should return 500 on server error', async () => {
            const cartItemId = '1';

            // Mock db.query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .patch(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ quantity: 5 });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('An error occurred while updating the cart item');
        });
    });

    // DELETE /cart/items/:id
    describe('DELETE /cart/items/:id', () => {
        it('should remove an item from the cart', async () => {
            const cartItemId = '1'; // cartItemId is a string now
            const mockCartItem = { cart_item_id: 1, cart_id: 1, product_id: 1, quantity: 2 };

            // Mock the query to find the cart item and verify user ownership
            db.query.mockResolvedValueOnce({ rows: [mockCartItem] });
            // Mock the delete query
            db.query.mockResolvedValueOnce({ rowCount: 1 }); // Indicate successful deletion

            const response = await request(app)
                .delete(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cart item removed');

            // Verify db.query calls
            // The userId is 1 (from the mocked token), and cartItemId is '1' (string)
            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT ci.*'), [cartItemId, 1]); // Corrected parameters
            expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM Cart_Items WHERE cart_item_id = $1', [cartItemId]);
        });

        it('should return 404 if cart item not found', async () => {
            const cartItemId = '999';

            // Mock the query to return an empty result (item not found)
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .delete(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cart item not found');
        });

        it('should return 500 on server error', async () => {
            const cartItemId = '1';

            // Mock db.query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${mockToken}`);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('An error occurred while removing the cart item');
        });
    });
});

describe('Order Management', () => {
    let userToken;
    let adminToken;

    beforeAll(() => {
        // Create tokens for testing
        userToken = jwt.sign({ id: 1, role_id: 1 }, process.env.JWT_SECRET); // Regular user
        adminToken = jwt.sign({ id: 2, role_id: 2 }, process.env.JWT_SECRET); // Admin user
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock for User.findById (used by verifyToken middleware)
        User.findById.mockResolvedValue({
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role_id: 1,
        });
    });

    describe('POST /api/checkout', () => {
        it('should create a new order', async () => {
            const mockCartId = 1;
            const mockShippingAddressId = 1;
            const mockBillingAddressId = 2;
            const mockCartItems = [
                { product_id: 1, quantity: 2, price: 10.00 },
                { product_id: 2, quantity: 1, price: 20.00 },
            ];
            const mockOrderId = 1;

            // Mock database queries in the correct order:
            db.query
                .mockResolvedValueOnce({ rows: [] })   // BEGIN
                .mockResolvedValueOnce({ rows: mockCartItems }) // SELECT cart items
                .mockResolvedValueOnce({ rows: [{ order_id: mockOrderId }] }) // INSERT order
                .mockResolvedValueOnce({ rows: [] })   // INSERT order item 1
                .mockResolvedValueOnce({ rows: [] })   // INSERT order item 2
                .mockResolvedValueOnce({ rows: [] })   // DELETE cart items
                .mockResolvedValueOnce({ rows: [] })   // DELETE cart
                .mockResolvedValueOnce({ rows: [] });  // COMMIT

            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    cart_id: mockCartId,
                    shipping_address_id: mockShippingAddressId,
                    billing_address_id: mockBillingAddressId,
                });

            expect(response.status).toEqual(201);
            expect(response.body).toEqual({ message: 'Order created successfully', orderId: mockOrderId });

            // Assert that db.query was called the correct number of times with expected queries
            expect(db.query).toHaveBeenCalledTimes(8);
            expect(db.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT ci.product_id, ci.quantity, p.price FROM Cart_Items ci JOIN Products p ON ci.product_id = p.product_id WHERE ci.cart_id = $1', [mockCartId]);
            expect(db.query).toHaveBeenNthCalledWith(3, 'INSERT INTO Orders (user_id, shipping_address_id, billing_address_id, total_amount) VALUES ($1, $2, $3, $4) RETURNING order_id', [1, mockShippingAddressId, mockBillingAddressId, 40.00]); // 2 * 10 + 1 * 20 = 40
            expect(db.query).toHaveBeenNthCalledWith(4, 'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [mockOrderId, 1, 2, 10.00]);
            expect(db.query).toHaveBeenNthCalledWith(5, 'INSERT INTO Order_Items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [mockOrderId, 2, 1, 20.00]);
            expect(db.query).toHaveBeenNthCalledWith(6, 'DELETE FROM Cart_Items WHERE cart_id = $1', [mockCartId]);
            expect(db.query).toHaveBeenNthCalledWith(7, 'DELETE FROM Cart WHERE cart_id = $1', [mockCartId]);
            expect(db.query).toHaveBeenNthCalledWith(8, 'COMMIT');
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(response.status).toEqual(400);
            expect(response.body).toEqual({
                message:
                    'Missing required fields: shipping_address_id, billing_address_id, and cart_id',
            });
        });

        it('should return 500 on server error', async () => {
            // Mock the first db.query call to reject with an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    cart_id: 1,
                    shipping_address_id: 1,
                    billing_address_id: 2,
                });

            expect(response.status).toEqual(500);
            expect(response.body).toEqual({ message: 'Failed to create order' });
        });
    });

    describe('GET /api/orders', () => {
        it('should fetch orders for the current user', async () => {
            const mockOrders = [
                { order_id: 1, user_id: 1, total_amount: 50.00, created_at: new Date().toISOString(), items: [] },
                { order_id: 2, user_id: 1, total_amount: 100.00, created_at: new Date().toISOString(), items: [] },
            ];
            const mockOrderItems = [
                { quantity: 1, price: 25.00, name: 'Product A', main_image_url: 'image_a.jpg' },
                { quantity: 2, price: 12.50, name: 'Product B', main_image_url: 'image_b.jpg' },
            ];

            // Mock database queries
            db.query
                .mockResolvedValueOnce({ rows: mockOrders })
                .mockResolvedValueOnce({ rows: mockOrderItems })
                .mockResolvedValueOnce({ rows: mockOrderItems });

            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toEqual(200);
            expect(response.body).toEqual({ orders: mockOrders });

            // Assert that db.query was called the correct number of times with expected queries
            expect(db.query).toHaveBeenCalledTimes(3);
            expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM Orders WHERE user_id = $1 ORDER BY created_at DESC', [1]);
            expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT oi.quantity, oi.price, p.name, p.main_image_url FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE oi.order_id = $1', [1]);
            expect(db.query).toHaveBeenNthCalledWith(3, 'SELECT oi.quantity, oi.price, p.name, p.main_image_url FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE oi.order_id = $1', [2]);
        });

        it('should return 500 on server error', async () => {
            // Mock database query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toEqual(500);
            expect(response.body).toEqual({ message: 'Failed to fetch orders' });
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should fetch details of a specific order', async () => {
            const mockOrderId = 1;
            const mockOrder = { order_id: mockOrderId, user_id: 1, total_amount: 50.00, created_at: new Date().toISOString(), items: [] };
            const mockOrderItems = [
                { quantity: 1, price: 25.00, name: 'Product A', main_image_url: 'image_a.jpg' },
                { quantity: 2, price: 12.50, name: 'Product B', main_image_url: 'image_b.jpg' },
            ];

            // Mock database queries
            db.query
                .mockResolvedValueOnce({ rows: [mockOrder] })
                .mockResolvedValueOnce({ rows: mockOrderItems });

            const response = await request(app)
                .get(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toEqual(200);
            expect(response.body).toEqual({ order: { ...mockOrder, items: mockOrderItems } });

            // Assert that db.query was called the correct number of times with expected queries
            expect(db.query).toHaveBeenCalledTimes(2);
            expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT * FROM Orders WHERE order_id = $1 AND user_id = $2', [mockOrderId, 1]);
            expect(db.query).toHaveBeenNthCalledWith(2, 'SELECT oi.quantity, oi.price, p.name, p.main_image_url FROM Order_Items oi JOIN Products p ON oi.product_id = p.product_id WHERE oi.order_id = $1', [mockOrderId]);
        });

        it('should return 404 if order not found', async () => {
            const mockOrderId = 999;
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .get(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toEqual(404);
            expect(response.body).toEqual({ message: 'Order not found' });
        });

        it('should return 500 on server error', async () => {
            const mockOrderId = 1;
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toEqual(500);
            expect(response.body).toEqual({ message: 'Failed to fetch order details' });
        });
    });

    describe('PATCH /api/orders/:id', () => {
        it('should update order status (Admin only)', async () => {
            const mockOrderId = 1;
            const mockUpdatedOrder = { order_id: mockOrderId, user_id: 3, total_amount: 75.00, order_status: 'Shipped', created_at: new Date().toISOString() };

            // Mock User.findById for adminToken
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role_id: 2, // Admin
            });

            // Mock database query
            db.query.mockResolvedValueOnce({ rows: [mockUpdatedOrder] });

            const response = await request(app)
                .patch(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ order_status: 'Shipped' });

            expect(response.status).toEqual(200);
            expect(response.body).toEqual({ message: 'Order status updated', order: mockUpdatedOrder });

            // Assert that db.query was called with the expected query
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith('UPDATE Orders SET order_status = $1 WHERE order_id = $2 RETURNING *', ['Shipped', mockOrderId]);
        });

        it('should return 403 if user is not an admin', async () => {
            const mockOrderId = 1;

            const response = await request(app)
                .patch(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${userToken}`) // Regular user token
                .send({ order_status: 'Shipped' });

            expect(response.status).toEqual(403);
            expect(response.body).toEqual({ message: 'Forbidden: Admin only' });
        });

        it('should return 400 if order status is missing', async () => {
            const mockOrderId = 1;
            // Mock User.findById for adminToken
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role_id: 2, // Admin
            });

            const response = await request(app)
                .patch(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({}); // Missing order_status

            expect(response.status).toEqual(400);
            expect(response.body).toEqual({ message: 'Order status is required' });
        });

        it('should return 404 if order not found', async () => {
            const mockOrderId = 999;
            // Mock User.findById for adminToken
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role_id: 2, // Admin
            });

            // Mock database query to return no results
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .patch(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ order_status: 'Shipped' });

            expect(response.status).toEqual(404);
            expect(response.body).toEqual({ message: 'Order not found' });
        });

        it('should return 500 on server error', async () => {
            const mockOrderId = 1;
            // Mock User.findById for adminToken
            User.findById.mockResolvedValueOnce({
                user_id: 2,
                username: 'adminuser',
                email: 'admin@example.com',
                role_id: 2, // Admin
            });

            // Mock database query to throw an error
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .patch(`/api/orders/${mockOrderId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ order_status: 'Shipped' });

            expect(response.status).toEqual(500);
            expect(response.body).toEqual({ message: 'Failed to update order status' });
        });
    });
});

describe('Address Management', () => {
    let userToken;

    beforeAll(() => {
        // Create a token for a regular user (role_id: 1)
        userToken = jwt.sign({ id: 1, role_id: 1 }, process.env.JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock User.findById for verifyToken middleware in each test
        User.findById.mockResolvedValue({
            user_id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role_id: 1,
        });
    });

    // GET /addresses
    describe('GET /addresses', () => {
        it('should return all addresses for the authenticated user', async () => {
            const mockAddresses = [
                { address_id: 1, user_id: 1, street: '123 Main St', city: 'Anytown', state: 'CA', zip_code: '90210', country: 'USA', is_billing: true, is_shipping: false },
                { address_id: 2, user_id: 1, street: '456 Oak Ave', city: 'Springfield', state: 'IL', zip_code: '62704', country: 'USA', is_billing: false, is_shipping: true },
            ];
            db.query.mockResolvedValueOnce({ rows: mockAddresses });

            const response = await request(app)
                .get('/addresses')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAddresses);
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM Addresses WHERE user_id = $1', [1]);
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/addresses');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 500 on server error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/addresses')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to fetch addresses' });
        });
    });

    // POST /addresses
    describe('POST /addresses', () => {
        it('should add a new address for the authenticated user', async () => {
            const newAddress = { street: '789 Pine Ln', city: 'New York', state: 'NY', zip_code: '10001', country: 'USA', is_billing: true, is_shipping: true };
            const mockAddedAddress = { address_id: 3, user_id: 1, ...newAddress };
            db.query.mockResolvedValueOnce({ rows: [mockAddedAddress] });

            const response = await request(app)
                .post('/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newAddress);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Address added successfully', address: mockAddedAddress });
            expect(db.query).toHaveBeenCalledWith(
                'INSERT INTO Addresses (user_id, street, city, state, zip_code, country, is_billing, is_shipping) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [1, newAddress.street, newAddress.city, newAddress.state, newAddress.zip_code, newAddress.country, newAddress.is_billing, newAddress.is_shipping]
            );
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ street: '789 Pine Ln' }); // Missing other required fields

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Street, city, state, zip code, and country are required' });
        });

        it('should return 400 if is_billing or is_shipping are not boolean', async () => {
            const response = await request(app)
                .post('/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    street: '789 Pine Ln',
                    city: 'New York',
                    state: 'NY',
                    zip_code: '10001',
                    country: 'USA',
                    is_billing: 'true', // Invalid: should be boolean
                    is_shipping: true,
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'is_billing and is_shipping must be boolean values' });
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/addresses')
                .send({ street: '789 Pine Ln', city: 'New York', state: 'NY', zip_code: '10001', country: 'USA', is_billing: false, is_shipping: true });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 500 on server error', async () => {
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ street: '789 Pine Ln', city: 'New York', state: 'NY', zip_code: '10001', country: 'USA', is_billing: true, is_shipping: false });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to add address' });
        });
    });

    // PATCH /addresses/:id
    describe('PATCH /addresses/:id', () => {
        it('should update an existing address for the authenticated user', async () => {
            const addressId = 1;
            const updatedAddress = { city: 'Los Angeles', state: 'CA', is_billing: false };
            const mockUpdatedAddress = { address_id: addressId, user_id: 1, street: '123 Main St', city: 'Los Angeles', state: 'CA', zip_code: '90210', country: 'USA', is_billing: false, is_shipping: true };
            db.query.mockResolvedValueOnce({ rows: [mockUpdatedAddress] });

            const response = await request(app)
                .patch(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updatedAddress);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Address updated successfully', address: mockUpdatedAddress });
            expect(db.query).toHaveBeenCalledWith(
                `UPDATE Addresses SET city = $1, state = $2, is_billing = $3 WHERE address_id = $4 AND user_id = $5 RETURNING *`,
                [updatedAddress.city, updatedAddress.state, updatedAddress.is_billing, addressId, 1]
            );
        });

        it('should return 400 if no valid fields are provided for update', async () => {
            const addressId = 1;
            const response = await request(app)
                .patch(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({}); // No fields to update

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'No valid fields provided for update' });
        });

        it('should return 404 if address is not found or unauthorized', async () => {
            const addressId = 999; // Non-existent address ID
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .patch(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ city: 'Updated City' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Address not found or unauthorized' });
        });

        it('should return 401 if no token is provided', async () => {
            const addressId = 1;
            const response = await request(app)
                .patch(`/addresses/${addressId}`)
                .send({ city: 'Updated City' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 500 on server error', async () => {
            const addressId = 1;
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .patch(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ city: 'Updated City' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update address' });
        });
    });

    // DELETE /addresses/:id
    describe('DELETE /addresses/:id', () => {
        it('should delete an existing address for the authenticated user', async () => {
            const addressId = 1;
            db.query.mockResolvedValueOnce({ rows: [{ address_id: 1 }] }); // Indicate successful deletion

            const response = await request(app)
                .delete(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Address deleted successfully' });
            expect(db.query).toHaveBeenCalledWith('DELETE FROM Addresses WHERE address_id = $1 AND user_id = $2 RETURNING *', [addressId, 1]);
        });

        it('should return 404 if address is not found or unauthorized', async () => {
            const addressId = 999; // Non-existent address ID
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .delete(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Address not found or unauthorized' });
        });

        it('should return 401 if no token is provided', async () => {
            const addressId = 1;
            const response = await request(app)
                .delete(`/addresses/${addressId}`);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Access denied. No token provided.' });
        });

        it('should return 500 on server error', async () => {
            const addressId = 1;
            db.query.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete(`/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete address' });
        });
    });
});