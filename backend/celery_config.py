from celery import Celery
from celery.schedules import crontab

def make_celery(app):
    # Check which config keys are available and use the appropriate ones
    if 'CELERY_RESULT_BACKEND' in app.config:
        # Using old-style config keys
        backend = app.config['CELERY_RESULT_BACKEND']
        broker = app.config.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    else:
        # Using new-style config keys
        backend = app.config.get('RESULT_BACKEND', 'redis://localhost:6379/0')
        broker = app.config.get('BROKER_URL', 'redis://localhost:6379/0')
    
    celery = Celery(
        app.import_name,
        backend=backend,
        broker=broker
    )
    
    # Update Celery config with Flask app config
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    
    # Register tasks
    from backend.tasks import generate_quiz_export
    celery.task(name='backend.tasks.generate_quiz_export')(generate_quiz_export)
    
    return celery