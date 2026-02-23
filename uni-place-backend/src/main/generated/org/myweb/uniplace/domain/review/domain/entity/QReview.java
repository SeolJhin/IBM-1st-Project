package org.myweb.uniplace.domain.review.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReview is a Querydsl query type for Review
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReview extends EntityPathBase<Review> {

    private static final long serialVersionUID = 244417228L;

    public static final QReview review = new QReview("review");

    public final StringPath code = createString("code");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath fileCk = createString("fileCk");

    public final NumberPath<Integer> rating = createNumber("rating", Integer.class);

    public final StringPath replyCk = createString("replyCk");

    public final StringPath reviewCtnt = createString("reviewCtnt");

    public final NumberPath<Integer> reviewId = createNumber("reviewId", Integer.class);

    public final StringPath reviewTitle = createString("reviewTitle");

    public final NumberPath<Integer> roomId = createNumber("roomId", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final StringPath userId = createString("userId");

    public QReview(String variable) {
        super(Review.class, forVariable(variable));
    }

    public QReview(Path<? extends Review> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReview(PathMetadata metadata) {
        super(Review.class, metadata);
    }

}

