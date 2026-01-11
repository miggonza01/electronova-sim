# ElectroNova Simulation - Development Guidelines

This file contains development guidelines and commands for agentic coding agents working on the ElectroNova simulation platform.

## Project Overview

ElectroNova is a business simulation game platform with multiplayer capabilities built as a monorepo:
- **Frontend**: React 19.2.0 with Vite 7.2.4, Tailwind CSS 3.4.1
- **Backend**: Node.js with Express 5.2.1, MongoDB with Mongoose 9.0.2
- **Real-time**: Socket.IO 4.8.2 for multiplayer features

## Development Commands

### Client (React Frontend)
```bash
cd client
npm run dev              # Start development server (Vite)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build
npm run dev:v2           # Start v2 mode on port 5174
```

### Server (Node.js Backend)
```bash
cd server
npm start                # Start production server
npm run dev              # Start development with nodemon
npm run dev:v2           # Start v2 with specific environment
npm run seed:v2          # Seed database with v2 data
```

### Testing
```bash
# Manual testing - run individual test files
node server/test-auth.js
node server/test-market-logic.js
node server/test-round-processing.js
node server/test-socket-listener.js
```

## Code Style Guidelines

### Import Patterns
```javascript
// Client side - ES modules
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import api from '../services/api';

// Server side - CommonJS
const express = require('express');
const User = require('../models/User');
```

### Naming Conventions
- **Files**: camelCase for components (`DecisionModal.jsx`), PascalCase for pages (`DashboardPage.jsx`)
- **Variables**: camelCase (`user`, `loading`, `gameCode`)
- **Functions**: camelCase (`login`, `logout`, `generateToken`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `JWT_SECRET`)
- **Models**: PascalCase (`User`, `Company`, `Game`)

### Component Structure
- Use functional components with hooks
- Follow React 19 patterns (no more forwardRef needed for most cases)
- Use Tailwind CSS for styling with corporate color palette
- Implement proper error boundaries and loading states

### Error Handling
```javascript
// Client side - Try/catch with user feedback
try {
  const response = await api.post('/auth/login', { email, password });
  // Handle success
} catch (error) {
  return { 
    success: false, 
    error: error.response?.data?.error || 'Error de conexión' 
  };
}

// Server side - Try/catch with status codes
try {
  // Business logic
} catch (error) {
  console.error('Error de Auth:', error.message);
  res.status(401).json({ message: 'No autorizado, token fallido' });
}
```

## Project Structure

```
electronova-sim/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React contexts (AuthContext)
│   │   ├── pages/          # Route components
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
├── server/                 # Node.js backend
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routes
│       ├── middlewares/    # Custom middleware
│       ├── services/       # Business logic
│       └── sockets/        # Socket.IO handlers
```

## Development Workflow

1. **Environment Setup**: Use `.env.development.v2` for server, `.env.v2` for client
2. **Database**: MongoDB with Mongoose - use `npm run seed:v2` to populate test data
3. **Authentication**: JWT-based with bcryptjs password hashing
4. **Real-time Features**: Socket.IO for multiplayer game mechanics
5. **Styling**: Tailwind CSS with corporate navy (#0F172A) and blue (#3B82F6) theme

## Linting and Code Quality

- ESLint configuration in `client/eslint.config.js` with React hooks and refresh rules
- Custom rule for unused variables with uppercase pattern
- Always run `npm run lint` before committing changes
- Follow existing code patterns and conventions

## Security Best Practices

- JWT tokens with proper expiration
- Password hashing with bcryptjs
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Express-mongo-sanitize for MongoDB injection protection

## Testing Guidelines

- Currently uses manual test files in server root
- When adding new features, create corresponding test files
- Test authentication flows, market logic, and socket connections
- Always test database operations with proper cleanup

## Environment Variables

Key environment variables to be aware of:
- `MONGODB_URI_V2` / `MONGODB_URI` - Database connection
- `JWT_SECRET_V2` / `JWT_SECRET` - JWT signing secret
- `VITE_API_URL` - Client API base URL
- `PORT` - Server port (default: 5000)

## Common Patterns

### API Service Pattern (Client)
```javascript
// services/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle common errors
    return Promise.reject(error);
  }
);
```

### Controller Pattern (Server)
```javascript
// controllers/authController.js
const login = async (req, res) => {
  try {
    // Business logic
    const user = await User.findOne({ email });
    // Validation and response
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
```

### Socket.IO Pattern
```javascript
// sockets/gameSocket.js
io.on('connection', (socket) => {
  socket.on('join-game', (gameCode) => {
    socket.join(gameCode);
    // Handle game events
  });
});
```

## Important Notes

- This is a Spanish-language application (error messages, UI text in Spanish)
- Corporate color scheme must be maintained (navy, blue, white, gray)
- Game logic is complex - always test market calculations and round processing
- Socket.IO connections must be properly managed and cleaned up
- Database operations should use transactions for critical game state changes