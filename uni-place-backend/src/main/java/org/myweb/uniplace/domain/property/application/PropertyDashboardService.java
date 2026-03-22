package org.myweb.uniplace.domain.property.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.property.api.dto.response.PropertyDashboardResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.property.repository.SpaceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyDashboardService {

    private final RoomRepository roomRepository;
    private final SpaceRepository spaceRepository;
    private final BuildingRepository buildingRepository;

    public PropertyDashboardResponse getDashboard(Integer buildingId) {

        int available = roomRepository.countByStatusAndBuilding(RoomStatus.available, buildingId);
        int reserved = roomRepository.countByStatusAndBuilding(RoomStatus.reserved, buildingId);
        int contracted = roomRepository.countByStatusAndBuilding(RoomStatus.contracted, buildingId);
        int repair = roomRepository.countByStatusAndBuilding(RoomStatus.repair, buildingId);
        int cleaning = roomRepository.countByStatusAndBuilding(RoomStatus.cleaning, buildingId);

        int spaceCount = spaceRepository.countByBuilding_BuildingId(buildingId);

        int total = available + reserved + contracted + repair + cleaning;

        double occupancy = total == 0 ? 0 : ((double) contracted / total) * 100;
        double vacancy = 100 - occupancy;

        List<PropertyDashboardResponse.BuildingSimple> buildings =
                buildingRepository.findAll().stream()
                        .map(b -> PropertyDashboardResponse.BuildingSimple.builder()
                                .id(b.getBuildingId())
                                .name(b.getBuildingNm())
                                .build())
                        .toList();

        return PropertyDashboardResponse.builder()
                .summary(PropertyDashboardResponse.Summary.builder()
                        .totalRooms(total)
                        .totalSpaces(spaceCount)
                        .build())
                .roomStats(PropertyDashboardResponse.RoomStats.builder()
                        .available(available)
                        .reserved(reserved)
                        .contracted(contracted)
                        .repair(repair)
                        .cleaning(cleaning)
                        .build())
                .spaceCount(spaceCount)
                .rate(PropertyDashboardResponse.Rate.builder()
                        .occupancy(occupancy)
                        .vacancy(vacancy)
                        .build())
                .buildings(buildings)
                .build();
    }
}