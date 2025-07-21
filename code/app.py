from flask import Flask
from backend.config import LocalDevelopmentConfig
from backend.models import db,User,Role
from flask_security import Security,SQLAlchemyUserDatastore,auth_required,hash_password
from backend.resources import *
from backend.celery_app import make_celery
from datetime import datetime

def createApp():
    app= Flask(__name__,template_folder='frontend',static_folder='frontend',static_url_path='/static')
    app.config.from_object(LocalDevelopmentConfig)
    # model init
    db.init_app(app)
    
    # flask-restful init
    api.init_app(app)
    #flask security
    datastore=SQLAlchemyUserDatastore(db,User,Role)
    app.security=Security(app,datastore=datastore,register_blueprint=False)#after giving this register_blueprint=False all the premade routesbby flask login wll be disabled
    

    celery = make_celery(app)
    app.celery = celery

    app.app_context().push()
    return app

app=createApp()
celery= app.celery


with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Superuser of app")
    app.security.datastore.find_or_create_role(name = "user", description = "General user of app")
    db.session.commit()
    
    # Create admin user if it doesn't exist
    if not app.security.datastore.find_user(email = "admin@gmail.com"):
        app.security.datastore.create_user(
            email = "admin@gmail.com",
            password = hash_password("1234"),
            full_name = "Admin",
            active = True,
            roles = ['admin']
        )
    
    # Create regular user if it doesn't exist
    if not app.security.datastore.find_user(email = "user1@gmail.com"):
        app.security.datastore.create_user(
            email = "user1@gmail.com",
            password = hash_password("1234"),
            full_name = "Regular User",
            active = True,
            roles = ['user']
        )
    
    db.session.commit()

import backend.routes
if __name__ == '__main__':
    app.run()