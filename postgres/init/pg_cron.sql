CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('delete-messages-viewed-by-job', '0 0 * * *', $$
   DELETE FROM public."MessageViewedBy"
   WHERE "createdAt" < NOW() - INTERVAL '7 days';
$$);