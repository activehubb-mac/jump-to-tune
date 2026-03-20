

## Clear Test Video Jobs from Queue

### What
Delete the 6 stale "queued" test video jobs from the `ai_video_jobs` table. These were created during testing before the Replicate pipeline was wired up, so they'll never complete.

### How
One migration file:

**New file: migration**
```sql
DELETE FROM ai_video_jobs WHERE status = 'queued';
```

That's it — one statement, removes all 6 queued test jobs. The UI will refresh automatically via the existing polling logic and show an empty queue.

