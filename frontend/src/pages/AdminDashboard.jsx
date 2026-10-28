import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Modal } from '../components/Modal';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Override Modal
  const [selectedBookingForOverride, setSelectedBookingForOverride] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('COMPLETED');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const cleanName = (name) => {
    if (!name) return '';
    return name.split('(')[0].trim();
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, usersRes] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/bookings'),
        client.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (booking) => {
    setSelectedBookingForOverride(booking);
    setOverrideStatus(booking.status === 'IN_PROGRESS' || booking.status === 'ACCEPTED' ? 'COMPLETED' : 'CANCELLED');
    setOverrideError('');
    setOverrideSuccess('');
  };

  const handleExecuteOverride = async (e) => {
    e.preventDefault();
    if (!selectedBookingForOverride) return;
    try {
      setOverrideLoading(true);
      setOverrideError('');
      await client.patch(`/admin/bookings/${selectedBookingForOverride.id}/override`, {
        status: overrideStatus,
      });
      setOverrideSuccess(`Booking #${selectedBookingForOverride.id} updated to ${overrideStatus}.`);
      setTimeout(() => {
        setSelectedBookingForOverride(null);
        fetchAdminData();
      }, 700);
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to override booking state');
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch =
      b.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.residentFlat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(b.id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const renderStatus = (status, attempts = 0) => {
    if (attempts >= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-rose-700">
          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block shrink-0" />
          Locked ({attempts}/5)
        </span>
      );
    }
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
            <span className="w-2 h-2 rounded-full bg-[#3F8A6B] inline-block shrink-0" />
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
            <span className="w-2 h-2 rounded-full bg-[#4A6FA5] inline-block shrink-0" />
            In progress
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
            <span className="w-2 h-2 rounded-full bg-[#4A6FA5] inline-block shrink-0" />
            Accepted
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
            <span className="w-2 h-2 rounded-full bg-[#C48A2A] inline-block shrink-0" />
            Requested
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5C6862]">
            <span className="w-2 h-2 rounded-full bg-[#5C6862] inline-block shrink-0" />
            Cancelled
          </span>
        );
      default:
        return <span className="text-[13px] text-[#5C6862]">{status}</span>;
    }
  };

  const statusFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Requested', value: 'REQUESTED' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'In progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1E2622] tracking-[-0.02em]">
            Community overview
          </h1>
          <p className="text-[15px] text-[#5C6862] mt-1">
            Audit bookings, resolve stalled jobs and review the resident registry.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          Refresh overview
        </button>
      </div>

      {/* Stats: Single white strip split into 4 columns by dividers */}
      <div className="bg-white border border-[#E8E6E0] rounded-[14px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E8E6E0] overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Total bookings</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {stats?.totalBookings ?? bookings.length}
          </div>
          <div className="text-[12px] text-[#5C6862]">Lifetime in community</div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Active providers</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {stats?.activeProviders ?? 1}
          </div>
          <div className="text-[12px] text-[#5C6862]">On duty now</div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Completed</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {stats?.totalCompleted ?? 2}
          </div>
          <div className="text-[12px] text-[#5C6862]">OTP-verified</div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Residents</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {stats?.totalUsers ?? usersList.length}
          </div>
          <div className="text-[12px] text-[#5C6862]">Doorstep verified</div>
        </div>
      </div>

      {/* SECTION: BOOKINGS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1E2622]">
              Bookings
            </h2>
            <p className="text-[14px] text-[#5C6862] mt-0.5">
              Admins can manually resolve stalled or locked jobs.
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search Ref, name or service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] placeholder:text-[#5C6862]/60"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`rounded-full px-3.5 py-1 text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${
                filterStatus === f.value
                  ? 'bg-[#2F5D50] text-white'
                  : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#F7F6F2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-[#E8E6E0] rounded-[14px] overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-[#5C6862] text-[14px]">
              No bookings match the selected criteria.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="text-[12px] font-medium text-[#5C6862] border-b border-[#E8E6E0] bg-[#F7F6F2]">
                <tr>
                  <th className="py-3 px-5">Ref</th>
                  <th className="py-3 px-5">Service</th>
                  <th className="py-3 px-5">Resident</th>
                  <th className="py-3 px-5">Provider</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">OTP</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EC]">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7F6F2]/50 transition-colors">
                    <td className="py-4 px-5 text-[13px] text-[#5C6862]">
                      #{b.id}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-medium text-[#1E2622]">{b.serviceTitle}</div>
                      <div className="text-[12px] text-[#5C6862]">
                        {b.serviceCategory} · ₹{b.basePrice}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[#5C6862]">
                      <div className="text-[#1E2622] font-medium">{cleanName(b.residentName)}</div>
                      <div className="text-[12px] text-[#5C6862]">{b.residentFlat}</div>
                    </td>
                    <td className="py-4 px-5 text-[#5C6862]">
                      <div className="text-[#1E2622] font-medium">{cleanName(b.providerName)}</div>
                      <div className="text-[12px] text-[#5C6862]">{b.providerFlat}</div>
                    </td>
                    <td className="py-4 px-5">
                      {renderStatus(b.status, b.otpAttempts)}
                    </td>
                    <td className="py-4 px-5 text-[13px] text-[#1E2622]">
                      {b.verificationOtp}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleOpenOverride(b)}
                        className="border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: COMMUNITY REGISTRY */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#1E2622]">
            Resident & provider registry
          </h2>
          <p className="text-[14px] text-[#5C6862] mt-0.5">
            Verified members registered with passcode CAMPUS2026.
          </p>
        </div>

        <div className="bg-white border border-[#E8E6E0] rounded-[14px] overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12px] font-medium text-[#5C6862] border-b border-[#E8E6E0] bg-[#F7F6F2]">
              <tr>
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">Unit / Flat</th>
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F1EC]">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-[#F7F6F2]/50 transition-colors">
                  <td className="py-4 px-5 font-medium text-[#1E2622]">
                    {cleanName(u.name)}
                  </td>
                  <td className="py-4 px-5 text-[#5C6862]">
                    {u.flatOrRoomNo}
                  </td>
                  <td className="py-4 px-5 text-[#5C6862] text-[13px]">
                    <div>{u.email}</div>
                    <div>{u.phone}</div>
                  </td>
                  <td className="py-4 px-5 text-[13px] text-[#5C6862]">
                    {u.role === 'ROLE_ADMIN' && 'Estate manager'}
                    {u.role === 'ROLE_PROVIDER' && 'Facility provider'}
                    {u.role === 'ROLE_RESIDENT' && (u.isPeerProvider ? 'Peer provider' : 'Resident')}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
                      <span className="w-2 h-2 rounded-full bg-[#3F8A6B] inline-block shrink-0" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERRIDE MODAL */}
      <Modal
        isOpen={!!selectedBookingForOverride}
        onClose={() => setSelectedBookingForOverride(null)}
        title={`Override booking #${selectedBookingForOverride?.id}`}
      >
        <form onSubmit={handleExecuteOverride} className="space-y-4">
          {overrideError && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
              {overrideError}
            </div>
          )}

          {overrideSuccess && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#E6EEEA] text-[#2F5D50] text-[13px]">
              {overrideSuccess}
            </div>
          )}

          <div className="bg-[#F7F6F2] rounded-[10px] p-4 border border-[#E8E6E0] space-y-1.5 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[#5C6862]">Service:</span>
              <span className="font-medium text-[#1E2622]">{selectedBookingForOverride?.serviceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6862]">Resident:</span>
              <span className="text-[#1E2622]">{cleanName(selectedBookingForOverride?.residentName)} ({selectedBookingForOverride?.residentFlat})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6862]">Provider:</span>
              <span className="text-[#1E2622]">{cleanName(selectedBookingForOverride?.providerName)} ({selectedBookingForOverride?.providerFlat})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6862]">Current status:</span>
              <span className="font-medium text-[#1E2622]">{selectedBookingForOverride?.status}</span>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
              Target status
            </label>
            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            >
              <option value="COMPLETED">Completed (Resolve & disburse)</option>
              <option value="CANCELLED">Cancelled (Void booking)</option>
              <option value="IN_PROGRESS">In Progress (Bypass handshake)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={overrideLoading}
              className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {overrideLoading ? 'Applying...' : 'Apply override'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
