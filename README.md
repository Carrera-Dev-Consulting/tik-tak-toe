# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features
- 🎲 Play Tic Tac Toe against another player
- 🕹️ Server-side rendering for fast page loads
- ⚡️ Hot Module Replacement (HMR) for fast development cycles
- 📦 Asset bundling and optimization for fast loading times
- 🔄 Data loading and mutations for a seamless user experience
- 🔒 TypeScript by default for strong typing and code maintainability
- 🎨 TailwindCSS for easy styling and customization

## Project Overview

This project is a full-stack React application built using React Router. It includes the following components:

- **Frontend**: The frontend is built using React and TypeScript. It includes the following features:
  - Server-side rendering
  - Hot Module Replacement (HMR)
  - Asset bundling and optimization
  - Data loading and mutations
  - TypeScript by default
  - TailwindCSS for styling

- **Backend**: The backend is built using Node.js and Express. It includes the following features:
  - Server-side rendering
  - Data loading and mutations
  - MongoDB integration
  - Redis integration
  - GraphQL API

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)
- MongoDB (version 4 or higher)
- Redis (version 6 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/carrera-dev-consulting/tik-tak-toe.git
   ```

2. Install the dependencies:

```bash
   # Frontend
   npm ci
   # Backend
   cd backend
   pip install -r requirements.txt
```

3. Set up the environment variables:

   - Create a `.env` file in the root directory of the project and add the following variables:
```bash 
    VITE_GQL_API_URL=<url-to-localhost-deployment>
    VITE_WS_API_URL=<url-to-localhost-deployment>
    MONGO_URL=<your_mongo_url
    REDIS_URL=<your_redis_url>
    SESSION_SECRET=<your_session_secret>
    CORS_ORIGINS=<your_cors_origins as comma seperated list>
    MAX_SESSION_AGE=<your_max_session_age>
```

4. Start the development server:

```bash
    # Frontend
    npm run dev
    # Backend 
    cd backend
    make serve-api-pretty
```

   Your application will be available at `http://localhost:5173`.
   Your backend application will be available at `http://localhost:8000`

## Building for Production

To build the application for production, run the following command:

```bash
# Frontend
npm run build0
```

This will create an optimized production build in the `build` directory.

## Deployment

### Docker Deployment

To deploy the application using Docker, follow these steps:

1. Build the Docker image:

   ```bash
   docker build -t your-image-name .
   ```

2. Run the Docker container:

   ```bash
   docker run -p 80:5173 -d your-image-name
   ```

   This will start the application on port 80.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

I hope this helps! Let me know if you have any further questions.