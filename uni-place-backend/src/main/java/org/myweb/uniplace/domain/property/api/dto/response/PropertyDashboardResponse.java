package org.myweb.uniplace.domain.property.api.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PropertyDashboardResponse {
	private Summary summary;
    private RoomStats roomStats;
    private Integer spaceCount;
    private Rate rate;
    private List<BuildingSimple> buildings;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Summary {
        private Integer totalRooms;
        private Integer totalSpaces;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RoomStats {
        private Integer available;
        private Integer reserved;
        private Integer contracted;
        private Integer repair;
        private Integer cleaning;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Rate {
        private Double occupancy;
        private Double vacancy;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BuildingSimple {
        private Integer id;
        private String name;
    }
}
