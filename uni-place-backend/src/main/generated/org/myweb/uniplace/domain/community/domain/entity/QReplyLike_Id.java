package org.myweb.uniplace.domain.community.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReplyLike_Id is a Querydsl query type for Id
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QReplyLike_Id extends BeanPath<ReplyLike.Id> {

    private static final long serialVersionUID = 193534161L;

    public static final QReplyLike_Id id = new QReplyLike_Id("id");

    public final NumberPath<Integer> replyId = createNumber("replyId", Integer.class);

    public final StringPath userId = createString("userId");

    public QReplyLike_Id(String variable) {
        super(ReplyLike.Id.class, forVariable(variable));
    }

    public QReplyLike_Id(Path<? extends ReplyLike.Id> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReplyLike_Id(PathMetadata metadata) {
        super(ReplyLike.Id.class, metadata);
    }

}

