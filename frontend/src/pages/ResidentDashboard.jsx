import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Modal } from '../components/Modal';
import { Star } from 'lucide-react';

export const ResidentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'bookings' | 'p2p'
  
  // Catalog state - cached in memory for instantaneous 0ms filtering
  const [services, setServices] = useState([]);
  const [categories] = useState(['All', 'Electrical', 'Plumbing', 'Peer tutoring', 'Cleaning']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingServices, setLoadingServices] = useState(false);

  // Bookings state - stores all community bookings for this user (both placed & received)
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSubTab, setBookingSubTab] = useState('received'); // 'received' | 'booked_by_me'

  // Peer Provider Action States
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [peerActionMessage, setPeerActionMessage] = useState({ text: '', type: '' });

  // Booking Modal
  const [selectedService, setSelectedService] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessOtp, setBookingSuccessOtp] = useState(null);

  // Review Modal
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Peer Provider State (if user is peer provider)
  const [myP2pServices, setMyP2pServices] = useState([]);
  const [showAddP2pModal, setShowAddP2pModal] = useState(false);
  const [p2pTitle, setP2pTitle] = useState('');
  const [p2pCategory, setP2pCategory] = useState('Peer tutoring');
  const [p2pDescription, setP2pDescription] = useState('');
  const [p2pPrice, setP2pPrice] = useState('');
  const [p2pError, setP2pError] = useState('');

  // Initial mount: load catalog, bookings, and p2p services once in parallel
  useEffect(() => {
    fetchServices();
    fetchBookings();
    if (user?.isPeerProvider) {
      fetchMyP2pServices();
    }
  }, []);

  const cleanName = (name) => {
    if (!name) return '';
    return name.split('(')[0].trim();
  };

  const getInitials = (name) => {
    if (!name) return 'CS';
    const parts = cleanName(name).split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || 'C').toUpperCase();
  };

  // Instant in-memory category filtering: 0ms latency, eliminates redundant network calls
  const displayedServices = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return services;
    const target = selectedCategory.toLowerCase().replace(/\s+/g, '');
    return services.filter((s) => s.category?.toLowerCase().replace(/\s+/g, '') === target);
  }, [services, selectedCategory]);

  // Split bookings between services booked by this resident vs requests received for their peer services
  const myBookedServices = useMemo(() => {
    return bookings.filter((b) => b.residentId === user?.id);
  }, [bookings, user?.id]);

  const receivedRequests = useMemo(() => {
    return bookings.filter((b) => b.providerId === user?.id);
  }, [bookings, user?.id]);

  const totalBookingsCount = user?.isPeerProvider
    ? receivedRequests.length + myBookedServices.length
    : myBookedServices.length;

  // Auto-select the appropriate sub-tab based on incoming vs outgoing bookings
  useEffect(() => {
    if (user?.isPeerProvider) {
      if (receivedRequests.length > 0 && myBookedServices.length === 0) {
        setBookingSubTab('received');
      } else if (receivedRequests.length === 0 && myBookedServices.length > 0) {
        setBookingSubTab('booked_by_me');
      }
    }
  }, [user?.isPeerProvider, receivedRequests.length, myBookedServices.length]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const res = await client.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error('Error fetching services', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await client.get('/bookings/my-bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchMyP2pServices = async () => {
    try {
      const res = await client.get('/services/my-services');
      setMyP2pServices(res.data);
    } catch (err) {
      console.error('Error fetching P2P services', err);
    }
  };

  // Peer Provider Action Handlers
  const handleAcceptBooking = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      setPeerActionMessage({ text: '', type: '' });
      const res = await client.patch(`/bookings/${bookingId}/accept`);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
      setPeerActionMessage({ text: `Class request #${bookingId} accepted. Awaiting arrival OTP handshake.`, type: 'success' });
    } catch (err) {
      setPeerActionMessage({ text: err.response?.data?.message || 'Failed to accept booking', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyStart = async (bookingId) => {
    const otp = otpInputs[bookingId] || '';
    if (!otp || otp.length !== 4) {
      setOtpErrors((prev) => ({ ...prev, [bookingId]: 'Please enter the exact 4-digit handshake code' }));
      return;
    }
    try {
      setProcessingId(bookingId);
      setOtpErrors((prev) => ({ ...prev, [bookingId]: '' }));
      const res = await client.patch(`/bookings/${bookingId}/verify-start`, { otp });
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
      setPeerActionMessage({ text: `Handshake verified! Class #${bookingId} is now in progress.`, type: 'success' });
      setOtpInputs((prev) => ({ ...prev, [bookingId]: '' }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP code';
      setOtpErrors((prev) => ({ ...prev, [bookingId]: msg }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      setPeerActionMessage({ text: '', type: '' });
      const res = await client.patch(`/bookings/${bookingId}/complete`);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
      setPeerActionMessage({ text: `Class #${bookingId} marked as completed.`, type: 'success' });
    } catch (err) {
      setPeerActionMessage({ text: err.response?.data?.message || 'Failed to complete booking', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenBookingModal = (service) => {
    setSelectedService(service);
    setBookingNotes('');
    setBookingError('');
    setBookingSuccessOtp(null);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      setSubmittingBooking(true);
      setBookingError('');
      
      const cleanNotes = bookingNotes ? bookingNotes.trim() : '';
      if (/(drop\s+table|select\s+.*from|insert\s+into|delete\s+from|union\s+select|<script|<[^>]+>)/i.test(cleanNotes)) {
        setBookingError('Please enter a normal description without query statements or script tags.');
        setSubmittingBooking(false);
        return;
      }

      const res = await client.post('/bookings', {
        serviceId: selectedService.id,
        notes: cleanNotes,
      });
      setBookingSuccessOtp(res.data.verificationOtp);
      setBookings((prev) => [res.data, ...prev]);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to place booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    try {
      setSubmittingReview(true);
      setReviewError('');
      const res = await client.post(`/bookings/${reviewBooking.id}/reviews`, {
        rating,
        comment: reviewComment,
      });
      setBookings((prev) => prev.map((b) => (b.id === reviewBooking.id ? { ...b, review: res.data } : b)));
      setReviewBooking(null);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddP2pService = async (e) => {
    e.preventDefault();
    try {
      setP2pError('');
      const res = await client.post('/services', {
        title: p2pTitle,
        category: p2pCategory,
        description: p2pDescription,
        basePrice: parseFloat(p2pPrice),
        isAvailable: true,
      });
      setShowAddP2pModal(false);
      setP2pTitle('');
      setP2pDescription('');
      setP2pPrice('');
      setMyP2pServices((prev) => [...prev, res.data]);
      setServices((prev) => [...prev, res.data]);
    } catch (err) {
      setP2pError(err.response?.data?.message || 'Failed to create service');
    }
  };

  const handleToggleAvailability = async (serviceId) => {
    try {
      const res = await client.patch(`/services/${serviceId}/toggle-availability`);
      setMyP2pServices((prev) => prev.map((s) => (s.id === serviceId ? res.data : s)));
      setServices((prev) => prev.map((s) => (s.id === serviceId ? res.data : s)));
    } catch (err) {
      console.error('Error toggling availability', err);
    }
  };

  const renderStatus = (status) => {
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

  const firstName = user?.name ? cleanName(user.name).split(' ')[0] : 'there';

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1E2622] tracking-[-0.02em]">
          Hello, {firstName}
        </h1>
        <p className="text-[15px] text-[#5C6862] mt-1">
          Book trusted help from people in your community
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-[#E8E6E0]">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-[15px] font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeTab === 'catalog'
              ? 'text-[#2F5D50] border-[#2F5D50]'
              : 'text-[#5C6862] hover:text-[#1E2622] border-transparent'
          }`}
        >
          Services
        </button>

        <button
          onClick={() => { setActiveTab('bookings'); fetchBookings(); }}
          className={`pb-3 text-[15px] font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'text-[#2F5D50] border-[#2F5D50]'
              : 'text-[#5C6862] hover:text-[#1E2622] border-transparent'
          }`}
        >
          <span>My bookings</span>
          {totalBookingsCount > 0 && (
            <span className="text-[12px] bg-[#E6EEEA] text-[#2F5D50] font-semibold px-2 py-0.5 rounded-full">
              {totalBookingsCount}
            </span>
          )}
        </button>

        {user?.isPeerProvider && (
          <button
            onClick={() => setActiveTab('p2p')}
            className={`pb-3 text-[15px] font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] flex items-center gap-1.5 ${
              activeTab === 'p2p'
                ? 'text-[#2F5D50] border-[#2F5D50]'
                : 'text-[#5C6862] hover:text-[#1E2622] border-transparent'
            }`}
          >
            <span>My listed services</span>
            {myP2pServices.length > 0 && (
              <span className="text-[12px] text-[#5C6862] font-normal">
                {myP2pServices.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: SERVICES CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#2F5D50] text-white'
                    : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#F7F6F2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Single Container with Divider Rows */}
          {loadingServices ? (
            <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
              Loading community services...
            </div>
          ) : displayedServices.length === 0 ? (
            <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
              No services found under {selectedCategory}.
            </div>
          ) : (
            <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
              {displayedServices.map((service) => (
                <div
                  key={service.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="text-[12px] font-semibold tracking-wider text-[#5C6862] uppercase">
                      {service.category}
                    </div>
                    <div className="text-[16px] font-semibold text-[#1E2622]">
                      {service.title}
                    </div>
                    <p className="text-[14px] text-[#5C6862] leading-relaxed">
                      {service.description || 'Verified on-campus service.'}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[13px] text-[#5C6862]">
                      <span className="w-5 h-5 rounded-full bg-[#E6EEEA] text-[#2F5D50] text-[10px] font-semibold inline-flex items-center justify-center shrink-0">
                        {getInitials(service.providerName)}
                      </span>
                      <span>
                        {cleanName(service.providerName)} · {service.providerFlat}
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                    <div className="md:text-right">
                      <div className="text-[22px] font-semibold text-[#1E2622] leading-none">
                        ₹{service.basePrice}
                      </div>
                      <div className="text-[12px] text-[#5C6862] mt-0.5">
                        base fee
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBookingModal(service)}
                      disabled={service.providerId === user?.id}
                      className={`min-h-[44px] h-[44px] px-6 rounded-[10px] text-[14px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
                        service.providerId === user?.id
                          ? 'bg-[#E8E6E0] text-[#5C6862] cursor-not-allowed'
                          : 'bg-[#2F5D50] hover:bg-[#264D42] text-white'
                      }`}
                    >
                      {service.providerId === user?.id ? 'Your listing' : 'Book'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1E2622]">
                {user?.isPeerProvider ? 'Bookings & Tutoring Requests' : 'Your bookings'}
              </h2>
              <p className="text-[13px] text-[#5C6862] mt-0.5">
                {user?.isPeerProvider
                  ? 'Manage requests received for your skills and classes you have booked'
                  : 'Track your scheduled campus services and physical arrival handshake codes'}
              </p>
            </div>
            <button
              onClick={fetchBookings}
              className="text-[#2F5D50] hover:underline text-[13px] font-medium cursor-pointer self-start sm:self-auto"
            >
              Refresh
            </button>
          </div>

          {/* Peer Action Feedback Notification */}
          {peerActionMessage.text && (
            <div className="p-3.5 rounded-[10px] bg-white border border-[#E8E6E0] text-[13px] text-[#1E2622] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    peerActionMessage.type === 'success' ? 'bg-[#3F8A6B]' : 'bg-[#C48A2A]'
                  }`}
                />
                <span>{peerActionMessage.text}</span>
              </div>
              <button
                onClick={() => setPeerActionMessage({ text: '', type: '' })}
                className="text-[#5C6862] hover:text-[#1E2622] text-[13px] cursor-pointer ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Peer Provider Sub-navigation Pills */}
          {user?.isPeerProvider && (
            <div className="flex items-center gap-2 border-b border-[#E8E6E0] pb-2">
              <button
                onClick={() => setBookingSubTab('received')}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bookingSubTab === 'received'
                    ? 'bg-[#2F5D50] text-white'
                    : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#F7F6F2]'
                }`}
              >
                <span>Requests received</span>
                {receivedRequests.length > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      bookingSubTab === 'received' ? 'bg-white/20 text-white' : 'bg-[#E6EEEA] text-[#2F5D50]'
                    }`}
                  >
                    {receivedRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setBookingSubTab('booked_by_me')}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  bookingSubTab === 'booked_by_me'
                    ? 'bg-[#2F5D50] text-white'
                    : 'bg-white border border-[#E8E6E0] text-[#1E2622] hover:bg-[#F7F6F2]'
                }`}
              >
                <span>Booked by me</span>
                {myBookedServices.length > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      bookingSubTab === 'booked_by_me' ? 'bg-white/20 text-white' : 'bg-[#E6EEEA] text-[#2F5D50]'
                    }`}
                  >
                    {myBookedServices.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* VIEW A: PEER TUTOR / PROVIDER REQUESTS RECEIVED */}
          {user?.isPeerProvider && bookingSubTab === 'received' && (
            <div>
              {loadingBookings ? (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
                  Loading received requests...
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
                  No incoming booking requests yet. When students or residents book your listed services, they will appear here.
                </div>
              ) : (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
                  {receivedRequests.map((booking) => (
                    <div key={booking.id} className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-[12px] text-[#5C6862]">
                            Ref #{booking.id} · {booking.serviceCategory}
                          </div>
                          <div className="text-[16px] font-semibold text-[#1E2622] mt-0.5">
                            {booking.serviceTitle}
                          </div>
                        </div>
                        <div>{renderStatus(booking.status)}</div>
                      </div>

                      <div className="text-[14px] text-[#5C6862] flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span>
                          Student: <strong className="font-medium text-[#1E2622]">{cleanName(booking.residentName)}</strong>
                        </span>
                        <span>
                          Unit: <span className="text-[#1E2622]">{booking.residentFlat}</span>
                        </span>
                        {booking.residentPhone && (
                          <span>Phone: <span className="text-[#1E2622]">{booking.residentPhone}</span></span>
                        )}
                        <span>
                          Session fee: <strong className="font-semibold text-[#1E2622]">₹{booking.basePrice}</strong>
                        </span>
                      </div>

                      {booking.notes && (
                        <div className="text-[13px] text-[#5C6862] bg-[#F7F6F2] p-3 rounded-[8px] border border-[#E8E6E0]">
                          <span className="font-medium text-[#1E2622]">Student note:</span> {booking.notes}
                        </div>
                      )}

                      {/* State 1: REQUESTED -> Peer Tutor can Accept */}
                      {booking.status === 'REQUESTED' && (
                        <div className="bg-[#FAF9F5] border border-[#E8E6E0] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-[13px] text-[#5C6862]">
                            <strong className="text-[#1E2622] font-medium">{cleanName(booking.residentName)}</strong> has requested this class. Accept to confirm your availability.
                          </div>
                          <button
                            onClick={() => handleAcceptBooking(booking.id)}
                            disabled={processingId === booking.id}
                            className="bg-[#2F5D50] hover:bg-[#264D42] text-white rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer shrink-0"
                          >
                            {processingId === booking.id ? 'Accepting...' : 'Accept Request'}
                          </button>
                        </div>
                      )}

                      {/* State 2: ACCEPTED -> Peer Tutor arrives at resident and verifies Handshake OTP */}
                      {booking.status === 'ACCEPTED' && (
                        <div className="bg-[#E6EEEA] border border-[#E8E6E0] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-[13px] font-medium text-[#1E2622]">
                              Verify Physical Handshake OTP
                            </div>
                            <div className="text-[12px] text-[#5C6862] mt-0.5">
                              Ask {cleanName(booking.residentName)} at {booking.residentFlat} for the 4-digit code displayed on their portal.
                            </div>
                            {otpErrors[booking.id] && (
                              <div className="text-[12px] text-rose-700 font-medium mt-1">
                                {otpErrors[booking.id]}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="4-digit OTP"
                              value={otpInputs[booking.id] || ''}
                              onChange={(e) =>
                                setOtpInputs({
                                  ...otpInputs,
                                  [booking.id]: e.target.value.replace(/\D/g, ''),
                                })
                              }
                              className="w-28 text-center text-[18px] tracking-widest font-semibold bg-white border border-[#E8E6E0] rounded-[8px] px-2 py-1.5 focus:outline-none focus:border-[#2F5D50]"
                            />
                            <button
                              onClick={() => handleVerifyStart(booking.id)}
                              disabled={processingId === booking.id || (otpInputs[booking.id] || '').length !== 4}
                              className="bg-[#2F5D50] hover:bg-[#264D42] text-white disabled:bg-[#E8E6E0] disabled:text-[#5C6862] rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer"
                            >
                              {processingId === booking.id ? 'Verifying...' : 'Verify & Start'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State 3: IN_PROGRESS -> Peer Tutor conducts class and marks complete */}
                      {booking.status === 'IN_PROGRESS' && (
                        <div className="bg-[#FAF9F5] border border-[#E8E6E0] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-[13px] text-[#5C6862] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4A6FA5]" />
                            <span>Tutoring session is currently underway.</span>
                          </div>
                          <button
                            onClick={() => handleCompleteBooking(booking.id)}
                            disabled={processingId === booking.id}
                            className="bg-[#2F5D50] hover:bg-[#264D42] text-white rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer shrink-0"
                          >
                            {processingId === booking.id ? 'Completing...' : 'Complete Session'}
                          </button>
                        </div>
                      )}

                      {/* State 4: COMPLETED -> Shows rating/review received */}
                      {booking.status === 'COMPLETED' && (
                        <div className="pt-2 flex items-center justify-between gap-4">
                          {booking.review ? (
                            <div className="text-[13px] text-[#5C6862] flex items-center gap-2">
                              <span className="font-medium text-[#1E2622]">★ {booking.review.rating}.0</span>
                              {booking.review.comment && (
                                <span>· "{booking.review.comment}"</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[13px] text-[#5C6862]">
                              Session finished · Awaiting student feedback
                            </span>
                          )}
                          <span className="text-[12px] text-[#5C6862] ml-auto">
                            {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'Completed'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW B: SERVICES BOOKED BY THIS RESIDENT */}
          {(!user?.isPeerProvider || bookingSubTab === 'booked_by_me') && (
            <div>
              {loadingBookings ? (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
                  Loading your bookings...
                </div>
              ) : myBookedServices.length === 0 ? (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] p-12 text-center text-[#5C6862] text-[14px]">
                  No bookings yet. Browse the services tab to schedule trusted campus help.
                </div>
              ) : (
                <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
                  {myBookedServices.map((booking) => (
                    <div key={booking.id} className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-[12px] text-[#5C6862]">
                            Ref #{booking.id} · {booking.serviceCategory}
                          </div>
                          <div className="text-[16px] font-semibold text-[#1E2622] mt-0.5">
                            {booking.serviceTitle}
                          </div>
                        </div>
                        <div>{renderStatus(booking.status)}</div>
                      </div>

                      <div className="text-[14px] text-[#5C6862] flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span>
                          Provider: <strong className="font-medium text-[#1E2622]">{cleanName(booking.providerName)}</strong>
                        </span>
                        <span>
                          Unit: <span className="text-[#1E2622]">{booking.providerFlat}</span>
                        </span>
                        {booking.providerPhone && (
                          <span>Phone: <span className="text-[#1E2622]">{booking.providerPhone}</span></span>
                        )}
                        <span>
                          Fee: <strong className="font-semibold text-[#1E2622]">₹{booking.basePrice}</strong>
                        </span>
                      </div>

                      {booking.notes && (
                        <div className="text-[13px] text-[#5C6862] bg-[#F7F6F2] p-3 rounded-[8px] border border-[#E8E6E0]">
                          <span className="font-medium text-[#1E2622]">Note:</span> {booking.notes}
                        </div>
                      )}

                      {/* Handshake OTP for requested / accepted bookings */}
                      {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
                        <div className="bg-[#E6EEEA] border border-[#E8E6E0] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-[13px] font-medium text-[#1E2622]">
                              Handshake verification code
                            </div>
                            <div className="text-[12px] text-[#5C6862] mt-0.5">
                              Share this 4-digit code with {cleanName(booking.providerName)} upon arrival to start work.
                            </div>
                          </div>
                          <div className="bg-white border border-[#E8E6E0] rounded-[8px] px-4 py-2 text-center shrink-0">
                            <span className="text-[20px] font-semibold text-[#1E2622] tracking-widest">
                              {booking.verificationOtp}
                            </span>
                          </div>
                        </div>
                      )}

                      {booking.status === 'IN_PROGRESS' && (
                        <div className="text-[13px] text-[#5C6862] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#4A6FA5]" />
                          <span>Work is currently underway.</span>
                        </div>
                      )}

                      {/* Reviews if Completed */}
                      {booking.status === 'COMPLETED' && (
                        <div className="pt-2 flex items-center justify-between gap-4">
                          {booking.review ? (
                            <div className="text-[13px] text-[#5C6862] flex items-center gap-2">
                              <span className="font-medium text-[#1E2622]">★ {booking.review.rating}.0</span>
                              {booking.review.comment && (
                                <span>· "{booking.review.comment}"</span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenReviewModal(booking)}
                              className="bg-white border border-[#E8E6E0] hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer"
                            >
                              Leave review
                            </button>
                          )}
                          <span className="text-[12px] text-[#5C6862] ml-auto">
                            {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'Completed'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY P2P OFFERINGS */}
      {activeTab === 'p2p' && user?.isPeerProvider && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-[#1E2622]">
                Your listed services
              </h2>
              <p className="text-[14px] text-[#5C6862] mt-0.5">
                Offer academic tutoring, tech help, or community skills to neighbors.
              </p>
            </div>
            <button
              onClick={() => setShowAddP2pModal(true)}
              className="min-h-[44px] h-[44px] px-5 rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer"
            >
              Add service
            </button>
          </div>

          <div className="bg-white border border-[#E8E6E0] rounded-[14px] divide-y divide-[#F3F1EC] overflow-hidden">
            {myP2pServices.length === 0 ? (
              <div className="p-12 text-center text-[#5C6862] text-[14px]">
                You have not listed any peer services yet.
              </div>
            ) : (
              myP2pServices.map((service) => (
                <div key={service.id} className="p-6 flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="text-[12px] font-semibold tracking-wider text-[#5C6862] uppercase">
                      {service.category}
                    </div>
                    <div className="text-[16px] font-semibold text-[#1E2622]">
                      {service.title}
                    </div>
                    <p className="text-[14px] text-[#5C6862]">
                      {service.description}
                    </p>
                    <div className="text-[14px] font-medium text-[#1E2622] pt-1">
                      ₹{service.basePrice}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAvailability(service.id)}
                    className="border border-[#E8E6E0] bg-white hover:bg-[#F7F6F2] text-[#1E2622] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {service.isAvailable ? 'Set offline' : 'Set active'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      <Modal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={bookingSuccessOtp ? "Booking confirmed" : `Book ${selectedService?.title}`}
      >
        {bookingSuccessOtp ? (
          <div className="space-y-5">
            <p className="text-[14px] text-[#5C6862] leading-relaxed">
              Your service request has been dispatched. Share this 4-digit handshake code with the provider when they arrive at your flat.
            </p>
            
            <div className="bg-[#E6EEEA] border border-[#E8E6E0] rounded-[10px] p-6 text-center">
              <div className="text-[12px] text-[#5C6862] font-medium mb-1">
                Handshake OTP
              </div>
              <div className="text-[32px] font-semibold text-[#1E2622] tracking-widest leading-none">
                {bookingSuccessOtp}
              </div>
            </div>

            <button
              onClick={() => { setSelectedService(null); setActiveTab('bookings'); }}
              className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer"
            >
              View in My bookings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            {bookingError && (
              <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
                {bookingError}
              </div>
            )}

            <div className="bg-[#F7F6F2] rounded-[10px] p-4 border border-[#E8E6E0] space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#5C6862]">Service:</span>
                <span className="font-medium text-[#1E2622]">{selectedService?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6862]">Provider:</span>
                <span className="text-[#1E2622]">{cleanName(selectedService?.providerName)} · {selectedService?.providerFlat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6862]">Your flat:</span>
                <span className="text-[#1E2622]">{user?.flatOrRoomNo}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8E6E0] font-semibold">
                <span className="text-[#1E2622]">Base fee:</span>
                <span className="text-[#1E2622]">₹{selectedService?.basePrice}</span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
                Notes for provider (optional)
              </label>
              <textarea
                rows={3}
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Master bedroom fan wobbling, capacitor needs testing."
                className="w-full p-3 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingBooking}
                className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingBooking ? 'Placing booking...' : 'Confirm booking'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* REVIEW MODAL */}
      <Modal
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        title="Leave a review"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {reviewError && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
              {reviewError}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-2">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'text-[#2F5D50] fill-[#2F5D50]'
                        : 'text-[#E8E6E0]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">
              Review notes
            </label>
            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Great work, resolved properly!"
              className="w-full p-3 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submittingReview}
            className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {submittingReview ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </Modal>

      {/* ADD P2P MODAL */}
      <Modal
        isOpen={showAddP2pModal}
        onClose={() => setShowAddP2pModal(false)}
        title="Offer a peer skill"
      >
        <form onSubmit={handleAddP2pService} className="space-y-4">
          {p2pError && (
            <div className="p-3 rounded-[8px] border border-[#E8E6E0] bg-[#F7F6F2] text-rose-700 text-[13px]">
              {p2pError}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Skill title</label>
            <input
              type="text"
              required
              value={p2pTitle}
              onChange={(e) => setP2pTitle(e.target.value)}
              placeholder="e.g. Data Structures & Java peer tutoring (B.Tech / MCA)"
              className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Category</label>
              <select
                value={p2pCategory}
                onChange={(e) => setP2pCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
              >
                <option value="Peer tutoring">Peer tutoring</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Base fee (₹)</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={p2pPrice}
                onChange={(e) => setP2pPrice(e.target.value)}
                placeholder="349"
                className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2622] mb-1.5">Description</label>
            <textarea
              rows={3}
              value={p2pDescription}
              onChange={(e) => setP2pDescription(e.target.value)}
              placeholder="Describe what help you provide, course topics, or availability."
              className="w-full p-3 text-[14px] bg-white border border-[#E8E6E0] rounded-[8px] focus:outline-none focus:border-[#2F5D50] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] h-[44px] rounded-[10px] bg-[#2F5D50] hover:bg-[#264D42] text-white text-[14px] font-medium transition-colors cursor-pointer"
          >
            Publish service
          </button>
        </form>
      </Modal>
    </div>
  );
};
