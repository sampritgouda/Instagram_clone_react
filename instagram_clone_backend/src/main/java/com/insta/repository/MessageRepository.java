package com.insta.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.insta.model.Message;
import com.insta.model.User;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :u1 AND m.recipient.id = :u2) OR (m.sender.id = :u2 AND m.recipient.id = :u1) ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT DISTINCT m.recipient FROM Message m WHERE m.sender.id = :uid")
    List<User> findRecipientsBySenderId(@Param("uid") Long uid);

    @Query("SELECT DISTINCT m.sender FROM Message m WHERE m.recipient.id = :uid")
    List<User> findSendersByRecipientId(@Param("uid") Long uid);
}
