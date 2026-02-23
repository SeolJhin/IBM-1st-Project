package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QServiceGoods is a Querydsl query type for ServiceGoods
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QServiceGoods extends EntityPathBase<ServiceGoods> {

    private static final long serialVersionUID = 38616653L;

    public static final QServiceGoods serviceGoods = new QServiceGoods("serviceGoods");

    public final NumberPath<Integer> displayOrder = createNumber("displayOrder", Integer.class);

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    public final StringPath serviceGoodsCd = createString("serviceGoodsCd");

    public final NumberPath<Integer> serviceGoodsId = createNumber("serviceGoodsId", Integer.class);

    public final StringPath serviceGoodsNm = createString("serviceGoodsNm");

    public QServiceGoods(String variable) {
        super(ServiceGoods.class, forVariable(variable));
    }

    public QServiceGoods(Path<? extends ServiceGoods> path) {
        super(path.getType(), path.getMetadata());
    }

    public QServiceGoods(PathMetadata metadata) {
        super(ServiceGoods.class, metadata);
    }

}

