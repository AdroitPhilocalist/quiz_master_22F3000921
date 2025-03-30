from flask import current_app as app, jsonify, request, render_template
from flask_security import current_user
from flask_security import auth_required, verify_password, hash_password, roles_required
from backend.models import *
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import logging
from backend.tasks import *
datastore = app.security.datastore

@app.route('/')
def home():
    return render_template('index.html')
    # return "<h1>hihihiihi</h1>"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    print(email,password)
    
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

# @app.route('/api/admin/dashboard')
# @auth_required('token')
# @roles_required('admin')
# def admin_dashboard():
#     return jsonify({"message": "Admin dashboard access granted", "status": "success"})

# Add these routes to your existing routes.py file

@app.route('/api/admin/statistics', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def admin_statistics():
    """Get comprehensive statistics for admin dashboard"""
    try:
        # User statistics
        total_users = User.query.count()
        # Get users created in the current month
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        new_users_this_month = User.query.filter(
            extract('month', User.created_at) == current_month,
            extract('year', User.created_at) == current_year
        ).count()
        
        # Get monthly user growth for the past year
        user_growth = []
        for i in range(12):
            month = (datetime.utcnow().month - i) % 12 or 12
            year = datetime.utcnow().year - ((datetime.utcnow().month - i) <= 0)
            month_name = datetime.strptime(str(month), "%m").strftime("%b")
            count = User.query.filter(
                extract('month', User.created_at) == month,
                extract('year', User.created_at) == year
            ).count()
            user_growth.append({'month': month_name, 'count': count})
        
        # Continuing the admin_statistics route
        user_growth.reverse()  # Show oldest to newest
        
        # Active users (users who logged in within the last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = User.query.filter(User.last_activity >= thirty_days_ago).count()
        
        # Role distribution
        roles = Role.query.all()
        role_distribution = []
        for role in roles:
            count = UserRoles.query.filter_by(role_id=role.id).count()
            role_distribution.append({'role': role.name, 'count': count})
        
        # Quiz statistics
        total_quizzes = Quiz.query.count()
        published_quizzes = Quiz.query.filter_by(is_published=True).count()
        unpublished_quizzes = total_quizzes - published_quizzes
        
        # Average time limit and questions per quiz
        quizzes = Quiz.query.all()
        total_time = sum(quiz.time_limit for quiz in quizzes) if quizzes else 0
        average_time_limit = round(total_time / total_quizzes) if total_quizzes > 0 else 0
        
        total_questions = 0
        for quiz in quizzes:
            total_questions += Question.query.filter_by(quiz_id=quiz.id).count()
        average_questions = round(total_questions / total_quizzes) if total_quizzes > 0 else 0
        
        # Most popular quizzes (by number of attempts)
        popular_quizzes = db.session.query(
            Quiz.id, Quiz.title, Subject.name.label('subject'),
            func.count(UserQuizAttempt.id).label('attempts'),
            func.avg(UserQuizAttempt.score).label('average_score')
        ).join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject, Chapter.subject_id == Subject.id)\
         .join(UserQuizAttempt, Quiz.id == UserQuizAttempt.quiz_id)\
         .group_by(Quiz.id)\
         .order_by(func.count(UserQuizAttempt.id).desc())\
         .limit(10).all()
        
        most_popular = []
        for quiz in popular_quizzes:
            most_popular.append({
                'id': quiz.id,
                'title': quiz.title,
                'subject': quiz.subject,
                'attempts': quiz.attempts,
                'averageScore': round(quiz.average_score) if quiz.average_score else 0
            })
        
        # Attempt statistics
        total_attempts = UserQuizAttempt.query.count()
        completed_attempts = UserQuizAttempt.query.filter(UserQuizAttempt.completed_at != None).count()
        
        # Average score across all attempts
        avg_score_result = db.session.query(func.avg(UserQuizAttempt.score)).filter(
            UserQuizAttempt.completed_at != None,
            UserQuizAttempt.score.isnot(None)
        ).scalar()
        average_score = round(avg_score_result) if avg_score_result else 0
        
        # Score distribution
        score_ranges = [
            {'range': '0-20%', 'min': 0, 'max': 20, 'count': 0},
            {'range': '21-40%', 'min': 21, 'max': 40, 'count': 0},
            {'range': '41-60%', 'min': 41, 'max': 60, 'count': 0},
            {'range': '61-80%', 'min': 61, 'max': 80, 'count': 0},
            {'range': '81-100%', 'min': 81, 'max': 100, 'count': 0}
        ]
        
        for score_range in score_ranges:
            count = UserQuizAttempt.query.filter(
                UserQuizAttempt.completed_at != None,
                UserQuizAttempt.score >= score_range['min'],
                UserQuizAttempt.score <= score_range['max']
            ).count()
            score_range['count'] = count
        
        # Monthly attempts for the past year
        monthly_attempts = []
        for i in range(12):
            month = (datetime.utcnow().month - i) % 12 or 12
            year = datetime.utcnow().year - ((datetime.utcnow().month - i) <= 0)
            month_name = datetime.strptime(str(month), "%m").strftime("%b")
            count = UserQuizAttempt.query.filter(
    UserQuizAttempt.completed_at != None,
    UserQuizAttempt.score >= score_range['min'],
    UserQuizAttempt.score <= score_range['max']
).count()
            monthly_attempts.append({'month': month_name, 'count': count})
        
        monthly_attempts.reverse()  # Show oldest to newest
        
        # Subject statistics
        total_subjects = Subject.query.count()
        
        # Subject distribution (number of quizzes per subject)
        subjects = Subject.query.all()
        subject_distribution = []
        for subject in subjects:
            quiz_count = db.session.query(func.count(Quiz.id))\
                .join(Chapter, Quiz.chapter_id == Chapter.id)\
                .filter(Chapter.subject_id == subject.id).scalar()
            
            subject_distribution.append({
                'name': subject.name,
                'quizCount': quiz_count
            })
        
        # Sort by quiz count (descending)
        subject_distribution = sorted(
            subject_distribution, 
            key=lambda x: x['quizCount'], 
            reverse=True
        )
        
        # Chapter statistics
        total_chapters = Chapter.query.count()
        
        # Chapter distribution (number of quizzes per chapter)
        chapters = Chapter.query.all()
        chapter_distribution = []
        for chapter in chapters:
            quiz_count = Quiz.query.filter_by(chapter_id=chapter.id).count()
            chapter_distribution.append({
                'name': chapter.name,
                'subject': Subject.query.get(chapter.subject_id).name,
                'quizCount': quiz_count
            })
        
        # Sort by quiz count (descending)
        chapter_distribution = sorted(
            chapter_distribution, 
            key=lambda x: x['quizCount'], 
            reverse=True
        )
        
        # Compile all statistics
        statistics = {
            'users': {
                'total': total_users,
                'newThisMonth': new_users_this_month,
                'activeUsers': active_users,
                'roleDistribution': role_distribution,
                'growthData': user_growth
            },
            'quizzes': {
                'total': total_quizzes,
                'published': published_quizzes,
                'unpublished': unpublished_quizzes,
                'averageTimeLimit': average_time_limit,
                'averageQuestions': average_questions,
                'mostPopular': most_popular
            },
            'attempts': {
                'total': total_attempts,
                'completed': completed_attempts,
                'averageScore': average_score,
                'scoreDistribution': score_ranges,
                'monthlyAttempts': monthly_attempts
            },
            'subjects': {
                'total': total_subjects,
                'distribution': subject_distribution
            },
            'chapters': {
                'total': total_chapters,
                'distribution': chapter_distribution
            }
        }
        
        return jsonify(statistics)
    except Exception as e:
        app.logger.error(f"Error in admin statistics: {str(e)}")
        return jsonify({"message": f"Error retrieving statistics: {str(e)}", "status": "error"}), 500

