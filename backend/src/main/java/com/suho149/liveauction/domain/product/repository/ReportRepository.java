package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.entity.Report;
import com.suho149.liveauction.domain.product.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    /**
     * 특정 상태(status)의 모든 신고 내역을 최신순(ID 내림차순)으로 조회합니다.
     * @param status 조회할 신고 처리 상태
     * @return Report 목록
     */
    List<Report> findByStatusOrderByIdDesc(ReportStatus status);

}
