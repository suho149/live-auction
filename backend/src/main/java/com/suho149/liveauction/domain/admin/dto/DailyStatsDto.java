package com.suho149.liveauction.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class DailyStatsDto {
    private LocalDate date;
    private Long value;
}
