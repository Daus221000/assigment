const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'API documentation for your application',
    },
  },
  apis: ['./routes/*.js'], // Path to the API routes in your application
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
