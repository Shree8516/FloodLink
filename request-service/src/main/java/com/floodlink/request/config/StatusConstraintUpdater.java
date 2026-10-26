// Keeps the database's list of allowed statuses in step with the RequestStatus enum.
// Hibernate (ddl-auto=update) adds new columns by itself, but it never changes the CHECK constraint it created
// for the "status" column on the first run. Databases created before MERGED existed would reject merged
// requests, so at startup we rebuild that constraint from RequestStatus.values(). Safe to run every time.
package com.floodlink.request.config;

import com.floodlink.request.model.RequestStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
public class StatusConstraintUpdater implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StatusConstraintUpdater.class);
    private static final String CONSTRAINT = "help_requests_status_check";

    private final JdbcTemplate jdbcTemplate;

    public StatusConstraintUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // e.g. 'OPEN', 'CLAIMED', 'RESOLVED', 'MERGED'
        String allowed = Arrays.stream(RequestStatus.values())
                .map(status -> "'" + status.name() + "'")
                .collect(Collectors.joining(", "));
        try {
            jdbcTemplate.execute("ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS " + CONSTRAINT);
            jdbcTemplate.execute("ALTER TABLE help_requests ADD CONSTRAINT " + CONSTRAINT
                    + " CHECK (status IN (" + allowed + "))");
        } catch (DataAccessException e) {
            // Not fatal: the enum still guards the values; only merging could fail on an old database
            log.warn("Could not update {}: {}", CONSTRAINT, e.getMessage());
        }
    }
}
