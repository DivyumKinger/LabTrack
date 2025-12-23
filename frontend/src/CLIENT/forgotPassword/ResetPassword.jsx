import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backend_server } from '../../config';
import './forgot.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const ResetPassword_API = `${backend_server}/api/v1/forgotpassword/${resetToken}`;

  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handlePasswordFormSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMatch(false);
      setTimeout(() => setPasswordMatch(true), 3000);
      return;
    }

    // Validate alphanumeric password with a must Special character
    const alphanumericRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
    if (!alphanumericRegex.test(password)) {
      return toast('Password must be alphanumeric and contain at least one special character', {
        icon: 'ℹ️',
      });
    }

    setLoading(true);
    try {
      const response = await axios.patch(ResetPassword_API, {
        newPassword: password,
      });

      toast.success(response.data.message);
      navigate('/login', { replace: true });

    } catch (error) {
      console.log(error.response);
      toast.error(error.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
      <h1 className='h2 text-center my-3'>Reset Your Password</h1>

      <div className='d-flex flex-column align-items-center '>
        <form onSubmit={handlePasswordFormSubmit} className='w-50'>
          <div className='form-group'>
            <label htmlFor='new-password'>New Password:</label>
            <input
              id='new-password'
              type='password'
              minLength={5}
              className='form-control'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete='new-password'
            />
          </div>
          <div className='form-group'>
            <label htmlFor='confirm-password'>Confirm Password:</label>
            <input
              id='confirm-password'
              type='password'
              minLength={5}
              className='form-control'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete='new-password'
            />
          </div>
          {!passwordMatch && (
            <div className='alert alert-danger mt-2' role='alert'>
              Passwords do not match.
            </div>
          )}
          <div className='text-center'>
            <button type='submit' className='btn btn-primary my-3' disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
