package org.myweb.uniplace.domain.reservation.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QSpaceReservationEntity is a Querydsl query type for SpaceReservationEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QSpaceReservationEntity extends EntityPathBase<SpaceReservationEntity> {

    private static final long serialVersionUID = -1391829873L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QSpaceReservationEntity spaceReservationEntity = new QSpaceReservationEntity("spaceReservationEntity");

    public final org.myweb.uniplace.domain.property.domain.entity.QBuilding building;

    public final NumberPath<Integer> reservationId = createNumber("reservationId", Integer.class);

    public final org.myweb.uniplace.domain.property.domain.entity.QCommonSpace space;

    public final DateTimePath<java.time.LocalDateTime> srEndAt = createDateTime("srEndAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> srNoPeople = createNumber("srNoPeople", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus> srSt = createEnum("srSt", org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus.class);

    public final DateTimePath<java.time.LocalDateTime> srStartAt = createDateTime("srStartAt", java.time.LocalDateTime.class);

    public final org.myweb.uniplace.domain.user.domain.entity.QUser user;

    public QSpaceReservationEntity(String variable) {
        this(SpaceReservationEntity.class, forVariable(variable), INITS);
    }

    public QSpaceReservationEntity(Path<? extends SpaceReservationEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QSpaceReservationEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QSpaceReservationEntity(PathMetadata metadata, PathInits inits) {
        this(SpaceReservationEntity.class, metadata, inits);
    }

    public QSpaceReservationEntity(Class<? extends SpaceReservationEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.building = inits.isInitialized("building") ? new org.myweb.uniplace.domain.property.domain.entity.QBuilding(forProperty("building")) : null;
        this.space = inits.isInitialized("space") ? new org.myweb.uniplace.domain.property.domain.entity.QCommonSpace(forProperty("space"), inits.get("space")) : null;
        this.user = inits.isInitialized("user") ? new org.myweb.uniplace.domain.user.domain.entity.QUser(forProperty("user")) : null;
    }

}

