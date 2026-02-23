package org.myweb.uniplace.domain.reservation.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTourReservationEntity is a Querydsl query type for TourReservationEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTourReservationEntity extends EntityPathBase<TourReservationEntity> {

    private static final long serialVersionUID = -1231755151L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTourReservationEntity tourReservationEntity = new QTourReservationEntity("tourReservationEntity");

    public final org.myweb.uniplace.domain.property.domain.entity.QBuilding building;

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final org.myweb.uniplace.domain.property.domain.entity.QRoom room;

    public final DateTimePath<java.time.LocalDateTime> tourEndAt = createDateTime("tourEndAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> tourId = createNumber("tourId", Integer.class);

    public final StringPath tourNm = createString("tourNm");

    public final StringPath tourPwd = createString("tourPwd");

    public final EnumPath<org.myweb.uniplace.domain.reservation.domain.enums.TourStatus> tourSt = createEnum("tourSt", org.myweb.uniplace.domain.reservation.domain.enums.TourStatus.class);

    public final DateTimePath<java.time.LocalDateTime> tourStartAt = createDateTime("tourStartAt", java.time.LocalDateTime.class);

    public final StringPath tourTel = createString("tourTel");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QTourReservationEntity(String variable) {
        this(TourReservationEntity.class, forVariable(variable), INITS);
    }

    public QTourReservationEntity(Path<? extends TourReservationEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTourReservationEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTourReservationEntity(PathMetadata metadata, PathInits inits) {
        this(TourReservationEntity.class, metadata, inits);
    }

    public QTourReservationEntity(Class<? extends TourReservationEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.building = inits.isInitialized("building") ? new org.myweb.uniplace.domain.property.domain.entity.QBuilding(forProperty("building")) : null;
        this.room = inits.isInitialized("room") ? new org.myweb.uniplace.domain.property.domain.entity.QRoom(forProperty("room"), inits.get("room")) : null;
    }

}

