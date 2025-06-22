FROM postgres:17-alpine

RUN apt-get update \
   && apt-get install -y postgresql-17-cron \
   && rm -rf /var/lib/apt/lists*

CMD ["postgres", "-c", "shared_preload_libraries=pg_cron", "-c", "cron.database_name=booking"]