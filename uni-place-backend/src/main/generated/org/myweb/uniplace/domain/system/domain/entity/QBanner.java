package org.myweb.uniplace.domain.system.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBanner is a Querydsl query type for Banner
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBanner extends EntityPathBase<Banner> {

    private static final long serialVersionUID = 1469746217L;

    public static final QBanner banner = new QBanner("banner");

    public final NumberPath<Integer> banId = createNumber("banId", Integer.class);

    public final NumberPath<Integer> banOrder = createNumber("banOrder", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.system.domain.enums.BannerStatus> banSt = createEnum("banSt", org.myweb.uniplace.domain.system.domain.enums.BannerStatus.class);

    public final StringPath banTitle = createString("banTitle");

    public final StringPath banUrl = createString("banUrl");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> endAt = createDateTime("endAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> startAt = createDateTime("startAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QBanner(String variable) {
        super(Banner.class, forVariable(variable));
    }

    public QBanner(Path<? extends Banner> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBanner(PathMetadata metadata) {
        super(Banner.class, metadata);
    }

}

