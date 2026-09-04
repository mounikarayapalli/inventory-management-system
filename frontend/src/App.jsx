import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import AppRoutes from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <AppRoutes />
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;
