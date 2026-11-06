import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Modal } from '../components/Modal';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myServices, setMyServices] = useState([]);

  // Availability state
  const [isOnline, setIsOnline] = useState(true);

  // OTP Verification state for accepted job
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  // Action feedback
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Add Service Modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Electrical');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const cleanName = (name) => {
    if (!name) return '';
    return name.split('(')[0].trim();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, servicesRes] = await Promise.all([
        client.get('/bookings/my-bookings'),
        client.get('/services/my-services'),
      ]);
      setBookings(bookingsRes.data.filter((b) => b.providerId === user?.id));
      setMyServices(servicesRes.data);
    } catch (err) {
      console.error('Error loading provider data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      setActionMessage({ text: '', type: '' });
      await client.patch(`/bookings/${bookingId}/accept`);
      setActionMessage({ text: `Booking #${bookingId} accepted. Ready for physical OTP handshake.`, type: 'success' });
      fetchData();
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to accept booking', type: 'error' });
    }
  };

  const handleVerifyStart = async (bookingId) => {
    const otp = otpInputs[bookingId] || '';
    if (!otp || otp.length !== 4) {
      setOtpErrors({ ...otpErrors, [bookingId]: 'Please enter the exact 4-digit code' });
      return;
    }

    try {
      setVerifyingId(bookingId);
      setOtpErrors({ ...otpErrors, [bookingId]: '' });
      await client.patch(`/bookings/${bookingId}/verify-start`, { otp });
      setActionMessage({ text: `Handshake verified! Job #${bookingId} is now in progress.`, type: 'success' });
      setOtpInputs({ ...otpInputs, [bookingId]: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP code';
      setOtpErrors({ ...otpErrors, [bookingId]: msg });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      setActionMessage({ text: '', type: '' });
      await client.patch(`/bookings/${bookingId}/complete`);
      setActionMessage({ text: `Job #${bookingId} marked as completed.`, type: 'success' });
      fetchData();
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to complete job', type: 'error' });
    }
  };

  const handleToggleGlobalAvailability = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setActionMessage({
      text: nextState ? 'Status set to Online. You are receiving requests.' : 'Status set to Offline. New requests paused.',
      type: 'info'
    });
  };

  const handleToggleService = async (serviceId) => {
    try {
      await client.patch(`/services/${serviceId}/toggle-availability`);
      fetchData();
    } catch (err) {
      console.error('Failed to toggle service', err);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      setServiceError('');
      await client.post('/services', {
        title: serviceTitle,
        category: serviceCategory,
        description: serviceDescription,
        basePrice: parseFloat(servicePrice),
        isAvailable: true,
      });
      setShowAddServiceModal(false);
      setServiceTitle('');
      setServiceDescription('');
      setServicePrice('');
      fetchData();
    } catch (err) {
      setServiceError(err.response?.data?.message || 'Failed to add service');
    }
  };

  // Derived stats
  const requestedBookings = bookings.filter((b) => b.status === 'REQUESTED');
  const acceptedBookings = bookings.filter((b) => b.status === 'ACCEPTED');
  const inProgressBookings = bookings.filter((b) => b.status === 'IN_PROGRESS');
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const totalEarnings = completedBookings.reduce((sum, b) => sum + (parseFloat(b.basePrice) || 0), 0);
  const providerFirstName = user?.name ? cleanName(user.name).split(' ')[0] : 'there';

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
      {/* Header section with Online Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1E2622] tracking-[-0.02em]">
            {getGreeting()}, {providerFirstName}
          </h1>
          <p className="text-[15px] text-[#5C6862] mt-1">
            {user?.isPeerProvider
              ? 'Peer tutor & skills provider. Manage tutoring requests and verify handshakes with students.'
              : 'Handy electrician & plumber. Manage jobs and verify handshakes with residents.'}
          </p>
        </div>

        {/* Minimal Online toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleGlobalAvailability}
            className="flex items-center gap-2 bg-white border border-[#E8E6E0] rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#1E2622] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                isOnline ? 'bg-[#3F8A6B]' : 'bg-[#5C6862]'
              }`}
            />
            <span>{isOnline ? 'Online, receiving requests' : 'Offline (paused)'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage.text && (
        <div className="p-3.5 rounded-[10px] bg-white border border-[#E8E6E0] text-[13px] text-[#1E2622] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                actionMessage.type === 'success' ? 'bg-[#3F8A6B]' : 'bg-[#C48A2A]'
              }`}
            />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ text: '', type: '' })}
            className="text-[#5C6862] hover:text-[#1E2622] text-[13px] cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats: Single white strip split into 4 columns by dividers */}
      <div className="bg-white border border-[#E8E6E0] rounded-[14px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E8E6E0] overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Incoming</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {requestedBookings.length}
          </div>
          <div className="text-[12px] text-[#5C6862]">Pending acceptance</div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">In progress</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {acceptedBookings.length + inProgressBookings.length}
          </div>
          <div className="text-[12px] text-[#5C6862]">
            {acceptedBookings.length > 0 ? `${acceptedBookings.length} awaiting OTP` : 'Nothing waiting OTP'}
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Completed</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            {completedBookings.length}
          </div>
          <div className="text-[12px] text-[#5C6862]">OTP-verified</div>
        </div>

        <div className="p-5 md:p-6">
          <div className="text-[12px] text-[#5C6862] font-medium mb-1">Earnings</div>
          <div className="text-[30px] font-semibold text-[#1E2622] leading-none mb-1">
            ₹{totalEarnings}
          </div>
          <div className="text-[12px] text-[#5C6862]">Due shortly</div>
        </div>
      </div>

      {/* SECTION 1: INCOMING REQUESTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#1E2622]">
            Incoming requests {requestedBookings.length > 0 && `(${requestedBookings.length})`}
          </h2>
          <button
            onClick={fetchData}
            className="text-[#2F5D50] hover:underline text-[13px] font-medium cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {requestedBookings.length === 0 ? (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-8 text-center text-[#5C6862] text-[14px]">
            No incoming requests right now.
          </div>
        ) : (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
            {requestedBookings.map((b) => (
              <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="text-[12px] font-medium text-[#5C6862] uppercase tracking-wider">
                    REQUEST #{b.id} · {b.serviceCategory?.toUpperCase() || 'ELECTRICAL'}
                  </div>
                  <div className="text-[16px] font-semibold text-[#1E2622]">
                    {b.serviceTitle}
                  </div>
                  <div className="text-[13px] text-[#5C6862]">
                    {cleanName(b.residentName)} · {b.residentFlat} · {b.residentPhone}
                  </div>
                  {b.notes && (
                    <p className="text-[13px] text-[#5C6862] pt-1">
                      "{b.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-[20px] font-semibold text-[#1E2622]">
                      ₹{b.basePrice}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(b.id)}
                    className="min-h-[44px] h-[44px] px-6 rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer"
                  >
                    Accept job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE JOBS */}
      <div className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#1E2622]">
          Active jobs
        </h2>

        {acceptedBookings.length === 0 && inProgressBookings.length === 0 ? (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-8 text-center text-[#5C6862] text-[14px]">
            No jobs in progress right now.
          </div>
        ) : (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
            {/* Accepted jobs awaiting OTP handshake */}
            {acceptedBookings.map((b) => (
              <div key={b.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] text-[#5C6862]">
                      Job #{b.id} · {b.serviceCategory}
                    </div>
                    <div className="text-[16px] font-semibold text-[#1E2622] mt-0.5">
                      {b.serviceTitle}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1E2622]">
                    <span className="w-2 h-2 rounded-full bg-[#4A6FA5] inline-block shrink-0" />
                    En route to resident
                  </span>
                </div>

                <div className="text-[13px] text-[#5C6862] flex flex-wrap gap-x-6 gap-y-1">
                  <span>Resident: <strong className="text-[#1E2622]">{cleanName(b.residentName)}</strong></span>
                  <span>Destination: <strong className="text-[#1E2622]">{b.residentFlat}</strong></span>
                  {b.residentPhone && <span>Contact: <span className="text-[#1E2622]">{b.residentPhone}</span></span>}
                  <span>Fee: <strong className="text-[#1E2622]">₹{b.basePrice}</strong></span>
                </div>

                {/* Handshake OTP input */}
                <div className="bg-[#F7F6F2] border border-[#E8E6E0] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-[#1E2622]">
                      Enter resident's 4-digit handshake OTP
                    </div>
                    <div className="text-[12px] text-[#5C6862]">
                      Ask {cleanName(b.residentName)} for the code on their screen to start work.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={otpInputs[b.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpInputs({ ...otpInputs, [b.id]: val });
                      }}
                      className="w-24 text-center text-[16px] font-medium bg-white border border-[#E8E6E0] rounded-[8px] py-2 px-2 focus:outline-none focus:border-[#2F5D50]"
                    />
                    <button
                      onClick={() => handleVerifyStart(b.id)}
                      disabled={verifyingId === b.id || (b.otpAttempts || 0) >= 5}
                      className="min-h-[44px] h-[44px] px-5 rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {verifyingId === b.id ? 'Verifying...' : 'Verify & start'}
                    </button>
                  </div>
                </div>

                {otpErrors[b.id] && (
                  <p className="text-[12px] text-rose-700">
                    {otpErrors[b.id]}
                  </p>
                )}
              </div>
            ))}

            {/* In progress jobs */}
            {inProgressBookings.map((b) => (
              <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4A6FA5]" />
                    <span className="text-[13px] text-[#1E2622] font-medium">Work in progress</span>
                  </div>
                  <div className="text-[16px] font-semibold text-[#1E2622]">
                    {b.serviceTitle}
                  </div>
                  <div className="text-[13px] text-[#5C6862]">
                    Resident: {cleanName(b.residentName)} · {b.residentFlat} · Fee: ₹{b.basePrice}
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(b.id)}
                  className="min-h-[44px] h-[44px] px-6 rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer shrink-0"
                >
                  Mark completed
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: COMPLETED & REVIEWS */}
      <div className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[#1E2622]">
          Completed & reviews
        </h2>

        {completedBookings.length === 0 ? (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-8 text-center text-[#5C6862] text-[14px]">
            No completed jobs recorded yet.
          </div>
        ) : (
          <div className="bg-white border border-[#E8E6E0] rounded-[14px] overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="text-[12px] font-medium text-[#5C6862] border-b border-[#E8E6E0] bg-[#F7F6F2]">
                <tr>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Resident</th>
                  <th className="py-3 px-6">Fee</th>
                  <th className="py-3 px-6">Review</th>
                  <th className="py-3 px-6">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EC]">
                {completedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7F6F2]/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-[#1E2622]">
                      {b.serviceTitle}
                    </td>
                    <td className="py-4 px-6 text-[#5C6862]">
                      <div className="text-[#1E2622] font-medium">{cleanName(b.residentName)}</div>
                      <div className="text-[12px] text-[#5C6862]">{b.residentFlat}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#1E2622]">
                      ₹{b.basePrice}
                    </td>
                    <td className="py-4 px-6 text-[#5C6862] text-[13px]">
                      {b.review ? (
                        <div>
                          <span className="font-medium text-[#1E2622]">★ {b.review.rating}.0</span>{' '}
                          {b.review.comment && <span>{b.review.comment}</span>}
                        </div>
                      ) : (
                        <span className="text-[#5C6862]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[13px] text-[#5C6862]">
                      {b.completedAt ? new Date(b.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: YOUR LISTED SERVICES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#1E2622]">
            Your listed services
          </h2>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer"
          >
            Add service
          </button>
        </div>

        <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
          {myServices.length === 0 ? (
            <div className="p-8 text-center text-[#5C6862] text-[14px]">
              No listed services yet.
            </div>
          ) : (
            myServices.map((service) => (
              <div key={service.id} className="p-6 flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="text-[12px] font-medium text-[#5C6862] uppercase tracking-wider">
                    {service.category}
                  </div>
                  <div className="text-[16px] font-semibold text-[#1E2622]">
                    {service.title}
                  </div>
                  <p className="text-[14px] text-[#5C6862]">
                    {service.description}
                  </p>
                  <div className="text-[14px] font-semibold text-[#1E2622] pt-1">
                    ₹{service.basePrice}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleService(service.id)}
                  className="border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer shrink-0"
                >
                  {service.isAvailable ? 'Set offline' : 'Set active'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD SERVICE MODAL */}
      <Modal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Add facility service"
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          {serviceError && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
              {serviceError}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Service title</label>
            <input
              type="text"
              required
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="e.g. Switchboard repair & MCB troubleshooting"
              className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Category</label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Appliance Repair">Appliance Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Base fee (₹)</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="199"
                className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Description</label>
            <textarea
              rows={3}
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Provide repair scope, testing procedure, or material inclusions."
              className="w-full p-3 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer"
          >
            Add to catalog
          </button>
        </form>
      </Modal>
    </div>
  );
};
