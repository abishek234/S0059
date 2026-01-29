import { createContext } from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
