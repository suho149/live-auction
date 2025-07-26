package com.suho149.liveauction.domain.product.repository;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

import static com.suho149.liveauction.domain.product.entity.QProduct.product;
import static org.springframework.util.StringUtils.hasText;

public class ProductRepositoryImpl implements ProductRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    public ProductRepositoryImpl(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    @Override
    public Page<Product> search(ProductSearchCondition condition, Pageable pageable) {

        // 데이터 목록을 가져오는 쿼리
        JPAQuery<Product> query = queryFactory
                .selectFrom(product)
                .join(product.seller).fetchJoin()
                .where(
                        keywordContains(condition.getKeyword()),
                        categoryEq(condition.getCategory()),
                        priceGoe(condition.getMinPrice()),
                        priceLoe(condition.getMaxPrice()),
                        statusIn(condition.getStatuses())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize());

        // 동적 정렬 조건 추가 (핵심 수정)
        for (Sort.Order o : pageable.getSort()) {
            PathBuilder pathBuilder = new PathBuilder(product.getType(), product.getMetadata());
            query.orderBy(new OrderSpecifier(o.isAscending() ? Order.ASC : Order.DESC,
                    pathBuilder.get(o.getProperty())));
        }

        // 기본 정렬 조건 추가 (정렬 조건이 없을 경우 대비)
        query.orderBy(product.id.desc());

        List<Product> content = query.fetch();

        // 전체 카운트를 계산하는 쿼리
        JPAQuery<Long> countQuery = queryFactory
                .select(product.count())
                .from(product)
                .where(
                        keywordContains(condition.getKeyword()),
                        categoryEq(condition.getCategory()),
                        priceGoe(condition.getMinPrice()),
                        priceLoe(condition.getMaxPrice()),
                        statusIn(condition.getStatuses())
                );

        Long total = countQuery.fetchOne();
        long totalCount = total == null ? 0 : total;

        return new PageImpl<>(content, pageable, totalCount);
    }

    // --- 동적 where절을 위한 private 메소드들 ---
    private BooleanExpression keywordContains(String keyword) {
        if (!hasText(keyword)) {
            return null;
        }
        // name은 VARCHAR이므로 containsIgnoreCase (lower() 사용)가 효율적
        // description은 CLOB/TEXT이므로 단순 like 검색을 사용
        return product.name.containsIgnoreCase(keyword)
                .or(product.description.like("%" + keyword + "%"));
    }

    private BooleanExpression categoryEq(Category category) {
        return category != null && category != Category.ALL ? product.category.eq(category) : null;
    }

    private BooleanExpression priceGoe(Long minPrice) { // goe = Greater Than or Equal
        return minPrice != null ? product.currentPrice.goe(minPrice) : null;
    }

    private BooleanExpression priceLoe(Long maxPrice) { // loe = Less Than or Equal
        return maxPrice != null ? product.currentPrice.loe(maxPrice) : null;
    }

    private BooleanExpression statusIn(List<ProductStatus> statuses) {
        return statuses != null && !statuses.isEmpty() ? product.status.in(statuses) : null;
    }
}