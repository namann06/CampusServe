import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const QuickRoleSwitcher = () => {
  const { user, quickLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (roleType) => {
    try {
      setSwitching(true);
      const loggedUser = await quickLogin(roleType);
      if (loggedUser.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else if (loggedUser.role === 'ROLE_PROVIDER') {
        navigate('/provider');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Role switch error', err);
    } finally {
      setSwitching(false);
    }
  };

  const isCurrent = (role, isPeer = false) => {
    if (!user) return false;
    if (isPeer) return user.isPeerProvider && user.role === 'ROLE_RESIDENT';
    if (role === 'ROLE_RESIDENT') return user.role === 'ROLE_RESIDENT' && !user.isPeerProvider;
    return user.role === role;
  };

  return (
    <aside aria-label="Demo role switcher" className="bg-[#F7F6F2] border-b border-[#E8E6E0] py-2 px-4 text-[12px] text-[#5C6862]">
      <div className="max-w-[1120px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#1E2622]">Role preview:</span>
          <span>Switch personas to view dashboard variants</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => handleRoleSwitch('resident')}
            disabled={loading || switching}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              isCurrent('ROLE_RESIDENT')
                ? 'bg-[#2F5D50] text-white'
                : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#E6EEEA]'
            }`}
          >
            Resident
          </button>

          <button
            onClick={() => handleRoleSwitch('provider')}
            disabled={loading || switching}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              isCurrent('ROLE_PROVIDER')
                ? 'bg-[#2F5D50] text-white'
                : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#E6EEEA]'
            }`}
          >
            Provider
          </button>

          <button
            onClick={() => handleRoleSwitch('peer')}
            disabled={loading || switching}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              isCurrent('ROLE_RESIDENT', true)
                ? 'bg-[#2F5D50] text-white'
                : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#E6EEEA]'
            }`}
          >
            Peer tutor
          </button>

          <button
            onClick={() => handleRoleSwitch('admin')}
            disabled={loading || switching}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              isCurrent('ROLE_ADMIN')
                ? 'bg-[#2F5D50] text-white'
                : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#E6EEEA]'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </aside>
  );
};
