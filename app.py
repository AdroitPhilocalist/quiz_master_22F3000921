from flask import Flask
from backend.config import LocalDevelopmentConfig
from backend.models import db,User,Role
from flask_security import Security,SQLAlchemyUserDatastore,auth_required
from backend.resources import *
from werkzeug.security import generate_password_hash
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
    app.app_context().push()
    return app
app=createApp()
with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Superuser of app")
    app.security.datastore.find_or_create_role(name = "user", description = "General user of app")
    db.session.commit()
    if not app.security.datastore.find_user(email = "user0@admin.com"):
        app.security.datastore.create_user(email = "user0@admin.com",
                                           username = "admin01",
                                           password = generate_password_hash("1234"),
                                           roles = ['admin'])
        
    if not app.security.datastore.find_user(email = "user1@user.com"):
        app.security.datastore.create_user(email = "user1@user.com",
                                           username = "user01",
                                           password = generate_password_hash("1234"),
                                           roles = ['user'])
    db.session.commit()
import backend.dbmanage
import backend.routes
if(__name__=='__main__'):
    app.run()