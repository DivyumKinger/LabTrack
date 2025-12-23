import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import io from 'socket.io-client'
import { toast } from 'react-hot-toast'
import { backend_server } from '../config'

import Navbar from './navbar/Navbar'
import Login from './login/Login'
import Signup from './signup/Signup'
import Home from './home/Home'
import FeaturedBooks from './featuredBooks/FeaturedBooks'
import Books from './books/Books'
import Footer from './footer/Footer'
import AboutUsPage from './about/AboutUsPage'
import PagenotFound from './404-pageNotFound/PagenotFound'
import { LoginState, useLoginState } from '../LoginState'
import ClientProfile from './clientProfile/ClientProfile'
import ViewBook from './viewBooks/ViewBook'
import ForgotPassword from './forgotPassword/ForgotPassword'
import ResetPassword from './forgotPassword/ResetPassword' // Import the new component
// OTP removed

// Establish WebSocket connection against same-origin backend
const socket = io(backend_server, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

const SocketClient = () => {
  const { userId, triggerRequestUpdate } = useLoginState();

  useEffect(() => {
    // Handler for public notifications
    const handleNotification = (data) => {
      console.log('Notification received:', data.message);
      toast.success(data.message);
    };

    // Handler for private request updates
    const handleRequestUpdate = (data) => {
      console.log('Private update received:', data.message);
      toast.success(data.message, {
        duration: 6000, // Keep toast on screen for 6 seconds
        icon: '👍',
      });
      // Trigger the global state update
      triggerRequestUpdate();
    };

    // Set up listeners for events that can happen at any time
    socket.on('notification', handleNotification);
    socket.on('request-update', handleRequestUpdate);

    // --- Robust Registration Logic ---
    const registerUser = () => {
      if (userId) {
        socket.emit('register', userId);
        console.log(`Socket registration attempted for user: ${userId}`);
      }
    };

    if (socket.connected) {
      registerUser();
    } else {
      // If not connected, wait for the connect event before registering.
      // Use .once() to avoid attaching multiple listeners if the effect re-runs.
      socket.once('connect', registerUser);
    }
    // --- End of Robust Registration Logic ---

    // Clean up the listeners when the component unmounts or userId changes
    return () => {
      socket.off('notification', handleNotification);
      socket.off('request-update', handleRequestUpdate);
      socket.off('connect', registerUser); // Important: remove the specific listener function
    };
  }, [userId]); // Rerun effect if userId changes

  return (
    <React.Fragment>
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/forgotpassword' element={<ForgotPassword />} />
          <Route path='/reset-password/:resetToken' element={<ResetPassword />} /> {/* Add the new route */}
          <Route path='/menu' element={<FeaturedBooks />} />
          <Route path='/books' element={<Books />} />
          <Route path='/books/:id' element={<ViewBook />} />
          <Route path='/profile' element={<ClientProfile />} />
          <Route path='/about' element={<AboutUsPage />} />
          {/* OTP route removed */}

          <Route path='*' element={<PagenotFound></PagenotFound>} />
        </Routes>
        <Footer />
      </Router>
    </React.Fragment>
  );
};


const ClientApp = () => {
  return (
    <LoginState>
      <SocketClient />
    </LoginState>
  )
}

export default ClientApp
