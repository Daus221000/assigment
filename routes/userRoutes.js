// routes/userRoutes.js

/**
 * @swagger
 * /register/user:
 *   post:
 *     summary: Register a new user.
 *     description: Register a new user account.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User account created successfully.
 *       400:
 *         description: Bad request. Invalid input data.
 *       500:
 *         description: Internal server error.
 */

// ... (Your existing code for /register/user route)
