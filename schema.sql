DROP TABLE IF EXISTS searchLoction;

CREATE TABLE searchLoction (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query  VARCHAR(255),
    latitude numeric ,
    longitude numeric 
);