import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatOrRoomNumber, setFlatOrRoomNumber] = useState('');
  const [role, setRole] = useState('ROLE_RESIDENT');
  const [communityPasscode, setCommunityPasscode] = useState('CAMPUS2026');
  const [isPeerProvider, setIsPeerProvider] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const loggedUser = await login(email, password);
      redirectAfterAuth(loggedUser.role);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const newUser = await register({
        name,
        email,
        password,
        phone,
        flatOrRoomNumber,
        role,
        communityPasscode,
        isPeerProvider: role === 'ROLE_RESIDENT' ? isPeerProvider : false,
      });
      setSuccessMessage('Registration successful! Redirecting...');
      setTimeout(() => redirectAfterAuth(newUser.role), 600);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed');
    }
  };

  const redirectAfterAuth = (userRole) => {
    if (userRole === 'ROLE_ADMIN') navigate('/admin');
    else if (userRole === 'ROLE_PROVIDER') navigate('/provider');
    else navigate('/dashboard');
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-[420px] mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-[6px] bg-[#2F5D50] text-white mx-auto flex items-center justify-center font-semibold text-sm">
            C
          </div>
          <h1 className="text-[24px] font-semibold text-[#1E2622] tracking-[-0.02em]">
            CampusServe
          </h1>
          <p className="text-[14px] text-[#5C6862]">
            Closed-community services marketplace
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-6 sm:p-8 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-[#E8E6E0] -mt-1">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`pb-3 w-1/2 text-[14px] font-medium text-center border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                !isRegister
                  ? 'text-[#2F5D50] border-[#2F5D50]'
                  : 'text-[#5C6862] hover:text-[#1E2622] border-transparent'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`pb-3 w-1/2 text-[14px] font-medium text-center border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                isRegister
                  ? 'text-[#2F5D50] border-[#2F5D50]'
                  : 'text-[#5C6862] hover:text-[#1E2622] border-transparent'
              }`}
            >
              Join community
            </button>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#E6EEEA] text-[#2F5D50] text-[13px]">
              {successMessage}
            </div>
          )}

          {!isRegister ? (
            /* Sign in form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@test.com"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>

              {/* Quick test accounts */}
              <div className="pt-5 border-t border-[#F3F1EC] space-y-2">
                <div className="text-[12px] text-[#5C6862] text-center">
                  Quick test personas (password: password123)
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => fillCredentials('resident@test.com', 'password123')}
                    className="p-2 rounded-[8px] border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#1E2622]">Resident</div>
                    <div className="text-[11px] text-[#5C6862]">Priya Sharma</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('provider@test.com', 'password123')}
                    className="p-2 rounded-[8px] border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#1E2622]">Provider</div>
                    <div className="text-[11px] text-[#5C6862]">Ramesh Kumar</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('peer@test.com', 'password123')}
                    className="p-2 rounded-[8px] border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#1E2622]">Peer tutor</div>
                    <div className="text-[11px] text-[#5C6862]">Aarav Verma</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@test.com', 'password123')}
                    className="p-2 rounded-[8px] border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-[#1E2622]">Admin</div>
                    <div className="text-[11px] text-[#5C6862]">Vikramaditya S.</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Register form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@test.com"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Unit / Flat</label>
                  <input
                    type="text"
                    required
                    value={flatOrRoomNumber}
                    onChange={(e) => setFlatOrRoomNumber(e.target.value)}
                    placeholder="Tower B-402"
                    className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Phone number (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Community role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('ROLE_RESIDENT')}
                    className={`p-2.5 rounded-[8px] border text-left transition-colors cursor-pointer ${
                      role === 'ROLE_RESIDENT'
                        ? 'border-[#2F5D50] bg-[#E6EEEA] text-[#1E2622]'
                        : 'border-[#E8E6E0] bg-white text-[#5C6862] hover:bg-[#F7F6F2]'
                    }`}
                  >
                    <div className="font-medium text-[13px] text-[#1E2622]">Resident</div>
                    <div className="text-[11px] text-[#5C6862]">Book services & skills</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ROLE_PROVIDER')}
                    className={`p-2.5 rounded-[8px] border text-left transition-colors cursor-pointer ${
                      role === 'ROLE_PROVIDER'
                        ? 'border-[#2F5D50] bg-[#E6EEEA] text-[#1E2622]'
                        : 'border-[#E8E6E0] bg-white text-[#5C6862] hover:bg-[#F7F6F2]'
                    }`}
                  >
                    <div className="font-medium text-[13px] text-[#1E2622]">Provider</div>
                    <div className="text-[11px] text-[#5C6862]">Deliver services</div>
                  </button>
                </div>
              </div>

              {role === 'ROLE_RESIDENT' && (
                <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2]">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPeerProvider}
                      onChange={(e) => setIsPeerProvider(e.target.checked)}
                      className="mt-1 accent-[#2F5D50]"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#1E2622] block">
                        Offer peer skills to neighbors (P2P)
                      </span>
                      <span className="text-[12px] text-[#5C6862] block">
                        Allows you to list tutoring, software guidance, or personal skills.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
                  Community passcode
                </label>
                <input
                  type="text"
                  required
                  value={communityPasscode}
                  onChange={(e) => setCommunityPasscode(e.target.value)}
                  placeholder="CAMPUS2026"
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors uppercase"
                />
                <span className="text-[11px] text-[#5C6862] block mt-1">
                  Enclave access verification code (default: CAMPUS2026)
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Join community'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
