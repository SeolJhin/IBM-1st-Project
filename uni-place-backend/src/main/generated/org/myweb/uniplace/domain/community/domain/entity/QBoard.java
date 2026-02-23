package org.myweb.uniplace.domain.community.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBoard is a Querydsl query type for Board
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBoard extends EntityPathBase<Board> {

    private static final long serialVersionUID = 615372509L;

    public static final QBoard board = new QBoard("board");

    public final StringPath anonymity = createString("anonymity");

    public final StringPath boardCtnt = createString("boardCtnt");

    public final NumberPath<Integer> boardId = createNumber("boardId", Integer.class);

    public final StringPath boardTitle = createString("boardTitle");

    public final StringPath code = createString("code");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath fileCk = createString("fileCk");

    public final DateTimePath<java.time.LocalDateTime> impEndAt = createDateTime("impEndAt", java.time.LocalDateTime.class);

    public final StringPath importance = createString("importance");

    public final NumberPath<Integer> readCount = createNumber("readCount", Integer.class);

    public final StringPath replyCk = createString("replyCk");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final StringPath userId = createString("userId");

    public QBoard(String variable) {
        super(Board.class, forVariable(variable));
    }

    public QBoard(Path<? extends Board> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBoard(PathMetadata metadata) {
        super(Board.class, metadata);
    }

}

