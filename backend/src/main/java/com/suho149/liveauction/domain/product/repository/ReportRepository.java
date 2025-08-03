package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.admin.dto.ReportResponse;
import com.suho149.liveauction.domain.product.entity.Report;
import com.suho149.liveauction.domain.product.entity.ReportStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // 처리 대기 목록 조회
    @Query("SELECT r FROM Report r JOIN FETCH r.product p JOIN FETCH r.reporter JOIN FETCH p.seller WHERE r.status = :status ORDER BY r.id DESC")
    List<Report> findByStatusOrderByIdDesc(@Param("status") ReportStatus status);

    // 처리 완료 목록 조회
    @Query("SELECT r FROM Report r JOIN FETCH r.product p JOIN FETCH r.reporter JOIN FETCH p.seller WHERE r.status IN :statuses ORDER BY r.id DESC")
    List<Report> findByStatusInOrderByIdDesc(@Param("statuses") List<ReportStatus> statuses);
}
