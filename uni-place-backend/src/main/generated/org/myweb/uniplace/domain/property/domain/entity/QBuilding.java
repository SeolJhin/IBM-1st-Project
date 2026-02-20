package org.myweb.uniplace.domain.property.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QBuilding is a Querydsl query type for Building
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBuilding extends EntityPathBase<Building> {

    private static final long serialVersionUID = -591789365L;

    public static final QBuilding building = new QBuilding("building");

    public final org.myweb.uniplace.global.common.QBaseTimeEntity _super = new org.myweb.uniplace.global.common.QBaseTimeEntity(this);

    public final StringPath buildingAddr = createString("buildingAddr");

    public final StringPath buildingDesc = createString("buildingDesc");

    public final NumberPath<Integer> buildingId = createNumber("buildingId", Integer.class);

    public final StringPath buildingNm = createString("buildingNm");

    public final StringPath buildingUsage = createString("buildingUsage");

    public final NumberPath<java.math.BigDecimal> buildSize = createNumber("buildSize", java.math.BigDecimal.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath existElv = createString("existElv");

    public final StringPath landCategory = createString("landCategory");

    public final NumberPath<Integer> parkingCapacity = createNumber("parkingCapacity", Integer.class);

    public final ListPath<Room, QRoom> rooms = this.<Room, QRoom>createList("rooms", Room.class, QRoom.class, PathInits.DIRECT2);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QBuilding(String variable) {
        super(Building.class, forVariable(variable));
    }

    public QBuilding(Path<? extends Building> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBuilding(PathMetadata metadata) {
        super(Building.class, metadata);
    }

}

