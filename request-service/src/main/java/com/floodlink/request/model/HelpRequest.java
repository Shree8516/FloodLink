// JPA entity for one call for help (e.g. "family trapped in Velachery"). Stored in the "help_requests" table.
// Created and changed only through HelpRequestService; turned into HelpRequestDto before leaving the API.
package com.floodlink.request.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "help_requests")
public class HelpRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    @Column(nullable = false, length = 500)
    private String description;

    private double latitude;
    private double longitude;

    // "Street, Area" – the part after the last comma is used as the area for stats and the live ticker
    @Column(nullable = false)
    private String address;

    private int peopleCount;
    private String contactName;
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.OPEN;

    // 0-100, calculated by insights-service
    private int priorityScore;

    // The human-readable reasons behind the score, one per line (e.g. "RESCUE request: +40")
    @Column(length = 1000)
    private String priorityReasons;

    // If insights-service thinks this repeats an earlier request, that request's id goes here
    private Long duplicateOfId;

    // Set when this duplicate was merged into another request (status MERGED); the original's id goes here
    private Long mergedIntoId;

    // How many reports describe this incident: 1 for itself, plus every report merged into it.
    // Integer (not int) so the column can be added to an existing table, where old rows start empty (= 1).
    private Integer reportCount = 1;

    // The volunteer who claimed this request (null while OPEN)
    @Embedded
    private ClaimedBy claimedBy;

    // Timeline: posted -> claimed -> resolved. Each step's time is null until it happens.
    private LocalDateTime createdAt;
    private LocalDateTime claimedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime updatedAt;

    // Fills timestamps automatically before the first save (createdAt only if the service hasn't set it)
    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    // Keeps updatedAt correct on every later save (claim, resolve, edit)
    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public RequestType getType() { return type; }
    public void setType(RequestType type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getPeopleCount() { return peopleCount; }
    public void setPeopleCount(int peopleCount) { this.peopleCount = peopleCount; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }

    public String getPriorityReasons() { return priorityReasons; }
    public void setPriorityReasons(String priorityReasons) { this.priorityReasons = priorityReasons; }

    public Long getDuplicateOfId() { return duplicateOfId; }
    public void setDuplicateOfId(Long duplicateOfId) { this.duplicateOfId = duplicateOfId; }

    public Long getMergedIntoId() { return mergedIntoId; }
    public void setMergedIntoId(Long mergedIntoId) { this.mergedIntoId = mergedIntoId; }

    public int getReportCount() { return reportCount == null ? 1 : reportCount; }
    public void setReportCount(int reportCount) { this.reportCount = reportCount; }

    public ClaimedBy getClaimedBy() { return claimedBy; }
    public void setClaimedBy(ClaimedBy claimedBy) { this.claimedBy = claimedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getClaimedAt() { return claimedAt; }
    public void setClaimedAt(LocalDateTime claimedAt) { this.claimedAt = claimedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
