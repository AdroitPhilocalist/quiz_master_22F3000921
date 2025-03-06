from flask import current_app as app, jsonify,request
from flask_security import auth_required,verify_password,hash_password
from backend.models import *
datastore=app.security.datastore
@app.get('/')
def home():
    return '<h1>Home Page</h1>'

@app.get('/protected')
@auth_required('token')
def protected():
    return '<h1>accessible for only auth user</h1>'


@app.route('/login',methods=['POST'])
def login():
    data=request.get_json()
    email=data.get('email')
    password=data.get('password')
    if not email or not password:
        return jsonify({"message":"invalid input"}),404
    user=datastore.find_user(email=email)
    if not user:
        return jsonify({"message":"invalid email"}),404
    if verify_password(password,user.password):
        return jsonify({'token':user.get_auth_token(),'email':user.email,'role':user.roles[0].name,'id':user.id})
    return jsonify({'message':'password wrong'}),400

@app.route('/register',methods=['POST'])
def register():
    data=request.get_json()
    email=data.get('email')
    password=data.get('password')
    role=data.get('role')
    if not email or not password or role not in ['user']:
        return jsonify({"message":"invalid input"}),404
    user=datastore.find_user(email=email)
    if user:
        return jsonify({"message":"user already exists"}),404

    try:
        datastore.create_user(email=email,password=hash_password(password),roles=[role],active=True)
        db.session.commit()
        return jsonify({"message":"user created"}),200
    except:
        db.session.rollback()
        return jsonify({"message":"error creating user"}),400