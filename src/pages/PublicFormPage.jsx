import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FileUp, Send, AlertCircle, Key, ShieldCheck, Mail, Phone, ArrowRight, Edit2 } from 'lucide-react';
import api, { apiErrorMessage } from '../api/apiClient';
import { setAuthData } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const labelClass =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm';
const selectClass = `${inputClass} appearance-none`;

function FormField({ label, required, hint, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const PublicFormPage = () => {
  const { customRoute } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState({});
  
  // Steps: 'form', 'verify', 'done'
  const [step, setStep] = useState('form');
  const [customerContact, setCustomerContact] = useState({ name: '', email: '', phone: '' });
  
  // OTP flow state
  const [otpType, setOtpType] = useState('email'); // 'email' | 'phone'
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Contact existence and inline edit states
  const [existingContacts, setExistingContacts] = useState({ email: false, phone: false });
  const [checkingExistence, setCheckingExistence] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  useEffect(() => {
    fetchFormConfig();
  }, [customRoute]);

  useEffect(() => {
    if (step === 'verify') {
      checkContactsExistence();
    }
  }, [step]);

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setVerifyingOtp(true);
    try {
      const res = await api.post('/customer/google-auth', {
        idToken,
        customRoute,
        submittedData,
      });

      if (res.data?.success && res.data?.data) {
        const { token, user } = res.data.data;
        dispatch(setAuthData({ token, user }));
        toast.success('Account verified and request submitted successfully via Google!');
        setStep('done');
        
        // Redirect to customer dashboard after 3 seconds
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 3000);
      } else {
        toast.error(res.data?.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Google verification failed'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    if (step !== 'verify' || otpType !== 'google') return;

    const initializeGoogleSignIn = () => {
      /* global google */
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId || String(googleClientId).includes('your-google-client-id')) {
        console.warn(
          '[Google Sign-In] VITE_GOOGLE_CLIENT_ID is missing or still a placeholder.'
        );
        return;
      }
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        const btn = document.getElementById('googleSignInButtonCustomer');
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            width: 320,
          });
        }
      }
    };

    initializeGoogleSignIn();

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener('load', initializeGoogleSignIn);
    }

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.removeEventListener('load', initializeGoogleSignIn);
      }
    };
  }, [step, otpType]);

  const checkContactsExistence = async () => {
    setCheckingExistence(true);
    try {
      const emailVal = customerContact.email;
      const phoneVal = customerContact.phone;
      
      let emailExists = false;
      let phoneExists = false;
      
      if (emailVal) {
        const res = await api.post('/customer/check-exists', { type: 'email', value: emailVal });
        emailExists = !!res.data?.exists;
      }
      if (phoneVal) {
        const res = await api.post('/customer/check-exists', { type: 'phone', value: phoneVal });
        phoneExists = !!res.data?.exists;
      }
      setExistingContacts({ email: emailExists, phone: phoneExists });
    } catch (err) {
      console.error('Failed to check contact existence', err);
    } finally {
      setCheckingExistence(false);
    }
  };

  const updateContactField = (type, newValue) => {
    const updatedContact = { ...customerContact, [type]: newValue };
    setCustomerContact(updatedContact);

    // Sync with submittedData
    const emailField = formConfig?.fields?.find(
      (f) => f.type === 'email' || f.id === 'govt_builtin_email'
    );
    const phoneField = formConfig?.fields?.find(
      (f) => f.type === 'phone' || f.id === 'govt_builtin_phone' || f.id.toLowerCase().includes('mobile')
    );

    const fieldToUpdate = type === 'email' ? emailField : phoneField;
    if (fieldToUpdate) {
      setSubmittedData(prev => ({
        ...prev,
        [fieldToUpdate.id]: newValue
      }));
    }
  };

  const handleSaveEmail = async () => {
    if (!tempEmail || !tempEmail.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(tempEmail)) {
      toast.error('Invalid email format');
      return;
    }
    
    const newVal = tempEmail.trim();
    updateContactField('email', newVal);
    setEditingEmail(false);
    setOtpSent(false);
    setOtpCode('');
    
    setCheckingExistence(true);
    try {
      const res = await api.post('/customer/check-exists', { type: 'email', value: newVal });
      setExistingContacts(prev => ({ ...prev, email: !!res.data?.exists }));
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingExistence(false);
    }
  };

  const handleSavePhone = async () => {
    if (!tempPhone || !tempPhone.trim()) {
      toast.error('Phone number cannot be empty');
      return;
    }
    
    const newVal = tempPhone.trim();
    updateContactField('phone', newVal);
    setEditingPhone(false);
    setOtpSent(false);
    setOtpCode('');
    
    setCheckingExistence(true);
    try {
      const res = await api.post('/customer/check-exists', { type: 'phone', value: newVal });
      setExistingContacts(prev => ({ ...prev, phone: !!res.data?.exists }));
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingExistence(false);
    }
  };

  const fetchFormConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/govt-forms/public/forms/${customRoute}`);
      setFormConfig(res.data?.data || null);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, 'Form not found or currently unavailable. Please verify the URL.'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setSubmittedData({ ...submittedData, [fieldId]: value });
  };

  const handleFileChange = (fieldId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleInputChange(fieldId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        base64: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const startTimer = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (typeOverride = null) => {
    const activeType = typeOverride || otpType;
    const activeValue = activeType === 'email' ? customerContact.email : customerContact.phone;

    if (!activeValue) {
      toast.error(`Please provide a valid ${activeType === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post('/customer/send-otp', {
        type: activeType,
        value: activeValue.trim()
      });
      if (res.data?.success) {
        setOtpSent(true);
        startTimer();
        toast.success(`OTP code sent successfully via ${activeType}`);
      } else {
        toast.error(res.data?.error || 'Failed to send OTP code');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send verification code'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpRegister = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const activeValue = otpType === 'email' ? customerContact.email : customerContact.phone;
      const payload = {
        type: otpType,
        value: activeValue.trim(),
        otp: otpCode.trim(),
        name: customerContact.name,
        customRoute,
        submittedData,
      };

      // Only send contacts that were actually provided.
      if (customerContact.email && String(customerContact.email).trim() !== '') {
        payload.email = customerContact.email;
      }
      if (customerContact.phone && String(customerContact.phone).trim() !== '') {
        payload.phone = customerContact.phone;
      }

      const res = await api.post('/customer/verify-otp-register', payload);

      if (res.data?.success && res.data?.data) {
        const { token, user } = res.data.data;
        dispatch(setAuthData({ token, user }));
        toast.success('Account verified and request submitted successfully!');
        setStep('done');
        
        // Redirect to customer dashboard after 3 seconds
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 3000);
      } else {
        toast.error(res.data?.error || 'Verification failed. Please check the OTP.');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid or expired OTP code'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formConfig) return;

    const isEmpty = (value) =>
      value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

    // Validate required fields
    for (const field of formConfig.fields) {
      const val = submittedData[field.id];
      if (field.required) {
        if (isEmpty(val)) {
          toast.error(`"${field.label}" is a required field`);
          return;
        }
      }
    }

    const emailField = formConfig.fields.find(
      (f) => f.type === 'email' || f.id === 'govt_builtin_email'
    );
    const phoneField = formConfig.fields.find(
      (f) => f.type === 'phone' || f.id === 'govt_builtin_phone' || f.id.toLowerCase().includes('mobile')
    );
    const nameField = formConfig.fields.find(
      (f) => f.id === 'govt_builtin_name' || f.id.toLowerCase().includes('name') || f.id.toLowerCase().includes('fullname')
    );

    const extractedEmail = emailField ? submittedData[emailField.id] : '';
    const extractedPhone = phoneField ? submittedData[phoneField.id] : '';
    const extractedName = nameField ? submittedData[nameField.id] : 'Customer';

    const contactRule = formConfig.requiredContact === 'both' ? 'both' : 'either';
    if (contactRule === 'both') {
      if (isEmpty(extractedEmail)) {
        toast.error('Email is required');
        return;
      }
      if (isEmpty(extractedPhone)) {
        toast.error('Phone Number is required');
        return;
      }
    } else if (isEmpty(extractedEmail) && isEmpty(extractedPhone)) {
      toast.error('Either Email or Phone Number is required');
      return;
    }

    const contactObj = {
      name: extractedName,
      email: extractedEmail,
      phone: extractedPhone
    };

    setCustomerContact(contactObj);
    
    // Default to email if present, otherwise phone
    const preferredType = extractedEmail ? 'email' : 'phone';
    setOtpType(preferredType);
    
    setStep('verify');
    toast.success('Details confirmed. Please complete verification to submit your application.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Submission Link Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
          Submitting to: {formConfig.departmentId?.name}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{formConfig.name}</h1>

        {step === 'done' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl text-green-600">
              ✓
            </div>
            <p className="text-green-600 font-medium text-lg mb-2 font-['Manrope']">Verification Successful!</p>
            <p className="text-gray-500 mb-6 text-sm">
              Your request was submitted and account created. We are logging you in and redirecting to your Customer Dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : step === 'verify' ? (
          <div className="space-y-6">
            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl text-center">
              <h3 className="font-bold text-gray-800 font-['Manrope'] mb-1">Verify Your Identity</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                To link your request and access your final reports, please verify your email or phone number.
              </p>
            </div>            {/* OTP Type Selection & Channel Editing */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Select Verification Channel
              </label>

              {/* Email Card */}
              {customerContact.email && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  otpType === 'email'
                    ? 'border-orange-500 bg-orange-50/20 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => {
                        if (!editingEmail) {
                          setOtpType('email');
                          setOtpSent(false);
                          setOtpCode('');
                        }
                      }}
                    >
                      <input
                        type="radio"
                        checked={otpType === 'email'}
                        onChange={() => {
                          if (!editingEmail) {
                            setOtpType('email');
                            setOtpSent(false);
                            setOtpCode('');
                          }
                        }}
                        className="text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300 cursor-pointer"
                      />
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail size={16} className={otpType === 'email' ? 'text-orange-500' : 'text-gray-400'} />
                        <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
                      </div>
                    </div>

                    {!editingEmail && (
                      <div className="flex items-center gap-2">
                        {existingContacts.email ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            <ShieldCheck size={12} className="text-gray-500" /> Existing Account
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmail(true);
                              setTempEmail(customerContact.email);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-500 font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-orange-50 transition-all"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editingEmail ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:border-orange-500 outline-none"
                        placeholder="email@example.com"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="px-3.5 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEmail(false)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5 ml-7 text-sm font-semibold text-gray-900">
                      {customerContact.email}
                    </div>
                  )}
                </div>
              )}

              {/* Phone Card */}
              {customerContact.phone && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  otpType === 'phone'
                    ? 'border-orange-500 bg-orange-50/20 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => {
                        if (!editingPhone) {
                          setOtpType('phone');
                          setOtpSent(false);
                          setOtpCode('');
                        }
                      }}
                    >
                      <input
                        type="radio"
                        checked={otpType === 'phone'}
                        onChange={() => {
                          if (!editingPhone) {
                            setOtpType('phone');
                            setOtpSent(false);
                            setOtpCode('');
                          }
                        }}
                        className="text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300 cursor-pointer"
                      />
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={16} className={otpType === 'phone' ? 'text-orange-500' : 'text-gray-400'} />
                        <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Number</span>
                      </div>
                    </div>

                    {!editingPhone && (
                      <div className="flex items-center gap-2">
                        {existingContacts.phone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            <ShieldCheck size={12} className="text-gray-500" /> Existing Account
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPhone(true);
                              setTempPhone(customerContact.phone);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-500 font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-orange-50 transition-all"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editingPhone ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="tel"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:border-orange-500 outline-none"
                        placeholder="e.g. +91 9999999999"
                      />
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        className="px-3.5 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPhone(false)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5 ml-7 text-sm font-semibold text-gray-900">
                      {customerContact.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Google Card */}
              <div className={`p-4 rounded-2xl border transition-all ${
                otpType === 'google'
                  ? 'border-orange-500 bg-orange-50/20 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    setOtpType('google');
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                >
                  <input
                    type="radio"
                    checked={otpType === 'google'}
                    onChange={() => {
                      setOtpType('google');
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.57,11.45 21.35,11.1z" fill="#4285F4" />
                        <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.97 -3.3,0.97c-2.33,0 -4.3,-1.58 -5,-3.72H3v2.66c1.5,2.98 4.6,5.01 8.2,5.01Z" fill="#34A853" />
                        <path d="M6.28,13.11c-0.18,-0.54 -0.28,-1.11 -0.28,-1.71c0,-0.6 0.1,-1.17 0.28,-1.71V7.03H3v2.66c-0.6,1.2 -0.96,2.57 -0.96,4.03c0,1.46 0.36,2.83 0.96,4.03l3.28,-2.64Z" fill="#FBBC05" />
                        <path d="M12,5.38c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.72 14.43,2 12,2C8.4,2 5.3,4.03 3.8,7.03l3.28,2.66c0.7,-2.14 2.67,-3.72 5,-3.72Z" fill="#EA4335" />
                      </g>
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Google Sign-In</span>
                  </div>
                </div>
              </div>
            </div>

            {otpType === 'google' ? (
              <div className="pt-4 flex flex-col items-center justify-center space-y-4 relative min-h-[88px]">
                {verifyingOtp && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 rounded-xl space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                    <p className="text-sm font-semibold text-gray-500 font-['Manrope']">Completing Google authentication...</p>
                  </div>
                )}
                <div id="googleSignInButtonCustomer" className="w-full flex justify-center"></div>
                <p className="text-xs text-gray-500">Sign in with your Google account to automatically submit your form.</p>
              </div>
            ) : verifyingOtp ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                <p className="text-sm font-semibold text-gray-500 font-['Manrope']">Verifying...</p>
              </div>
            ) : !otpSent ? (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={sendingOtp || checkingExistence || editingEmail || editingPhone}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all shadow-sm font-['Manrope']"
                >
                  <Send size={14} />
                  {sendingOtp ? 'Sending code...' : `Send Verification OTP via ${otpType === 'email' ? 'Email' : 'WhatsApp'}`}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtpRegister} className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-gray-600">
                    Verification code sent to <span className="font-semibold text-gray-800">{otpType === 'email' ? customerContact.email : customerContact.phone}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-[10px] text-orange-600 hover:text-orange-500 underline mt-1.5 font-medium block mx-auto hover:bg-transparent"
                  >
                    Use other verification method / value
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Enter Verification OTP
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Key size={16} />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-850 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-center tracking-widest font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all shadow-sm font-['Manrope']"
                >
                  <ShieldCheck size={16} />
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP & Create Account'}
                </button>

                {/* Resend timer */}
                <div className="text-center pt-2">
                  {countdown > 0 ? (
                    <span className="text-xs text-gray-400">Resend code in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-xs text-orange-600 hover:text-orange-500 font-semibold"
                    >
                      Resend Verification OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {formConfig.fields.map((field) => {
              const val = submittedData[field.id] || '';
              const contactRule = formConfig.requiredContact === 'both' ? 'both' : 'either';
              const isContactField = field.type === 'email' || field.type === 'phone';
              const showRequired = field.required || (contactRule === 'either' && isContactField);
              const contactHint =
                contactRule === 'either' && field.type === 'email'
                  ? 'Provide email or phone number (at least one is required).'
                  : '';

              return (
                <FormField
                  key={field.id}
                  label={field.label}
                  required={showRequired}
                  hint={contactHint}
                >
                  {field.type === 'text' && (
                    <input
                      type="text"
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      className={inputClass}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Describe ${field.label.toLowerCase()}`}
                      rows={4}
                      className={`${inputClass} min-h-[100px] resize-y`}
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'email@example.com'}
                      className={inputClass}
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'e.g. +91 9999999999'}
                      className={inputClass}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Enter digits'}
                      className={inputClass}
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={inputClass}
                    />
                  )}

                  {field.type === 'dropdown' && (
                    <div className="relative">
                      <select
                        required={field.required}
                        value={val}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={selectClass}
                      >
                        <option value="">-- Choose Option --</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        ▼
                      </div>
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div className="flex flex-wrap gap-4 pt-1.5">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={field.id}
                            required={field.required}
                            checked={val === opt}
                            onChange={() => handleInputChange(field.id, opt)}
                            className="text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex flex-wrap gap-4 pt-1.5">
                      {field.options?.map(opt => {
                        const currentArray = Array.isArray(val) ? val : [];
                        const isChecked = currentArray.includes(opt);
                        const toggleCheck = () => {
                          if (isChecked) {
                            handleInputChange(field.id, currentArray.filter(v => v !== opt));
                          } else {
                            handleInputChange(field.id, [...currentArray, opt]);
                          }
                        };
                        return (
                          <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={toggleCheck}
                              className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4 border-gray-300"
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === 'file' && (
                    <div className="pt-1.5">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors relative">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500 font-semibold">
                            {val ? `Selected: ${val.fileName}` : 'Click to upload document'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          required={field.required && !val}
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleFileChange(field.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {field.type === 'address' && (
                    <textarea
                      required={field.required}
                      value={val}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder="Full Postal Address"
                      rows={3}
                      className={inputClass}
                    />
                  )}
                </FormField>
              );
            })}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
              Submit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicFormPage;
