import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCleanName = (name) => {
    if (!name) return '';
    return name.split('(')[0].trim();
  };

  const getRoleDisplay = (user) => {
    if (!user) return '';
    let roleTitle = 'Resident';
    if (user.role === 'ROLE_ADMIN') roleTitle = 'Estate manager';
    else if (user.role === 'ROLE_PROVIDER') roleTitle = 'Provider';
    else if (user.isPeerProvider) roleTitle = 'Resident (Peer Tutor)';
    
    const loc = user.flatOrRoomNo ? ` · ${user.flatOrRoomNo}` : '';
    return `${roleTitle}${loc}`;
  };

  return (
    <header className="bg-white border-b border-[#E8E6E0] sticky top-0 z-40">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Community Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#2F5D50] flex items-center justify-center text-white shrink-0 font-medium text-[13px] tracking-tight">
                C
              </div>
              <span className="text-[15px] font-semibold text-[#1E2622]">
                CampusServe
              </span>
            </Link>

            <span className="text-[13px] text-[#5C6862] hidden md:inline ml-1">
              {user?.communityName || 'Shantiniketan Heights & Campus Residency'}
            </span>
          </div>

          {/* User Nav and Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right">
                  <div className="text-[14px] font-medium text-[#1E2622] leading-tight">
                    {getCleanName(user.name)}
                  </div>
                  <div className="text-[12px] text-[#5C6862] leading-tight mt-0.5">
                    {getRoleDisplay(user)}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="border border-[#E8E6E0] bg-white text-[#1E2622] hover:bg-[#F7F6F2] px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="border border-[#E8E6E0] bg-white text-[#1E2622] hover:bg-[#F7F6F2] px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
