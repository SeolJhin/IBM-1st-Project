package org.myweb.uniplace.domain.property.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QCommonSpace is a Querydsl query type for CommonSpace
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCommonSpace extends EntityPathBase<CommonSpace> {

    private static final long serialVersionUID = 325047908L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QCommonSpace commonSpace = new QCommonSpace("commonSpace");

    public final QBuilding building;

    public final NumberPath<Integer> spaceCapacity = createNumber("spaceCapacity", Integer.class);

    public final StringPath spaceDesc = createString("spaceDesc");

    public final NumberPath<Integer> spaceFloor = createNumber("spaceFloor", Integer.class);

    public final NumberPath<Integer> spaceId = createNumber("spaceId", Integer.class);

    public final StringPath spaceNm = createString("spaceNm");

    public final StringPath spaceOptions = createString("spaceOptions");

    public QCommonSpace(String variable) {
        this(CommonSpace.class, forVariable(variable), INITS);
    }

    public QCommonSpace(Path<? extends CommonSpace> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QCommonSpace(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QCommonSpace(PathMetadata metadata, PathInits inits) {
        this(CommonSpace.class, metadata, inits);
    }

    public QCommonSpace(Class<? extends CommonSpace> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.building = inits.isInitialized("building") ? new QBuilding(forProperty("building")) : null;
    }

}

