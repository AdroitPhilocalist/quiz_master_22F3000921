from celery.schedules import crontab
from app import celery
from backend.tasks import send_daily_reminders, generate_monthly_report

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Send daily reminders at 6 PM every day
    sender.add_periodic_task(
        crontab(hour=18, minute=0),
        send_daily_reminders.s(),
        name='send daily reminders'
    )
    
    # Generate monthly reports on the 1st of every month at 7 AM
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=7, minute=0),
        generate_monthly_report.s(),
        name='generate monthly reports'
    )