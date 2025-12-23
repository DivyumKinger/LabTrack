import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend_server } from '../../config';
import './forgot.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const ForgotPassword_API = `${backend_server}/api/v1/forgotpassword`;

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(ForgotPassword_API, { email });
      // We show a generic success message regardless of whether the email exists
      // to prevent user enumeration attacks.
      setMessageSent(true);
    } catch (error) {
      // Even if there's a server error, we can still show the generic message
      // to avoid leaking information. The error is logged for debugging.
      console.error('Forgot Password Error:', error);
      setMessageSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Navigate back one page
  };

  return (
    <div className='container'>
      <h1 className='h2 text-center my-3'>Forgot Your Password?</h1>

      <div className='d-flex flex-column align-items-center '>
        {messageSent ? (
          <div className='w-75 text-center'>
            <p className='lead'>
              If an account with the provided email exists, a password reset link has been sent. Please check your inbox.
            </p>
            <button className='btn btn-primary mt-3' onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='w-50'>
            <p className='text-center text-muted'>
              Enter your email address and we will send you a link to reset your password.
            </p>
            <div className='form-group'>
              <label htmlFor='email-input'>Email:</label>
              <input
                id='email-input'
                type='email'
                className='form-control'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                name='email'
                autoComplete='email'
              />
            </div>

            <div className='text-center recover-password-div'>
              <button type='submit' className='btn btn-success my-3 btn-block' disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}

        {!messageSent && (
          <button className='btn btn-secondary mt-3' onClick={handleGoBack}>
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