@app.route('/api/user/statistics', methods=['GET'])
@auth_required('token')
def user_statistics():
    """Get statistics for the current user's quiz performance"""
    try:
        user_id = current_user.id
        user_name = current_user.full_name
        
        # Quiz attempt statistics
        user_attempts = UserQuizAttempt.query.filter_by(user_id=user_id).all()
        total_attempted = len(user_attempts)
        completed_attempts = UserQuizAttempt.query.filter(
    UserQuizAttempt.completed_at != None,
    UserQuizAttempt.user_id == user_id
).count()
        in_progress = total_attempted - completed_attempts
        
        # Calculate average score
        completed_with_score = UserQuizAttempt.query.filter(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.completed_at != None,
            UserQuizAttempt.score.isnot(None)
        ).all()
        
        average_score = 0
        best_score = 0
        if completed_with_score:
            average_score = round(sum(attempt.score for attempt in completed_with_score) / len(completed_with_score))
            best_score = max(attempt.score for attempt in completed_with_score)
        
        # Calculate total time spent on quizzes (in minutes)
        total_time = 0
        for attempt in user_attempts:
            if attempt.time_spent:
                total_time += attempt.time_spent
        
        # Get score history (last 10 completed attempts)
        score_history = []
        recent_attempts = UserQuizAttempt.query.filter(
            UserQuizAttempt.user_id == user_id,
            UserQuizAttempt.completed_at != None,
            UserQuizAttempt.score.isnot(None)
        ).order_by(UserQuizAttempt.started_at.desc()).limit(10).all()
        
        for attempt in recent_attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            if quiz:
                score_history.append({
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'score': attempt.score,
                    'date': attempt.started_at.strftime('%Y-%m-%d')
                })
        
        # Get subject performance
        subject_performance = []
        subjects = Subject.query.all()
        
        for subject in subjects:
            # Get all attempts for quizzes in this subject
            subject_attempts = db.session.query(UserQuizAttempt)\
                .join(Quiz, UserQuizAttempt.quiz_id == Quiz.id)\
                .join(Chapter, Quiz.chapter_id == Chapter.id)\
                .filter(
                    Chapter.subject_id == subject.id,
                    UserQuizAttempt.user_id == user_id,
                    UserQuizAttempt.completed_at != None,
                    UserQuizAttempt.score.isnot(None)
                ).all()
            
            if subject_attempts:
                avg_score = sum(attempt.score for attempt in subject_attempts) / len(subject_attempts)
                
                # Calculate accuracy
                total_questions = 0
                correct_answers = 0
                for attempt in subject_attempts:
                    answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
                    total_questions += len(answers)
                    for answer in answers:
                        option = Option.query.get(answer.option_id)
                        if option and option.is_correct:
                            correct_answers += 1
                
                accuracy = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0
                
                subject_performance.append({
                    'subject': subject.name,
                    'average_score': round(avg_score),
                    'attempts': len(subject_attempts),
                    'accuracy': accuracy
                })
        
        # Get recent attempts with more details
        recent_detailed_attempts = []
        all_recent_attempts = UserQuizAttempt.query.filter_by(user_id=user_id)\
            .order_by(UserQuizAttempt.started_at.desc()).limit(5).all()
        
        for attempt in all_recent_attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            if quiz:
                recent_detailed_attempts.append({
                    'id': attempt.id,
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'date': attempt.started_at.strftime('%Y-%m-%d'),
                    'score': attempt.score if attempt.score is not None else 'N/A',
                    'time_spent': attempt.time_spent or 0,
                    'status': 'completed' if attempt.UserQuizAttempt.completed_at != None else 'in_progress'
                })
        
        # Progress statistics
        total_questions = 0
        correct_answers = 0
        
        for attempt in user_attempts:
            answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
            total_questions += len(answers)
            for answer in answers:
                option = Option.query.get(answer.option_id)
                if option and option.is_correct:
                    correct_answers += 1
        
        accuracy = round((correct_answers / total_questions) * 100) if total_questions > 0 else 0
        
        # Monthly activity
        monthly_activity = []
        for i in range(12):
            month = (datetime.utcnow().month - i) % 12 or 12
            year = datetime.utcnow().year - ((datetime.utcnow().month - i) <= 0)
            month_name = datetime.strptime(str(month), "%m").strftime("%b")
            count = UserQuizAttempt.query.filter(
                UserQuizAttempt.user_id == user_id,
                extract('month', UserQuizAttempt.started_at) == month,
                extract('year', UserQuizAttempt.started_at) == year
            ).count()
            monthly_activity.append({'month': month_name, 'count': count})
        
        monthly_activity.reverse()  # Show oldest to newest
        
        # Weekday activity
        weekday_activity = []
        weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        for i, day in enumerate(weekdays):
            count = UserQuizAttempt.query.filter(
                UserQuizAttempt.user_id == user_id,
                extract('dow', UserQuizAttempt.started_at) == i
            ).count()
            weekday_activity.append({'day': day, 'count': count})
        
        # Compile all statistics
        statistics = {
            'user_id': user_id,
            'user_name': user_name,
            'stats': {
                'quizzes': {
                    'attempted': total_attempted,
                    'completed': completed_attempts,
                    'inProgress': in_progress,
                    'averageScore': average_score,
                    'bestScore': best_score,
                    'totalTime': total_time,
                    'scoreHistory': score_history,
                    'subjectPerformance': subject_performance,
                    'recentAttempts': recent_detailed_attempts
                },
                'progress': {
                    'totalQuestions': total_questions,
                    'correctAnswers': correct_answers,
                    'accuracy': accuracy,
                    'monthlyActivity': monthly_activity,
                    'weekdayActivity': weekday_activity
                },
                'achievements': {
                    'totalEarned': 0,  # Placeholder for future achievement system
                    'recent': [],
                    'list': []
                }
            }
        }
        
        return jsonify(statistics)
    except Exception as e:
        app.logger.error(f"Error in user statistics: {str(e)}")
        return jsonify({"message": f"Error retrieving statistics: {str(e)}", "status": "error"}), 500


