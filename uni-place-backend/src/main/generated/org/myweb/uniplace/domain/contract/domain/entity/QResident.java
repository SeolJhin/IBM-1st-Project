package org.myweb.uniplace.domain.contract.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QResident is a Querydsl query type for Resident
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QResident extends EntityPathBase<Resident> {

    private static final long serialVersionUID = -1143097974L;

    public static final QResident resident = new QResident("resident");

    public final NumberPath<Integer> buildingId = createNumber("buildingId", Integer.class);

    public final NumberPath<Integer> contractId = createNumber("contractId", Integer.class);

    public final NumberPath<Integer> residentId = createNumber("residentId", Integer.class);

    public final StringPath userId = createString("userId");

    public QResident(String variable) {
        super(Resident.class, forVariable(variable));
    }

    public QResident(Path<? extends Resident> path) {
        super(path.getType(), path.getMetadata());
    }

    public QResident(PathMetadata metadata) {
        super(Resident.class, metadata);
    }

}

