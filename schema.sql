DROP TABLE IF EXISTS location;

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(300),
    formatted_query  VARCHAR(300),
    latitude VARCHAR(300),
    longitude VARCHAR(300)
);