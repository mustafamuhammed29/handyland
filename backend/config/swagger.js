const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HandyLand API',
            version: '1.0.0',
            description: 'API documentation for the HandyLand e-commerce platform',
            contact: {
                name: 'HandyLand Support',
            },
        },
        servers: [
            {
                url: process.env.VITE_API_URL || 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './models/*.js'], // Path to the API docs
};

const specs = swaggerJsDoc(options);

module.exports = specs;
