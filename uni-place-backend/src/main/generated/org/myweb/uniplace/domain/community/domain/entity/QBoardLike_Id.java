package org.myweb.uniplace.domain.community.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBoardLike_Id is a Querydsl query type for Id
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QBoardLike_Id extends BeanPath<BoardLike.Id> {

    private static final long serialVersionUID = 87165269L;

    public static final QBoardLike_Id id = new QBoardLike_Id("id");

    public final NumberPath<Integer> boardId = createNumber("boardId", Integer.class);

    public final StringPath userId = createString("userId");

    public QBoardLike_Id(String variable) {
        super(BoardLike.Id.class, forVariable(variable));
    }

    public QBoardLike_Id(Path<? extends BoardLike.Id> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBoardLike_Id(PathMetadata metadata) {
        super(BoardLike.Id.class, metadata);
    }

}

