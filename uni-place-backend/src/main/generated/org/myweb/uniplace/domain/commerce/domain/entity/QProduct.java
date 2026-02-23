package org.myweb.uniplace.domain.commerce.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProduct is a Querydsl query type for Product
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProduct extends EntityPathBase<Product> {

    private static final long serialVersionUID = -99622274L;

    public static final QProduct product = new QProduct("product");

    public final NumberPath<Integer> affiliateId = createNumber("affiliateId", Integer.class);

    public final StringPath code = createString("code");

    public final StringPath prodDesc = createString("prodDesc");

    public final NumberPath<Integer> prodId = createNumber("prodId", Integer.class);

    public final StringPath prodNm = createString("prodNm");

    public final NumberPath<java.math.BigDecimal> prodPrice = createNumber("prodPrice", java.math.BigDecimal.class);

    public final EnumPath<org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus> prodSt = createEnum("prodSt", org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus.class);

    public final NumberPath<Integer> prodStock = createNumber("prodStock", Integer.class);

    public QProduct(String variable) {
        super(Product.class, forVariable(variable));
    }

    public QProduct(Path<? extends Product> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProduct(PathMetadata metadata) {
        super(Product.class, metadata);
    }

}

