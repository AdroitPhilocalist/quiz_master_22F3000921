from flask import current_app as app
from backend.models import db
from flask_security import SQLAlchemySessionUserDatastore,hash_password

with app.app_context():
    db.create_all()
    userdatastore:SQLAlchemySessionUserDatastore=app.security.datastore
    userdatastore.find_or_create_role(name='admin',description='superuser')
    userdatastore.find_or_create_role(name='user',description='general user')

    if(not userdatastore.find_user(email='admin@gmail.com')):
        userdatastore.create_user(email='admin@gmail.com',password=hash_password('admin'),roles=['admin'])
    if(not userdatastore.find_user(email='user1@gmail.com')):
        userdatastore.create_user(email='user1@gmail.com',password=hash_password('user'),roles=['user'])

    db.session.commit()