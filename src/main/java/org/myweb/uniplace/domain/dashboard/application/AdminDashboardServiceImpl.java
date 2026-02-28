package org.myweb.uniplace.domain.dashboard.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.dashboard.api.dto.response.AdminDashboardResponse;
import org.myweb.uniplace.domain.property.repository.SpaceRepository;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.myweb.uniplace.domain.system.repository.BannerRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final TourReservationRepository tourReservationRepository;
    private final ContractRepository contractRepository;
    private final BannerRepository bannerRepository;
    private final RoomServiceOrderRepository roomServiceOrderRepository;

    @Override
    public AdminDashboardResponse getDashboard() {
        return new AdminDashboardResponse(
            userRepository.count(),
            spaceRepository.count(),
            tourReservationRepository.count(),
            contractRepository.count(),
            bannerRepository.count(),
            roomServiceOrderRepository.count()
        );
    }
}