# @app.route('/api/user/dashboard', methods=['GET'])
# @auth_required('token')
# def user_dashboard():
#     """Get user dashboard data including stats, recent attempts, and recommended quizzes"""
#     try:
#         user_id = current_user.id
        
#         # Get user info
#         user = User.query.get(user_id)
#         if not user:
#             return jsonify({"message": "User not found", "status": "error"}), 404
        
#         # Basic stats
#         total_attempts = UserQuizAttempt.query.filter_by(user_id=user_id).count()
#         completed_attempts = UserQuizAttempt.query.filter(UserQuizAttempt.completed_at != None).count()
#         in_progress_count = total_attempts - completed_attempts
        
#         # Calculate average score
#         avg_score_result = db.session.query(func.avg(UserQuizAttempt.score)).filter(
#             UserQuizAttempt.user_id == user_id,
#             UserQuizAttempt.completed_at != None,
#             UserQuizAttempt.score.isnot(None)
#         ).scalar()
#         average_score = round(avg_score_result) if avg_score_result else 0
        
#         # Get recent attempts
#         recent_attempts = []
#         attempts = UserQuizAttempt.query.filter_by(user_id=user_id).order_by(UserQuizAttempt.created_at.desc()).limit(5).all()
        
#         for attempt in attempts:
#             quiz = Quiz.query.get(attempt.quiz_id)
#             if quiz:
#                 chapter = Chapter.query.get(quiz.chapter_id)
#                 subject = Subject.query.get(chapter.subject_id) if chapter else None
                
