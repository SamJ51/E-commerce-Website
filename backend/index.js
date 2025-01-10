const express = require('express');
const registerRoute = require('./routes/authorisation/register');
const loginRoute = require('./routes/authorisation/login');
const profileRoute = require('./routes/user/profile')

const app = express();
app.use(express.json());
app.use('/auth', registerRoute);
app.use('/auth', loginRoute);
app.use('/users', profileRoute);

const PORT = process.env.PORT || 5000;

// Only listen if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;