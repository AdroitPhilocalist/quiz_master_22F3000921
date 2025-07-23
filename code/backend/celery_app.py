from celery import Celery
from celery.schedules import crontab

def make_celery(app):
    """Create Celery app and configure it with Flask app context"""
    
    # Create Celery instance
    celery = Celery(
        app.import_name,
        backend='redis://localhost:6379/1',  # Results backend
        broker='redis://localhost:6379/0'    # Message broker
    )
    
    # Configure Celery
    celery.conf.update(
        # Timezone settings
        timezone='UTC',
        
        # Task settings
        task_serializer='json',
        result_serializer='json',
        accept_content=['json'],
        
        # Beat schedule for periodic tasks
        beat_schedule={
            'send-daily-reminders': {
                'task': 'backend.tasks.send_daily_reminders',
                # 'schedule': crontab(minute='*'),  #every minute for testing
                'schedule': crontab(hour=18, minute=0),  # Every day at 6:00 PM
            },
            'send-monthly-activity-report': {
                'task': 'backend.tasks.send_monthly_activity_report',
                # 'schedule': crontab(minute='*'),  #every minute for testing, change to monthly in production
                'schedule': crontab(day_of_month=1, hour=9, minute=0),  # 1st day of month at 9:00 AM
            },
        }
    )
    
    # Update task base classes to work with Flask app context
    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery