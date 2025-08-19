package com.insta.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder

public class FollowRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requester_id")
    @JsonIgnoreProperties("requestedfollows")
    private User requester;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_id")
    @JsonIgnoreProperties("followrequests")
    private User target;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    public enum RequestStatus {
        PENDING, ACCEPTED, REJECTED
    }
}
