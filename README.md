# Dress Code - Fashion Collection

A Node.js + Express web application for displaying a collection of dress products.

## Project Structure

```
dress-code/
├── server/
│   ├── index.js              # Main Express server
│   ├── routes/
│   │   └── products.js       # Products API routes
│   └── modules/
│       └── persist_module.js # Data persistence module
├── public/
│   └── index.html           # Frontend HTML page
├── data/
│   ├── products.json        # Sample dress products
│   └── users/
│       └── admin.json       # Admin user data
├── package.json
├── .gitignore
└── README.md
```

## Features

- Express.js server with JSON parsing and cookie support
- Static file serving for the frontend
- RESTful API for products (`GET /products`)
- Health check endpoint (`GET /health`)
- Modern, responsive frontend with product cards
- Sample dress products with detailed information

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

   or

   ```bash
   node server/index.js
   ```

3. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `GET /` - Serves the main HTML page
- `GET /products` - Returns all products as JSON
- `GET /health` - Health check endpoint

## Sample Data

The application includes sample dress products:

- Elegant Evening Gown ($299.99)
- Summer Floral Dress ($89.99)

Each product includes details like size, color, material, and availability.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Data**: JSON files for persistence
