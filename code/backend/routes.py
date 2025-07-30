from flask import current_app, jsonify, request, render_template, abort, send_from_directory
import os
from flask_security import current_user
from flask_security import auth_required, verify_password, hash_password, roles_required
from backend.models import *
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import logging

def register_routes(app):
    """Register all routes with the Flask app"""
    
    @app.route('/')
    def home():
        return render_template('index.html')
    



    @app.route('/api/debug/cache-status')
    # @auth_required('token')
    # @roles_required('admin')
    def cache_status():
        """Debug endpoint to check cache status (development only)"""
        if not app.debug:
            return jsonify({"message": "Only available in debug mode"}), 403
        
        try:
            # Test cache connectivity
            test_key = 'cache_test'
            test_value = {'test': True, 'timestamp': datetime.now().isoformat()}
            
            # Set test value
            app.cache.set(test_key, test_value, timeout=60)
            
            # Get test value
            retrieved = app.cache.get(test_key)
            
            # Get cache info
            cache_info = {
                'cache_type': app.config.get('CACHE_TYPE'),
                'cache_timeout': app.config.get('CACHE_DEFAULT_TIMEOUT'),
                'redis_url': app.config.get('CACHE_REDIS_URL'),
                'test_connectivity': retrieved == test_value,
                'current_cached_keys': [
                    'admin_dashboard_stats',
                    'quiz_detail_*_admin',
                    'quiz_detail_*_user'
                ]
            }
            
            return jsonify(cache_info)
            
        except Exception as e:
            return jsonify({
                'error': str(e),
                'cache_working': False
            }), 500
    









    # @app.route('/exports/<path:filename>')
    # # @auth_required('token')  # Optional: restrict to logged-in users
    # # @roles_required('admin')  # Optional: restrict to admin only
    # def download_export(filename):
    #     export_folder = os.path.join(os.getcwd(), 'static', 'exports')
    #     try:
    #         return send_from_directory(export_folder, filename, as_attachment=True)
    #     except FileNotFoundError:
    #         abort(404)
    @app.route('/api/export/download/<filename>')
    # @auth_required('token')  # Keep commented for now to test
    # @roles_required('admin')
    def download_export_file(filename):
        """Secure route to download export CSV files"""
        try:
            print(f"Download request for file: {filename}")
            
            # Security: Only allow CSV files with specific naming pattern
            if not filename.startswith('quiz_master_export_') or not filename.endswith('.csv'):
                print(f"Invalid filename pattern: {filename}")
                abort(403)
            
            # Get the project root directory (where app.py is located)
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            exports_dir = os.path.join(project_root, 'frontend', 'static', 'exports')
            filepath = os.path.join(exports_dir, filename)
            
            print(f"Looking for file at: {filepath}")
            print(f"Exports directory: {exports_dir}")
            print(f"File exists: {os.path.exists(filepath)}")
            
            if not os.path.exists(filepath):
                print(f"File not found: {filepath}")
                abort(404)
            
            print(f"Serving file: {filename}")
            
            # FIXED: Use send_from_directory with proper headers for download
            return send_from_directory(
                exports_dir, 
                filename, 
                as_attachment=True,  # This forces download instead of opening in browser
                download_name=filename,  # This sets the downloaded filename
                mimetype='text/csv'
            )
            
        except Exception as e:
            print(f"Error serving export file {filename}: {str(e)}")
            current_app.logger.error(f"Error serving export file {filename}: {str(e)}")
            return jsonify({"error": f"Error downloading file: {str(e)}"}), 500

    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        print(email, password)
        
        if not email or not password:
            return jsonify({"message": "Invalid input", "status": "error"}), 400
        
        datastore = app.security.datastore
        user = datastore.find_user(email=email)
        if not user:
            return jsonify({"message": "Invalid email", "status": "error"}), 404

        # Check if user is active
        if not user.active:
            return jsonify({"message": "Your account has been deactivated. Please contact an administrator.", "status": "error"}), 403
        
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
        
        datastore = app.security.datastore
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

    @app.route('/api/admin/statistics', methods=['GET'])
    @auth_required('token')
    @roles_required('admin')
    def admin_statistics():
        try:
            total_users = User.query.count()-1
            current_month = datetime.utcnow().month
            current_year = datetime.utcnow().year
            new_users_this_month = User.query.filter(
                extract('month', User.created_at) == current_month,
                extract('year', User.created_at) == current_year
            ).count()-1
            
            # Get monthly user growth for the past year
            user_growth = []
            for i in range(12):
                month = (datetime.utcnow().month - i) % 12 or 12
                year = datetime.utcnow().year - ((datetime.utcnow().month - i) <= 0)
                month_name = datetime.strptime(str(month), "%m").strftime("%b")
                count = User.query.filter(
                    extract('month', User.created_at) == month,
                    extract('year', User.created_at) == year
                ).count()-1
                user_growth.append({'month': month_name, 'count': count})
            
            user_growth.reverse()  # Show oldest to newest
            
            # Active users (users who logged in within the last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            active_users = User.query.filter(User.last_activity >= thirty_days_ago).count()-1
            
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
            
            # Monthly attempts for the past year - FIX THE BUG HERE
            monthly_attempts = []
            for i in range(12):
                month = (datetime.utcnow().month - i) % 12 or 12
                year = datetime.utcnow().year - ((datetime.utcnow().month - i) <= 0)
                month_name = datetime.strptime(str(month), "%m").strftime("%b")
                count = UserQuizAttempt.query.filter(
                    UserQuizAttempt.completed_at != None,
                    extract('month', UserQuizAttempt.started_at) == month,
                    extract('year', UserQuizAttempt.started_at) == year
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
            current_app.logger.error(f"Error in admin statistics: {str(e)}")
            return jsonify({"message": f"Error retrieving statistics: {str(e)}", "status": "error"}), 500

    @app.route('/api/user/statistics', methods=['GET'])
    @auth_required('token')
    def user_statistics():
        """Get statistics for the current user's quiz performance"""
        try:
            user_id = current_user.id
            user_name = current_user.full_name
            
            # Get leaderboard data (all non-admin users)
            all_users = User.query.filter(
                ~User.roles.any(Role.name == 'admin')
            ).all()
            
            leaderboard = []
            for user in all_users:
                user_attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all()
                completed_attempts = [a for a in user_attempts if a.completed_at is not None]
                
                if completed_attempts:
                    # Calculate accuracy for this user
                    total_questions = 0
                    correct_answers = 0
                    
                    for attempt in completed_attempts:
                        answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
                        total_questions += len(answers)
                        for answer in answers:
                            option = Option.query.get(answer.option_id)
                            if option and option.is_correct:
                                correct_answers += 1
                    
                    accuracy = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
                else:
                    accuracy = 0
                    
                leaderboard.append({
                    'user_id': user.id,
                    'name': user.full_name,
                    'accuracy': round(accuracy, 2)
                })

            # Sort by accuracy (descending)
            leaderboard.sort(key=lambda x: x['accuracy'], reverse=True)
            
            # Current user's quiz attempt statistics
            user_attempts = UserQuizAttempt.query.filter_by(user_id=user_id).all()
            total_attempted = len(user_attempts)
            completed_attempts = [a for a in user_attempts if a.completed_at is not None]
            in_progress = total_attempted - len(completed_attempts)
            
            # Calculate average score and best score
            average_score = 0
            best_score = 0
            if completed_attempts:
                scores = [attempt.score for attempt in completed_attempts if attempt.score is not None]
                if scores:
                    average_score = round(sum(scores) / len(scores))
                    best_score = round(max(scores))
            
            # Calculate total time spent on quizzes (in seconds)
            total_time_seconds = 0
            for attempt in completed_attempts:
                if attempt.completed_at and attempt.started_at:
                    time_diff = attempt.completed_at - attempt.started_at
                    total_time_seconds += int(time_diff.total_seconds())
            
            # Convert to minutes for display
            total_time_minutes = total_time_seconds 

            # Get score history (last 10 completed attempts)
            score_history = []
            recent_completed = sorted(completed_attempts, key=lambda x: x.started_at, reverse=True)[:10]
            
            for attempt in recent_completed:
                quiz = Quiz.query.get(attempt.quiz_id)
                if quiz and attempt.score is not None:
                    score_history.append({
                        'quiz_id': quiz.id,
                        'quiz_title': quiz.title,
                        'score': round(attempt.score),
                        'date': attempt.started_at.strftime('%Y-%m-%d')
                    })
            
            # Reverse to show chronological order
            score_history.reverse()

            # Get subject performance
            subject_performance = []
            subjects = Subject.query.all()
            
            for subject in subjects:
                # Get all completed attempts for quizzes in this subject
                subject_attempts = db.session.query(UserQuizAttempt)\
                    .join(Quiz, UserQuizAttempt.quiz_id == Quiz.id)\
                    .join(Chapter, Quiz.chapter_id == Chapter.id)\
                    .filter(
                        Chapter.subject_id == subject.id,
                        UserQuizAttempt.user_id == user_id,
                        UserQuizAttempt.completed_at.isnot(None),
                        UserQuizAttempt.score.isnot(None)
                    ).all()
                
                if subject_attempts:
                    # Calculate average score for this subject
                    scores = [attempt.score for attempt in subject_attempts]
                    avg_score = sum(scores) / len(scores)
                    
                    # Calculate accuracy for this subject
                    total_subject_questions = 0
                    correct_subject_answers = 0
                    
                    for attempt in subject_attempts:
                        answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
                        total_subject_questions += len(answers)
                        for answer in answers:
                            option = Option.query.get(answer.option_id)
                            if option and option.is_correct:
                                correct_subject_answers += 1
                    
                    accuracy = (correct_subject_answers / total_subject_questions) * 100 if total_subject_questions > 0 else 0
                    
                    subject_performance.append({
                        'subject': subject.name,
                        'average_score': round(avg_score),
                        'attempts': len(subject_attempts),
                        'accuracy': round(accuracy)
                    })

            # Get recent attempts with more details
            recent_detailed_attempts = []
            all_recent_attempts = sorted(user_attempts, key=lambda x: x.started_at, reverse=True)[:5]
            
            for attempt in all_recent_attempts:
                quiz = Quiz.query.get(attempt.quiz_id)
                if quiz:
                    time_spent_seconds = 0
                    if attempt.completed_at and attempt.started_at:
                        time_diff = attempt.completed_at - attempt.started_at
                        time_spent_seconds = int(time_diff.total_seconds())
                    
                    recent_detailed_attempts.append({
                        'id': attempt.id,
                        'quiz_id': quiz.id,
                        'quiz_title': quiz.title,
                        'date': attempt.started_at.strftime('%Y-%m-%d'),
                        'score': round(attempt.score) if attempt.score is not None else 'N/A',
                        'time_spent': time_spent_seconds,
                        'status': 'completed' if attempt.completed_at else 'in_progress'
                    })

            # Overall progress statistics (for current user)
            total_questions_answered = 0
            correct_answers_total = 0
            
            for attempt in completed_attempts:
                answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
                total_questions_answered += len(answers)
                for answer in answers:
                    option = Option.query.get(answer.option_id)
                    if option and option.is_correct:
                        correct_answers_total += 1
            
            overall_accuracy = round((correct_answers_total / total_questions_answered) * 100) if total_questions_answered > 0 else 0

            # Monthly activity (number of quizzes taken per month)
            monthly_activity = []
            for i in range(12):
                # Calculate the month and year for i months ago
                target_date = datetime.utcnow() - timedelta(days=30*i)
                month = target_date.month
                year = target_date.year
                month_name = target_date.strftime("%b")
                
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
                    'leaderboard': leaderboard[:10],  # Top 10 users
                    'quizzes': {
                        'attempted': total_attempted,
                        'completed': len(completed_attempts),
                        'inProgress': in_progress,
                        'averageScore': average_score,
                        'bestScore': best_score,
                        'totalTime': total_time_minutes,  # in minutes
                        'scoreHistory': score_history,
                        'subjectPerformance': subject_performance,
                        'recentAttempts': recent_detailed_attempts
                    },
                    'progress': {
                        'totalQuestions': total_questions_answered,
                        'correctAnswers': correct_answers_total,
                        'accuracy': overall_accuracy,
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
            current_app.logger.error(f"Error in user statistics: {str(e)}")
            import traceback
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({"message": f"Error retrieving statistics: {str(e)}", "status": "error"}), 500

    @app.route('/api/user/profile', methods=['PUT'])
    @auth_required('token')
    def update_profile():
        """Update user profile information"""
        try:
            data = request.get_json()
            user = current_user._get_current_object()
            
            # Validate required fields
            if not data.get('full_name'):
                return jsonify({"message": "Full name is required", "status": "error"}), 400
                
            # Update user fields
            user.full_name = data.get('full_name', user.full_name)
            user.qualification = data.get('qualification', user.qualification)
            
            # Handle date of birth
            dob = data.get('date_of_birth')
            if dob:
                try:
                    user.date_of_birth = datetime.strptime(dob, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"message": "Invalid date format. Use YYYY-MM-DD", "status": "error"}), 400
            
            db.session.commit()
            
            return jsonify({
                "message": "Profile updated successfully",
                "status": "success",
                "user": {
                    "full_name": user.full_name,
                    "qualification": user.qualification,
                    "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
                    "email": user.email
                }
            })
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating profile: {str(e)}")
            return jsonify({"message": f"Error updating profile: {str(e)}", "status": "error"}), 500

    @app.route('/api/user/profile', methods=['GET'])
    @auth_required('token')
    def get_profile():
        """Get current user's profile information"""
        try:
            user = current_user._get_current_object()
            
            return jsonify({
                "status": "success",
                "user": {
                    "email": user.email,
                    "full_name": user.full_name,
                    "qualification": user.qualification,
                    "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "active": user.active
                }
            })
            
        except Exception as e:
            current_app.logger.error(f"Error retrieving profile: {str(e)}")
            return jsonify({"message": f"Error retrieving profile: {str(e)}", "status": "error"}), 500