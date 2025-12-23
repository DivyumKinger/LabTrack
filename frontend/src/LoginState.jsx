import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const LoginState = ({ children }) => {
  const [userLogState, setUserLogState] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userId, setUserId] = useState(null)
  const [requestUpdate, setRequestUpdate] = useState(0); // State to trigger updates

  useEffect(() => {
    const storedUserLogState = localStorage.getItem('userLogState')
    const storedUserType = localStorage.getItem('userType')
    const storedUserId = localStorage.getItem('userId')

    if (storedUserLogState && storedUserType && storedUserId) {
      setUserLogState(storedUserLogState)
      setUserType(storedUserType)
      setUserId(storedUserId)
    }
  }, [])

  const login = (user_email, user_role, user_id) => {
    // User Login State ( Storing EMAIL )
    setUserLogState(user_email)
    localStorage.setItem('userLogState', user_email)

    // Logged in user ROLE/TYPE (Storing userType)
    setUserType(user_role)
    localStorage.setItem('userType', user_role)

    // Storing user ID
    setUserId(user_id)
    localStorage.setItem('userId', user_id)
  }
  const logout = () => {
    setUserLogState(null)
    setUserType(null)
    setUserId(null)
    localStorage.removeItem('userLogState')
    localStorage.removeItem('userType')
    localStorage.removeItem('userId')
  }

  // Function to trigger a re-fetch in the client dashboard
  const triggerRequestUpdate = () => {
    setRequestUpdate(prev => prev + 1);
  }

  return (
    <AuthContext.Provider value={{ userLogState, userId, login, logout, requestUpdate, triggerRequestUpdate }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useLoginState = () => {
  return useContext(AuthContext)
}
