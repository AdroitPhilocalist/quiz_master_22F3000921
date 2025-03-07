from flask import current_app as app, jsonify, request, render_template
from flask_security import auth_required, verify_password, hash_password, roles_required
from backend.models import *
from datetime import datetime

datastore = app.security.datastore

@app.route('/')
def home():
    # return render_template('index.html')
    return "hihihiihi"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"message": "Invalid input", "status": "error"}), 400
    
    user = datastore.find_user(email=email)
    if not user:
        return jsonify({"message": "Invalid email", "status": "error"}), 404
    
    if verify_password(password, user.password):
        # Update last activity timestamp
        user.last_activity = datetime.utcnow()
        db.session.commit()
        
        # Return role-specific information
        role = user.roles[0].name
        return jsonify({
            'token': user.get_auth_token(),
            'email': user.email,
            'role': role,
            'id': user.id,
            'full_name': user.full_name,
            'status': 'success'
        })
    
    return jsonify({'message': 'Incorrect password', 'status': 'error'}), 400

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    qualification = data.get('qualification')
    date_of_birth = data.get('date_of_birth')
    
    # Only allow user registration, not admin
    role = 'user'
    
    if not email or not password or not full_name:
        return jsonify({"message": "Missing required fields", "status": "error"}), 400
    
    user = datastore.find_user(email=email)
    if user:
        return jsonify({"message": "User already exists", "status": "error"}), 409

    try:
        # Convert date string to date object if provided
        dob = None
        if date_of_birth:
            dob = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
            
        datastore.create_user(
            email=email,
            password=hash_password(password),
            full_name=full_name,
            qualification=qualification,
            date_of_birth=dob,
            roles=[role],
            active=True
        )
        db.session.commit()
        return jsonify({"message": "User created successfully", "status": "success"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error creating user: {str(e)}", "status": "error"}), 400

# Protected routes with role-based access
@app.route('/api/user/dashboard')
@auth_required('token')
@roles_required('user')
def user_dashboard():
    return jsonify({"message": "User dashboard access granted", "status": "success"})

@app.route('/api/admin/dashboard')
@auth_required('token')
@roles_required('admin')
def admin_dashboard():
    return jsonify({"message": "Admin dashboard access granted", "status": "success"})