-- Update courses with old COMPLETE status to new statuses
UPDATE courses 
SET status = 'COMPLETED_WITH_CERTIFICATE' 
WHERE status = 'COMPLETE' AND completedAt IS NOT NULL;

UPDATE courses 
SET status = 'STARTED' 
WHERE status = 'COMPLETE' AND startedAt IS NOT NULL AND completedAt IS NULL;

UPDATE courses 
SET status = 'READY' 
WHERE status = 'COMPLETE' AND startedAt IS NULL;