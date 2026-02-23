package org.myweb.uniplace.domain.community.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReply is a Querydsl query type for Reply
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReply extends EntityPathBase<Reply> {

    private static final long serialVersionUID = 629865185L;

    public static final QReply reply = new QReply("reply");

    public final NumberPath<Integer> boardId = createNumber("boardId", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> parentId = createNumber("parentId", Integer.class);

    public final StringPath replyCtnt = createString("replyCtnt");

    public final NumberPath<Integer> replyId = createNumber("replyId", Integer.class);

    public final NumberPath<Integer> replyLev = createNumber("replyLev", Integer.class);

    public final NumberPath<Integer> replySeq = createNumber("replySeq", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final StringPath userId = createString("userId");

    public QReply(String variable) {
        super(Reply.class, forVariable(variable));
    }

    public QReply(Path<? extends Reply> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReply(PathMetadata metadata) {
        super(Reply.class, metadata);
    }

}

