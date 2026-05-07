CREATE TABLE tasks (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(50)  NOT NULL,
    description   VARCHAR(200),
    priority      VARCHAR(10)  NOT NULL,
    due_date      DATE,
    status        VARCHAR(20)  NOT NULL,
    display_order INT          NOT NULL,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL
);
