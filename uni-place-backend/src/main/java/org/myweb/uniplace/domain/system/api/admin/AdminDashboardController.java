package org.myweb.uniplace.domain.system.api.admin;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.property.repository.SpaceRepository;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.myweb.uniplace.domain.system.repository.BannerRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final TourReservationRepository tourReservationRepository;
    private final ContractRepository contractRepository;
    private final BannerRepository bannerRepository;
    private final RoomServiceOrderRepository roomServiceOrderRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Long>> dashboard() {
        Map<String, Long> data = Map.of(
            "residentCount", userRepository.count(),
            "facilityCount", spaceRepository.count(),
            "tourCount", tourReservationRepository.count(),
            "contractCount", contractRepository.count(),
            "bannerViewCount", bannerRepository.count(),
            "roomServiceOrderCount", roomServiceOrderRepository.count()
        );
        return ApiResponse.ok(data);
    }
}