#                 recent_attempts.append({
#                     'id': attempt.id,
#                     'quiz_id': quiz.id,
#                     'quiz_title': quiz.title,
#                     'subject': subject.name if subject else 'Unknown',
#                     'date': attempt.created_at.strftime('%Y-%m-%d'),
#                     'score': attempt.score if attempt.score is not None else None,
#                     'is_completed': 'true' if attempt.UserQuizAttempt.completed_at != None else 'false',
#                     'time_spent': attempt.time_spent or 0
#                 })
        
#         # Get in-progress quizzes
#         in_progress_quizzes = []
#         in_progress = UserQuizAttempt.query.filter_by(UserQuizAttempt.completed_at != None,user_id=user_id).all()
        
#         for attempt in in_progress:
#             quiz = Quiz.query.get(attempt.quiz_id)
#             if quiz:
#                 chapter = Chapter.query.get(quiz.chapter_id)
#                 subject = Subject.query.get(chapter.subject_id) if chapter else None
                
#                 # Calculate progress percentage
#                 total_questions = Question.query.filter_by(quiz_id=quiz.id).count()
#                 answered_questions = UserAnswer.query.filter_by(attempt_id=attempt.id).count()
#                 progress_percent = round((answered_questions / total_questions) * 100) if total_questions > 0 else 0
                
