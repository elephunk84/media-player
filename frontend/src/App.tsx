/**
 * App Component
 *
 * Root component that sets up routing for the application.
 */

import AppRoutes from './routes';
import './App.css';

/**
 * App Component
 *
 * Main application component that renders the route configuration.
 * Uses React Router for navigation and route protection.
 */
function App() {
  return (
    <div className="app">
      <AppRoutes />
    </div>
  );
}

export default App;
