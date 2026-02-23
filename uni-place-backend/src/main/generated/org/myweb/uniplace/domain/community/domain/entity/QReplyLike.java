package org.myweb.uniplace.domain.community.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReplyLike is a Querydsl query type for ReplyLike
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReplyLike extends EntityPathBase<ReplyLike> {

    private static final long serialVersionUID = 537183768L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReplyLike replyLike = new QReplyLike("replyLike");

    public final QReplyLike_Id id;

    public QReplyLike(String variable) {
        this(ReplyLike.class, forVariable(variable), INITS);
    }

    public QReplyLike(Path<? extends ReplyLike> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReplyLike(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReplyLike(PathMetadata metadata, PathInits inits) {
        this(ReplyLike.class, metadata, inits);
    }

    public QReplyLike(Class<? extends ReplyLike> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.id = inits.isInitialized("id") ? new QReplyLike_Id(forProperty("id")) : null;
    }

}

