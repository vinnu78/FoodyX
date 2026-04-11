import React, { useState } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      setErr("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/send-otp`, { email }, { withCredentials: true });
      console.log(result.data);
      setErr("");
      setStep(2);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      setErr("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
      console.log(result.data);
      setErr("");
      setStep(3);
    } catch (error) {
      setErr(error?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErr("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true });
      console.log(result.data);
      setErr("");
      navigate("/signin");
    } catch (error) {
      setErr(error?.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
        <div className='flex items-center gap-4 mb-4'>
          <IoIosArrowRoundBack
            size={30}
            className='text-[#ff4d2d] cursor-pointer'
            onClick={() => navigate("/signin")}
          />
          <h1 className='text-2xl font-bold text-center text-[#ff4d2d]'>Forgot Password</h1>
        </div>

        {step === 1 && (
          <div>
            <div className='mb-6'>
              <label>Email</label>
              <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <button onClick={handleSendOtp} disabled={loading} className="w-full py-2 bg-[#ff4d2d] text-white rounded">
              {loading ? <ClipLoader size={20} color="white" /> : "Send OTP"}
            </button>
            {err && <p className='text-red-500 text-center my-2'>*{err}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className='mb-6'>
              <label>OTP</label>
              <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <button onClick={handleVerifyOtp} disabled={loading} className="w-full py-2 bg-[#ff4d2d] text-white rounded">
              {loading ? <ClipLoader size={20} color="white" /> : "Verify"}
            </button>
            {err && <p className='text-red-500 text-center my-2'>*{err}</p>}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className='mb-6'>
              <label>New Password</label>
              <input type="password" placeholder="Enter New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className='mb-6'>
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <button onClick={handleResetPassword} disabled={loading} className="w-full py-2 bg-[#ff4d2d] text-white rounded">
              {loading ? <ClipLoader size={20} color="white" /> : "Reset Password"}
            </button>
            {err && <p className='text-red-500 text-center my-2'>*{err}</p>}
          </div>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;