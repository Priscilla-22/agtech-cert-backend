const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgTech Certification System API',
      version: '1.0.0',
      description: 'API for managing organic farm certifications, farmers, inspections, and certificates. All endpoints except authentication require a Firebase JWT token.',
      contact: {
        name: 'API Support',
        email: 'support@agtechcert.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3002',
        description: 'Alternative development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase JWT token. Get this from Firebase Authentication after login. Format: Bearer <token>'
        }
      },
      schemas: {
        Farmer: {
          type: 'object',
          required: ['name', 'email', 'phone', 'idNumber', 'county'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique farmer identifier'
            },
            name: {
              type: 'string',
              description: 'Full name of the farmer',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john.doe@example.com'
            },
            phone: {
              type: 'string',
              description: 'Primary phone number',
              example: '+254712345678'
            },
            idNumber: {
              type: 'string',
              description: 'National ID number',
              example: '12345678'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
              example: '1985-01-01'
            },
            county: {
              type: 'string',
              description: 'County location',
              example: 'Kiambu'
            },
            subCounty: {
              type: 'string',
              description: 'Sub-county location',
              example: 'Thika'
            },
            ward: {
              type: 'string',
              description: 'Ward location',
              example: 'Thika Town'
            },
            village: {
              type: 'string',
              description: 'Village location',
              example: 'Kamenu'
            },
            address: {
              type: 'string',
              description: 'Physical address',
              example: 'P.O Box 123, Thika'
            },
            latitude: {
              type: 'number',
              description: 'GPS latitude coordinate',
              example: -1.033226
            },
            longitude: {
              type: 'number',
              description: 'GPS longitude coordinate',
              example: 37.069256
            },
            farmingExperience: {
              type: 'string',
              description: 'Years of farming experience',
              enum: ['0-2', '3-5', '6-10', '11-20', '20+'],
              example: '6-10'
            },
            educationLevel: {
              type: 'string',
              description: 'Highest education level',
              enum: ['primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate'],
              example: 'secondary'
            },
            primaryCrops: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of primary crops grown',
              example: ['Coffee', 'Maize', 'Beans']
            },
            farmingType: {
              type: 'string',
              description: 'Type of farming practice',
              enum: ['subsistence', 'commercial', 'mixed'],
              example: 'mixed'
            },
            totalLandSize: {
              type: 'number',
              description: 'Total land size in hectares',
              example: 5.5
            },
            cultivatedSize: {
              type: 'number',
              description: 'Cultivated land size in hectares',
              example: 4.0
            },
            landTenure: {
              type: 'string',
              description: 'Land ownership type',
              enum: ['owned', 'leased', 'family', 'communal'],
              example: 'owned'
            },
            soilType: {
              type: 'string',
              description: 'Predominant soil type',
              enum: ['clay', 'sandy', 'loam', 'volcanic', 'black cotton'],
              example: 'volcanic'
            },
            waterSources: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Available water sources',
              example: ['River', 'Borehole']
            },
            irrigationSystem: {
              type: 'string',
              description: 'Primary irrigation method',
              enum: ['none', 'drip', 'sprinkler', 'furrow', 'flood'],
              example: 'drip'
            },
            previousCertification: {
              type: 'string',
              description: 'Previous organic certification status',
              enum: ['yes', 'no', 'transitioning'],
              example: 'no'
            },
            organicExperience: {
              type: 'string',
              description: 'Years of organic farming experience',
              enum: ['0-1', '2-3', '4-5', '6-10', '10+'],
              example: '2-3'
            },
            status: {
              type: 'string',
              description: 'Farmer status',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active'
            },
            certificationStatus: {
              type: 'string',
              description: 'Current certification status',
              enum: ['pending', 'certified', 'expired', 'rejected'],
              example: 'pending'
            },
            registrationDate: {
              type: 'string',
              format: 'date',
              description: 'Registration date',
              example: '2023-01-01'
            }
          }
        },
        Farm: {
          type: 'object',
          required: ['farmerId', 'farmName', 'location'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique farm identifier'
            },
            farmerId: {
              type: 'string',
              description: 'ID of the farmer who owns this farm'
            },
            farmName: {
              type: 'string',
              description: 'Name of the farm',
              example: 'Green Valley Organic Farm'
            },
            location: {
              type: 'string',
              description: 'Farm location/address',
              example: 'Kiambu County, Kenya'
            },
            totalArea: {
              type: 'number',
              description: 'Total farm area in hectares',
              example: 15.5
            },
            organicArea: {
              type: 'number',
              description: 'Organic farming area in hectares',
              example: 12.0
            },
            cropTypes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Types of crops grown',
              example: ['Coffee', 'Maize', 'Beans']
            },
            organicSince: {
              type: 'string',
              format: 'date',
              description: 'Date when organic farming started'
            },
            certificationStatus: {
              type: 'string',
              enum: ['pending', 'certified', 'expired', 'rejected'],
              description: 'Current certification status'
            }
          }
        },
        Field: {
          type: 'object',
          required: ['farmId', 'fieldName', 'cropType'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique field identifier'
            },
            farmId: {
              type: 'string',
              description: 'ID of the farm this field belongs to'
            },
            fieldName: {
              type: 'string',
              description: 'Name/identifier for the field',
              example: 'Field A - Coffee Block'
            },
            cropType: {
              type: 'string',
              description: 'Primary crop grown in this field',
              example: 'Coffee'
            },
            area: {
              type: 'number',
              description: 'Field area in hectares',
              example: 2.5
            },
            soilType: {
              type: 'string',
              description: 'Soil type in this field',
              example: 'Volcanic soil'
            },
            plantingDate: {
              type: 'string',
              format: 'date',
              description: 'Date when crop was planted'
            },
            organicStatus: {
              type: 'boolean',
              description: 'Whether this field follows organic practices'
            }
          }
        },
        Certificate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique certificate identifier'
            },
            certificateNumber: {
              type: 'string',
              description: 'Unique certificate number',
              example: 'ORG-2023-001'
            },
            farmId: {
              type: 'string',
              description: 'ID of the certified farm'
            },
            issueDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate issue date'
            },
            expiryDate: {
              type: 'string',
              format: 'date',
              description: 'Certificate expiry date'
            },
            status: {
              type: 'string',
              enum: ['active', 'expired', 'revoked', 'suspended'],
              description: 'Certificate status'
            },
            certificationBody: {
              type: 'string',
              description: 'Name of the certification body'
            },
            scope: {
              type: 'string',
              description: 'Certification scope'
            },
            pdfUrl: {
              type: 'string',
              description: 'URL to download the PDF certificate'
            }
          }
        },
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            uid: {
              type: 'string',
              description: 'Firebase UID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            name: {
              type: 'string',
              description: 'Full name'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            address: {
              type: 'string',
              description: 'Physical address'
            },
            role: {
              type: 'string',
              enum: ['agronomist', 'inspector', 'admin'],
              description: 'User role'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Account status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of validation errors'
            }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Farmers',
        description: 'Farmer registration and management'
      },
      {
        name: 'Farms',
        description: 'Farm management operations'
      },
      {
        name: 'Fields',
        description: 'Farm field management'
      },
      {
        name: 'Inspections',
        description: 'Farm inspection scheduling and management'
      },
      {
        name: 'Certificates',
        description: 'Certification document management'
      },
      {
        name: 'Health',
        description: 'System health checks'
      }
    ]
  },
  apis: [
    './routes/*.js', // Path to the API files
    './server.js'    // Include server.js for health endpoint
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;