#                 in_progress_quizzes.append({
#                     'attempt_id': attempt.id,
#                     'quiz_id': quiz.id,
#                     'title': quiz.title,
#                     'subject': subject.name if subject else 'Unknown',
#                     'started_at': attempt.created_at.strftime('%Y-%m-%d'),
#                     'progress': progress_percent,
#                     'time_spent': attempt.time_spent or 0,
#                     'time_limit': quiz.time_limit
#                 })
        
#         # Get recommended quizzes based on user's history
#         # For simplicity, recommend quizzes from subjects the user has attempted before
#         attempted_quiz_ids = [attempt.quiz_id for attempt in UserQuizAttempt.query.filter_by(user_id=user_id).all()]
        
#         # Get subjects from attempted quizzes
#         subject_ids = db.session.query(Subject.id).join(Chapter).join(Quiz).filter(
#             Quiz.id.in_(attempted_quiz_ids) if attempted_quiz_ids else False
#         ).distinct().all()
#         subject_ids = [s[0] for s in subject_ids]
        
#         # If user has no history, recommend any published quizzes
#         recommended_quizzes = []
#         if subject_ids:
#             # Recommend quizzes from same subjects that user hasn't attempted yet
#             recommended = db.session.query(Quiz).join(Chapter).filter(
#                 Chapter.subject_id.in_(subject_ids),
#                 Quiz.is_published == True,
#                 ~Quiz.id.in_(attempted_quiz_ids) if attempted_quiz_ids else True
#             ).order_by(func.random()).limit(5).all()
#         else:
#             # New user - recommend any published quizzes
#             recommended = Quiz.query.filter_by(is_published=True).order_by(func.random()).limit(5).all()
        
#         for quiz in recommended:
#             chapter = Chapter.query.get(quiz.chapter_id)
#             subject = Subject.query.get(chapter.subject_id) if chapter else None
            
#             recommended_quizzes.append({
#                 'id': quiz.id,
#                 'title': quiz.title,
#                 'description': quiz.description,
#                 'subject': subject.name if subject else 'Unknown',
#                 'chapter': chapter.name if chapter else 'Unknown',
#                 'time_limit': quiz.time_limit,
#                 'question_count': Question.query.filter_by(quiz_id=quiz.id).count()
#             })
        
#         # Get all subjects for navigation
#         subjects = []
#         for subject in Subject.query.all():
#             subjects.append({
#                 'id': subject.id,
#                 'name': subject.name,
#                 'chapter_count': Chapter.query.filter_by(subject_id=subject.id).count(),
#                 'quiz_count': db.session.query(func.count(Quiz.id)).join(Chapter).filter(
#                     Chapter.subject_id == subject.id,
#                     Quiz.is_published == True
#                 ).scalar()
#             })
        
#         # Compile dashboard data
#         dashboard_data = {
#             'user': {
#                 'id': user.id,
#                 'name': user.full_name,
#                 'email': user.email
#             },
#             'stats': {
#                 'total_attempts': total_attempts,
#                 'completed_quizzes': completed_attempts,
#                 'in_progress': in_progress_count,
#                 'average_score': average_score
#             },
#             'recent_attempts': recent_attempts,
#             'in_progress_quizzes': in_progress_quizzes,
#             'recommended_quizzes': recommended_quizzes,
#             'subjects': subjects
#         }
        
#         return jsonify(dashboard_data)
#     except Exception as e:
#         app.logger.error(f"Error in user dashboard: {str(e)}")
#         return jsonify({"message": f"Error retrieving dashboard data: {str(e)}", "status": "error"}), 500

# Add these routes to your existing routes.py file


