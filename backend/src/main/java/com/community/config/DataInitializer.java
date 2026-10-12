package com.community.config;

import com.community.entity.*;
import com.community.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (communityRepository.count() > 0) {
            log.info("Database already initialized. Skipping seed data generation.");
            return;
        }

        log.info("Initializing Seed Data for Shantiniketan Heights & Campus Residency...");

        // 1. Seed Community (Indian Society & Campus Enclave)
        Community community = communityRepository.save(Community.builder()
                .name("Shantiniketan Heights & Campus Residency")
                .passcode("CAMPUS2026")
                .build());

        String defaultEncodedPassword = passwordEncoder.encode("password123");

        // 2. Seed Users (Indian Personas)
        User admin = userRepository.save(User.builder()
                .community(community)
                .name("Vikramaditya Singhania (Estate Manager)")
                .email("admin@test.com")
                .password(defaultEncodedPassword)
                .phone("+91 98001 12233")
                .flatOrRoomNo("Clubhouse Office-01")
                .role(Role.ROLE_ADMIN)
                .isPeerProvider(false)
                .isApproved(true)
                .build());

        User resident = userRepository.save(User.builder()
                .community(community)
                .name("Priya Sharma")
                .email("resident@test.com")
                .password(defaultEncodedPassword)
                .phone("+91 98765 43210")
                .flatOrRoomNo("Tower B-402")
                .role(Role.ROLE_RESIDENT)
                .isPeerProvider(false)
                .isApproved(true)
                .build());

        User provider = userRepository.save(User.builder()
                .community(community)
                .name("Ramesh Kumar (Society Electrician & Plumber)")
                .email("provider@test.com")
                .password(defaultEncodedPassword)
                .phone("+91 98123 45678")
                .flatOrRoomNo("Staff Quarter 12")
                .role(Role.ROLE_PROVIDER)
                .isPeerProvider(false)
                .isApproved(true)
                .build());

        User peerProvider = userRepository.save(User.builder()
                .community(community)
                .name("Aarav Verma (DSA & Java Peer Tutor)")
                .email("peer@test.com")
                .password(defaultEncodedPassword)
                .phone("+91 97654 32109")
                .flatOrRoomNo("Wing A-102")
                .role(Role.ROLE_RESIDENT)
                .isPeerProvider(true)
                .isApproved(true)
                .build());

        // 3. Seed Services (Priced in Indian Rupees ₹)
        ServiceEntity fanRepair = serviceRepository.save(ServiceEntity.builder()
                .community(community)
                .provider(provider)
                .category("Electrical")
                .title("Ceiling Fan Repair & Capacitor Fix (Havells/Crompton)")
                .description("Diagnostic check, capacitor replacement, bearing lubrication, and secure ceiling mount inspection.")
                .basePrice(new BigDecimal("199.00"))
                .isAvailable(true)
                .build());

        ServiceEntity pipeFix = serviceRepository.save(ServiceEntity.builder()
                .community(community)
                .provider(provider)
                .category("Plumbing")
                .title("RO Water Purifier & Sink Tap Leak Fix (Kent/Aquaguard)")
                .description("Emergency repair of leaky sinks, valve replacements, and RO filter servicing within 30 minutes.")
                .basePrice(new BigDecimal("249.00"))
                .isAvailable(true)
                .build());

        ServiceEntity tutoring = serviceRepository.save(ServiceEntity.builder()
                .community(community)
                .provider(peerProvider)
                .category("Peer Tutoring")
                .title("Data Structures & Java Peer Tutoring (B.Tech / MCA)")
                .description("1-on-1 personalized tutoring on trees, dynamic programming, sorting, and Spring Boot project debugging.")
                .basePrice(new BigDecimal("349.00"))
                .isAvailable(true)
                .build());

        ServiceEntity deepClean = serviceRepository.save(ServiceEntity.builder()
                .community(community)
                .provider(provider)
                .category("Cleaning")
                .title("Full Flat & Kitchen Deep Sanitization")
                .description("Thorough floor scrubbing, sanitization, balcony cleaning, and kitchen tile degreasing.")
                .basePrice(new BigDecimal("799.00"))
                .isAvailable(true)
                .build());

        // 4. Seed Bookings
        // Booking 1: REQUESTED status (OTP: 1234)
        bookingRepository.save(Booking.builder()
                .community(community)
                .resident(resident)
                .provider(provider)
                .service(fanRepair)
                .status(BookingStatus.REQUESTED)
                .verificationOtp("1234")
                .otpAttempts(0)
                .notes("Master bedroom Havells fan is wobbling and speed regulator is unresponsive.")
                .build());

        // Booking 2: IN_PROGRESS status (OTP: 4821)
        bookingRepository.save(Booking.builder()
                .community(community)
                .resident(resident)
                .provider(peerProvider)
                .service(tutoring)
                .status(BookingStatus.IN_PROGRESS)
                .verificationOtp("4821")
                .otpAttempts(1)
                .notes("Reviewing Binary Search Trees and Graph Traversals for end-sem lab exam.")
                .startedAt(LocalDateTime.now().minusMinutes(45))
                .build());

        // Booking 3: COMPLETED status with Review
        Booking completedBooking = bookingRepository.save(Booking.builder()
                .community(community)
                .resident(resident)
                .provider(provider)
                .service(pipeFix)
                .status(BookingStatus.COMPLETED)
                .verificationOtp("9012")
                .otpAttempts(1)
                .notes("Kent RO purifier under-counter pipe was leaking water in kitchen.")
                .startedAt(LocalDateTime.now().minusHours(3))
                .completedAt(LocalDateTime.now().minusHours(2))
                .build());

        reviewRepository.save(Review.builder()
                .booking(completedBooking)
                .rating(5)
                .comment("Ramesh bhaiya fixed the leaky valve in under 15 minutes! Very courteous and tidy cleanup.")
                .build());

        log.info("Seed data generation for Shantiniketan Heights completed successfully!");
    }
}
