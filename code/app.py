from flask import Flask
from backend.config import LocalDevelopmentConfig
from backend.models import db, User, Role
from flask_security import Security, SQLAlchemyUserDatastore, auth_required, hash_password
from backend.resources import *
from backend.celery_app import make_celery
from datetime import datetime

def createApp():
    app = Flask(__name__, template_folder='frontend', static_folder='frontend', static_url_path='/static')
    app.config.from_object(LocalDevelopmentConfig)
    
    # Model init
    db.init_app(app)
    
    # Flask-restful init
    api.init_app(app)
    
    # Flask security
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore=datastore, register_blueprint=False)
    
    # Initialize Celery
    celery = make_celery(app)
    app.celery = celery
    
    # Register tasks with Celery after it's created
    register_tasks(celery)
    
    return app

def register_tasks(celery_app):
    """Register all Celery tasks"""
    from backend.tasks import send_daily_reminders, send_monthly_activity_report, export_quiz_data_csv
    
    # Register the task with Celery
    celery_app.task(name='backend.tasks.send_daily_reminders')(send_daily_reminders)
    celery_app.task(name='backend.tasks.send_monthly_activity_report')(send_monthly_activity_report)
    celery_app.task(name='backend.tasks.export_quiz_data_csv')(export_quiz_data_csv)

app = createApp()

# Make celery available globally
celery = app.celery

# Initialize database and create default users
def init_database():
    """Initialize database with default data"""
    with app.app_context():
        db.create_all()
        app.security.datastore.find_or_create_role(name="admin", description="Superuser of app")
        app.security.datastore.find_or_create_role(name="user", description="General user of app")
        db.session.commit()
        
        # Create admin user if it doesn't exist
        if not app.security.datastore.find_user(email="admin@gmail.com"):
            app.security.datastore.create_user(
                email="admin@gmail.com",
                password=hash_password("1234"),
                full_name="Admin",
                active=True,
                roles=['admin']
            )
        
        # Create regular user if it doesn't exist
        if not app.security.datastore.find_user(email="user1@gmail.com"):
            app.security.datastore.create_user(
                email="user1@gmail.com",
                password=hash_password("1234"),
                full_name="Regular User",
                active=True,
                roles=['user']
            )
        
        db.session.commit()
        print("✅ Database initialized successfully")


if __name__ == '__main__':
    # Initialize database first
    init_database()
    
    # Register routes AFTER app context is established
    from backend.routes import register_routes
    register_routes(app)
    
    # Start the Flask app
    app.run(debug=True)