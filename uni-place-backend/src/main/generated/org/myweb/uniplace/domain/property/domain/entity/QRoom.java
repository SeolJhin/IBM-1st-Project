package org.myweb.uniplace.domain.property.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRoom is a Querydsl query type for Room
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoom extends EntityPathBase<Room> {

    private static final long serialVersionUID = -756607886L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRoom room = new QRoom("room");

    public final QBuilding building;

    public final NumberPath<java.math.BigDecimal> deposit = createNumber("deposit", java.math.BigDecimal.class);

    public final NumberPath<Integer> floor = createNumber("floor", Integer.class);

    public final NumberPath<java.math.BigDecimal> manageFee = createNumber("manageFee", java.math.BigDecimal.class);

    public final NumberPath<Integer> rentMin = createNumber("rentMin", Integer.class);

    public final NumberPath<java.math.BigDecimal> rentPrice = createNumber("rentPrice", java.math.BigDecimal.class);

    public final EnumPath<org.myweb.uniplace.domain.property.domain.enums.RentType> rentType = createEnum("rentType", org.myweb.uniplace.domain.property.domain.enums.RentType.class);

    public final NumberPath<Integer> roomCapacity = createNumber("roomCapacity", Integer.class);

    public final StringPath roomDesc = createString("roomDesc");

    public final NumberPath<Integer> roomId = createNumber("roomId", Integer.class);

    public final NumberPath<Integer> roomNo = createNumber("roomNo", Integer.class);

    public final StringPath roomOptions = createString("roomOptions");

    public final NumberPath<java.math.BigDecimal> roomSize = createNumber("roomSize", java.math.BigDecimal.class);

    public final EnumPath<org.myweb.uniplace.domain.property.domain.enums.RoomStatus> roomSt = createEnum("roomSt", org.myweb.uniplace.domain.property.domain.enums.RoomStatus.class);

    public final EnumPath<org.myweb.uniplace.domain.property.domain.enums.SunDirection> sunDirection = createEnum("sunDirection", org.myweb.uniplace.domain.property.domain.enums.SunDirection.class);

    public QRoom(String variable) {
        this(Room.class, forVariable(variable), INITS);
    }

    public QRoom(Path<? extends Room> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRoom(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRoom(PathMetadata metadata, PathInits inits) {
        this(Room.class, metadata, inits);
    }

    public QRoom(Class<? extends Room> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.building = inits.isInitialized("building") ? new QBuilding(forProperty("building")) : null;
    }

}

