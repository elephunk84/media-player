/**
 * App Component
 *
 * Root component that sets up routing and authentication context for the application.
 */

import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import './App.css';

/**
 * App Component
 *
 * Main application component that renders the route configuration.
 * Wraps the application with AuthProvider for global authentication state.
 * Uses React Router for navigation and route protection.
 */
function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;
