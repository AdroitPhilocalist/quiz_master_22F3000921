import csv
from io import StringIO
from flask import jsonify, request, Response, current_app
from flask_restful import Api, Resource, fields, marshal_with
from flask_security import auth_required, current_user, roles_required, hash_password
from backend.models import *
from datetime import datetime

from flask import current_app
api = Api(prefix='/api')


user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'full_name': fields.String,
    'qualification': fields.String,
    'last_activity': fields.DateTime
}

option_fields = {
    'id': fields.Integer,
    'text': fields.String,
    'is_correct': fields.Boolean
}

question_fields = {
    'id': fields.Integer,
    'text': fields.String,
    'quiz_id': fields.Integer,
    'created_at': fields.DateTime,
    'options': fields.List(fields.Nested(option_fields))
}

# New field definitions for Subject and Chapter
subject_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'created_by': fields.Integer,
    'created_at': fields.DateTime
}

chapter_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'subject_id': fields.Integer,
    'created_by': fields.Integer,
    'created_at': fields.DateTime
}
quiz_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'description': fields.String,
    'time_limit': fields.Integer,
    'created_by': fields.Integer,
    'created_at': fields.DateTime,
    'is_published': fields.Boolean,
    'chapter_id': fields.Integer
}
quiz_detail_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'description': fields.String,
    'time_limit': fields.Integer,
    'created_by': fields.Integer,
    'created_at': fields.DateTime,
    'is_published': fields.Boolean,
    'chapter_id': fields.Integer,
    'questions': fields.List(fields.Nested(question_fields))
}

attempt_fields = {
    'id': fields.Integer,
    'user_id': fields.Integer,
    'quiz_id': fields.Integer,
    'score': fields.Float,
    'completed_at': fields.DateTime,
    'started_at': fields.DateTime
}
user_list_fields = {
    'id': fields.Integer,
    'username': fields.String,
    'email': fields.String,
    'full_name': fields.String,
    'qualification': fields.String,
    'dob': fields.String,
    'role': fields.String,
    'status': fields.String,
    'active': fields.Boolean,
    'created_at': fields.DateTime,
    'last_activity': fields.DateTime
}

user_stats_fields = {
    'quizzes_taken': fields.Integer,
    'average_score': fields.Float,
    'best_score': fields.Float,
    'recent_attempts': fields.List(fields.Raw)
}

# Subject Resources
class SubjectAPI(Resource):
    @marshal_with(subject_fields)
    @auth_required('token')
    def get(self, subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        return subject
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        
        db.session.delete(subject)
        db.session.commit()
        return {"message": "Subject deleted successfully"}, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        
        data = request.get_json()
        subject.name = data.get('name', subject.name)
        subject.description = data.get('description', subject.description)
        
        db.session.commit()
        return {"message": "Subject updated successfully"}, 200

class SubjectListAPI(Resource):
    @marshal_with(subject_fields)
    @auth_required('token')
    def get(self):
        subjects = Subject.query.all()
        return subjects
    
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')
        
        if not name:
            return {"message": "Subject name is required"}, 400
        
        subject = Subject(
            name=name,
            description=description,
            created_by=current_user.id
        )
        
        db.session.add(subject)
        db.session.commit()
        return {"message": "Subject created successfully", "subject_id": subject.id}, 201

# Chapter Resources
class ChapterAPI(Resource):
    @marshal_with(chapter_fields)
    @auth_required('token')
    def get(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404
        return chapter
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404
        
        db.session.delete(chapter)
        db.session.commit()
        return {"message": "Chapter deleted successfully"}, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404
        
        data = request.get_json()
        chapter.name = data.get('name', chapter.name)
        chapter.description = data.get('description', chapter.description)
        chapter.subject_id = data.get('subject_id', chapter.subject_id)
        
        db.session.commit()
        return {"message": "Chapter updated successfully"}, 200

class ChapterListAPI(Resource):
    @marshal_with(chapter_fields)
    @auth_required('token')
    def get(self, subject_id=None):
        if subject_id:
            chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        else:
            chapters = Chapter.query.all()
        return chapters
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, subject_id=None):
        data = request.get_json()
        name = data.get('name')
        description = data.get('description')
        
        # If subject_id is not in the URL, get it from the request data
        if not subject_id:
            subject_id = data.get('subject_id')
        
        if not name:
            return {"message": "Chapter name is required"}, 400
        
        if not subject_id:
            return {"message": "Subject ID is required"}, 400
        
        # Check if subject exists
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        
        chapter = Chapter(
            name=name,
            description=description,
            subject_id=subject_id,
            created_by=current_user.id
        )
        
        db.session.add(chapter)
        db.session.commit()
        return {"message": "Chapter created successfully", "chapter_id": chapter.id}, 201


# Quiz Resources
class QuizAPI(Resource):
    @marshal_with(quiz_detail_fields)
    @auth_required('token')
    # @cache.cached(timeout=300, key_prefix=lambda: f'quiz_{request.view_args["quiz_id"]}_{current_user.id}')
    def get(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        return quiz
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        db.session.delete(quiz)
        db.session.commit()
        return {"message": "Quiz deleted successfully"}, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        data = request.get_json()
        quiz.title = data.get('title', quiz.title)
        quiz.description = data.get('description', quiz.description)
        quiz.time_limit = data.get('time_limit', quiz.time_limit)
        quiz.is_published = data.get('is_published', quiz.is_published)
        
        db.session.commit()
        return {"message": "Quiz updated successfully"}, 200

# Update QuizListAPI to filter by chapter_id
class QuizListAPI(Resource):
    @marshal_with(quiz_fields)
    @auth_required('token')
    # @cache.cached(timeout=300, key_prefix=lambda: f'quizzes_{current_user.id}')
    def get(self, chapter_id=None):
        if chapter_id:
            if 'admin' in [role.name for role in current_user.roles]:
                quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
            else:
                quizzes = Quiz.query.filter_by(chapter_id=chapter_id, is_published=True).all()
        else:
            if 'admin' in [role.name for role in current_user.roles]:
                quizzes = Quiz.query.all()
            else:
                quizzes = Quiz.query.filter_by(is_published=True).all()
        return quizzes
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, chapter_id=None):
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        time_limit = data.get('time_limit', 600)  # Default 10 minutes
        
        # If chapter_id is not in the URL, get it from the request data
        if not chapter_id:
            chapter_id = data.get('chapter_id')
        
        if not title:
            return {"message": "Title is required"}, 400
        
        if chapter_id:
            # Check if chapter exists
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {"message": "Chapter not found"}, 404
        
        quiz = Quiz(
            title=title,
            description=description,
            time_limit=time_limit,
            created_by=current_user.id,
            is_published=False,
            chapter_id=chapter_id
        )
        
        db.session.add(quiz)
        db.session.commit()
        return {"message": "Quiz created successfully", "quiz_id": quiz.id}, 201

# Question Resources
class QuestionAPI(Resource):
    @marshal_with(question_fields)
    @auth_required('token')
    def get(self, question_id):
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404
        return question
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, question_id):
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404
        
        db.session.delete(question)
        db.session.commit()
        return {"message": "Question deleted successfully"}, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, question_id):
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404
        
        data = request.get_json()
        question.text = data.get('text', question.text)
        
        # Update options if provided
        if 'options' in data:
            # Delete existing options
            Option.query.filter_by(question_id=question_id).delete()
            
            # Add new options
            for option_data in data['options']:
                option = Option(
                    text=option_data['text'],
                    is_correct=option_data['is_correct'],
                    question_id=question.id
                )
                db.session.add(option)
        
        db.session.commit()
        return {"message": "Question updated successfully"}, 200

class QuestionListAPI(Resource):
    @marshal_with(question_fields)
    @auth_required('token')
    def get(self, quiz_id):
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        print(questions)
        return questions
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        data = request.get_json()
        text = data.get('text')
        options = data.get('options', [])
        
        if not text:
            return {"message": "Question text is required"}, 400
        
        if len(options) < 2:
            return {"message": "At least two options are required"}, 400
        
        # Check if at least one option is marked as correct
        if not any(option.get('is_correct', False) for option in options):
            return {"message": "At least one option must be correct"}, 400
        
        question = Question(text=text, quiz_id=quiz_id)
        db.session.add(question)
        db.session.flush()  # Get the question ID
        
        for option_data in options:
            option = Option(
                text=option_data['text'],
                is_correct=option_data.get('is_correct', False),
                question_id=question.id
            )
            db.session.add(option)
        
        db.session.commit()
        return {"message": "Question added successfully", "question_id": question.id}, 201

# Quiz Attempt Resources
class QuizAttemptAPI(Resource):
    @marshal_with(attempt_fields)
    @auth_required('token')
    def get(self, attempt_id):
        attempt = UserQuizAttempt.query.get(attempt_id)
        if not attempt or attempt.user_id != current_user.id:
            return {"message": "Attempt not found"}, 404
        return attempt
    
    @auth_required('token')
    def post(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        # Check if quiz is published for regular users
        if not quiz.is_published and 'admin' not in [role.name for role in current_user.roles]:
            return {"message": "Quiz is not available"}, 403
        
        # Create a new attempt
        attempt = UserQuizAttempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            started_at=datetime.utcnow()
        )
        
        db.session.add(attempt)
        db.session.commit()
        
        return {
            "message": "Quiz attempt started",
            "attempt_id": attempt.id,
            "time_limit": quiz.time_limit
        }, 201
    
    @auth_required('token')
    def put(self, attempt_id):
        attempt = UserQuizAttempt.query.get(attempt_id)
        if not attempt or attempt.user_id != current_user.id:
            return {"message": "Attempt not found"}, 404
        
        if attempt.completed_at:
            return {"message": "This attempt has already been completed"}, 400
        
        data = request.get_json()
        answers = data.get('answers', [])
        
        # Calculate score
        quiz = Quiz.query.get(attempt.quiz_id)
        questions = Question.query.filter_by(quiz_id=attempt.quiz_id).all()
        
        correct_count = 0
        total_questions = len(questions)
        
        # Save user answers and calculate score
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            option_id = answer_data.get('option_id')
            
            # Save the answer
            user_answer = UserAnswer(
                attempt_id=attempt.id,
                question_id=question_id,
                option_id=option_id
            )
            db.session.add(user_answer)
            
            # Check if answer is correct
            option = Option.query.get(option_id)
            if option and option.is_correct:
                correct_count += 1
        
        # Calculate score as percentage
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        # Update attempt
        attempt.score = score
        attempt.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return {
            "message": "Quiz completed",
            "score": score,
            "correct_count": correct_count,
            "total_questions": total_questions
        }, 200

class UserAttemptsAPI(Resource):
    @auth_required('token')
    def get(self):
        attempts = UserQuizAttempt.query.filter_by(user_id=current_user.id).all()
        
        result = []
        for attempt in attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            result.append({
                "attempt_id": attempt.id,
                "quiz_id": attempt.quiz_id,
                "quiz_title": quiz.title if quiz else "Unknown",
                "score": attempt.score,
                "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
                "started_at": attempt.started_at.isoformat()
            })
        
        return result
class AdminDashboardAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        # Get total counts
        total_users = User.query.count()
        total_quizzes = Quiz.query.count()
        total_subjects = Subject.query.count()
        total_chapters = Chapter.query.count()
        total_attempts = UserQuizAttempt.query.count()
        
        # Calculate average score
        attempts = UserQuizAttempt.query.filter(UserQuizAttempt.score.isnot(None)).all()
        average_score = 0
        if attempts:
            average_score = sum(attempt.score for attempt in attempts) / len(attempts)
        
        # Get recent quizzes
        recent_quizzes = []
        quizzes = Quiz.query.order_by(Quiz.created_at.desc()).limit(5).all()
        for quiz in quizzes:
            chapter = Chapter.query.get(quiz.chapter_id)
            question_count = Question.query.filter_by(quiz_id=quiz.id).count()
            recent_quizzes.append({
                'id': quiz.id,
                'title': quiz.title,
                'chapter_name': chapter.name if chapter else 'Unknown',
                'question_count': question_count,
                'is_published': quiz.is_published
            })
        
        # Get recent attempts
        recent_attempts = []
        attempts = UserQuizAttempt.query.filter(UserQuizAttempt.completed_at.isnot(None)).order_by(UserQuizAttempt.completed_at.desc()).limit(5).all()
        for attempt in attempts:
            user = User.query.get(attempt.user_id)
            quiz = Quiz.query.get(attempt.quiz_id)
            recent_attempts.append({
                'id': attempt.id,
                'student_name': user.email.split('@')[0] if user else 'Unknown',
                'quiz_title': quiz.title if quiz else 'Unknown',
                'score': attempt.score,
                'completed_at': attempt.completed_at.isoformat()
            })
        
        return {
            'stats': {
                'total_users': total_users,
                'total_quizzes': total_quizzes,
                'total_subjects': total_subjects,
                'total_chapters': total_chapters,
                'total_attempts': total_attempts,
                'average_score': average_score
            },
            'recent_quizzes': recent_quizzes,
            'recent_attempts': recent_attempts
        }
class UserListAPI(Resource):
    @marshal_with(user_list_fields)
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        users = User.query.all()
        user_list = []
        for user in users:
            # Determine role
            role = 'admin' if any(role.name == 'admin' for role in user.roles) else 'user'
            
            user_dict = {
                'id': user.id,
                'username': user.email.split('@')[0],  # Use email prefix as username
                'email': user.email,
                'full_name': user.full_name,
                'qualification': user.qualification,
                'dob': str(user.dob) if hasattr(user, 'dob') and user.dob else None,
                'role': role,
                'status': user.status if hasattr(user, 'status') else 'active',
                'active': user.active, 
                'created_at': user.created_at if hasattr(user, 'created_at') else datetime.now(),
                'last_activity': user.last_login_at if hasattr(user, 'last_login_at') else None
            }
            user_list.append(user_dict)
        return user_list
    
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        data = request.get_json()
        
        # Check if email already exists
        if User.query.filter_by(email=data.get('email')).first():
            return {"message": "Email already registered", "errors": {"email": "Email already exists"}}, 400
        
        # Get role
        role_name = data.get('role', 'user')
        role = Role.query.filter_by(name=role_name).first()
        
        # Create user
        datastore = current_app.security.datastore
        user = datastore.create_user(
            email=data.get('email'),
            password=hash_password(data.get('password')),
            full_name=data.get('full_name'),
            qualification=data.get('qualification'),
            dob=data.get('dob'),
            roles=[role]
        )
        
        # Add status if model supports it
        if hasattr(user, 'status'):
            user.status = data.get('status', 'active')
        
        # Add subject interests if provided
        if data.get('subject_interests') and hasattr(user, 'subject_interests'):
            user.subject_interests = data.get('subject_interests')
            
        db.session.commit()
        
        return {
            "message": "User created successfully",
            "user": {
                'id': user.id,
                'username': user.email.split('@')[0],
                'email': user.email,
                'full_name': user.full_name,
                'qualification': user.qualification,
                'dob': str(user.dob) if hasattr(user, 'dob') and user.dob else None,
                'role': role_name,
                'status': user.status if hasattr(user, 'status') else 'active',
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else datetime.now().isoformat()
            }
        }, 201

class UserAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        role = 'admin' if any(role.name == 'admin' for role in user.roles) else 'user'
        
        return {
            'id': user.id,
            'username': user.email.split('@')[0],
            'email': user.email,
            'full_name': user.full_name,
            'qualification': user.qualification,
            'dob': str(user.dob) if hasattr(user, 'dob') and user.dob else None,
            'role': role,
            'status': user.status if hasattr(user, 'status') else 'active',
            'created_at': user.created_at if hasattr(user, 'created_at') else datetime.now(),
            'last_activity': user.last_login_at if hasattr(user, 'last_login_at') else None
        }
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        data = request.get_json()
        datastore = current_app.security.datastore
        
        # Check if trying to update email and it already exists
        if data.get('email') and data.get('email') != user.email:
            if User.query.filter_by(email=data.get('email')).first():
                return {"message": "Email already registered", "errors": {"email": "Email already exists"}}, 400
            user.email = data.get('email')
        
        # Update user fields
        if data.get('full_name'):
            user.full_name = data.get('full_name')
        
        if data.get('qualification'):
            user.qualification = data.get('qualification')
        
        if data.get('dob') and hasattr(user, 'dob'):
            user.dob = data.get('dob')
        
        if data.get('status') and hasattr(user, 'status'):
            user.status = data.get('status')
        
        # Update role if changed
        if data.get('role'):
            current_role = 'admin' if any(role.name == 'admin' for role in user.roles) else 'user'
            if data.get('role') != current_role:
                # Remove all existing roles
                for role in user.roles:
                    datastore.remove_role_from_user(user, role.name)
                
                # Add new role
                datastore.add_role_to_user(user, data.get('role'))
        
        # Update subject interests if provided
        if 'subject_interests' in data and hasattr(user, 'subject_interests'):
            user.subject_interests = data.get('subject_interests')
        
        db.session.commit()
        
        return {"message": "User updated successfully"}
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        # Check if trying to delete the last admin
        if any(role.name == 'admin' for role in user.roles):
            admin_count = 0
            for u in User.query.all():
                if any(role.name == 'admin' for role in u.roles):
                    admin_count += 1
            
            if admin_count <= 1:
                return {"message": "Cannot delete the only admin user"}, 400
        
        db.session.delete(user)
        db.session.commit()
        
        return {"message": "User deleted successfully"}

class UserStatsAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        # Get user's quiz attempts
        attempts = UserQuizAttempt.query.filter_by(user_id=user_id).all() if 'UserQuizAttempt' in globals() else []
        
        # Calculate statistics
        quizzes_taken = len(attempts)
        scores = [attempt.score for attempt in attempts if attempt.score is not None]
        
        average_score = sum(scores) / len(scores) if scores else None
        best_score = max(scores) if scores else None
        
        # Get recent attempts
        recent_attempts = []
        sorted_attempts = sorted(attempts, key=lambda x: x.completed_at or datetime.min, reverse=True)
        
        for attempt in sorted_attempts[:5]:  # Get 5 most recent attempts
            if attempt.completed_at:  # Only include completed attempts
                quiz = Quiz.query.get(attempt.quiz_id) if 'Quiz' in globals() else None
                if quiz:
                    chapter = Chapter.query.get(quiz.chapter_id) if 'Chapter' in globals() and quiz.chapter_id else None
                    subject = Subject.query.get(chapter.subject_id) if 'Subject' in globals() and chapter and chapter.subject_id else None
                    
                    recent_attempts.append({
                        'id': attempt.id,
                        'quiz_id': quiz.id,
                        'quiz_title': quiz.title,
                        'subject_name': subject.name if subject else "Unknown",
                        'score': attempt.score,
                        'completed_at': attempt.completed_at.isoformat()
                    })
        
        return {
            'quizzes_taken': quizzes_taken,
            'average_score': average_score,
            'best_score': best_score,
            'recent_attempts': recent_attempts
        }

class UserStatusAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def patch(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return {"message": "Status is required"}, 400
        
        if hasattr(user, 'status'):
            user.status = new_status
            db.session.commit()
            return {"message": "User status updated successfully"}
        else:
            return {"message": "User model does not have a status field"}, 400

class UserExportAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        users = User.query.all()
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Username', 'Email', 'Full Name', 'Role', 'Status', 
            'Qualification', 'Date of Birth', 'Registration Date', 
            'Last Activity', 'Quizzes Taken', 'Average Score'
        ])
        
        # Write user data
        for user in users:
            # Get role
            role = 'admin' if any(role.name == 'admin' for role in user.roles) else 'user'
            
            # Get quiz statistics
            attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all() if 'UserQuizAttempt' in globals() else []
            quizzes_taken = len(attempts)
            scores = [attempt.score for attempt in attempts if attempt.score is not None]
            average_score = sum(scores) / len(scores) if scores else 0
            
            writer.writerow([
                user.id,
                user.email.split('@')[0],
                user.email,
                user.full_name or '',
                role,
                user.status if hasattr(user, 'status') else 'active',
                user.qualification or '',
                user.dob if hasattr(user, 'dob') else '',
                user.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(user, 'created_at') and user.created_at else '',
                user.last_login_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(user, 'last_login_at') and user.last_login_at else '',
                quizzes_taken,
                f"{average_score:.1f}%" if average_score else '0.0%'
            ])
        
        # Create response
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=users_export.csv"}
        )
class UserDashboardAPI(Resource):
    @auth_required('token')
    def get(self):
        user_id = current_user.id
        
        # Get user's quiz attempts
        attempts = UserQuizAttempt.query.filter_by(user_id=user_id).all()
        
        # Get available quizzes (published ones)
        available_quizzes = Quiz.query.filter_by(is_published=True).all()
        
        # Get subjects with chapters and quizzes
        subjects = Subject.query.all()
        subject_data = []
        
        for subject in subjects:
            chapters = Chapter.query.filter_by(subject_id=subject.id).all()
            chapter_data = []
            
            for chapter in chapters:
                quizzes = Quiz.query.filter_by(chapter_id=chapter.id, is_published=True).all()
                if quizzes:  # Only include chapters with published quizzes
                    chapter_data.append({
                        'id': chapter.id,
                        'name': chapter.name,
                        'quiz_count': len(quizzes)
                    })
            
            if chapter_data:  # Only include subjects with chapters that have quizzes
                subject_data.append({
                    'id': subject.id,
                    'name': subject.name,
                    'chapters': chapter_data
                })
        
        # Calculate statistics
        completed_attempts = [a for a in attempts if a.completed_at is not None]
        in_progress_attempts = [a for a in attempts if a.started_at is not None and a.completed_at is None]
        
        # Get recent attempts
        recent_attempts = []
        sorted_attempts = sorted(completed_attempts, key=lambda x: x.completed_at, reverse=True)
        
        for attempt in sorted_attempts[:5]:  # Get 5 most recent attempts
            quiz = Quiz.query.get(attempt.quiz_id)
            if quiz:
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id) if chapter else None
                
                recent_attempts.append({
                    'id': attempt.id,
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'subject_name': subject.name if subject else "Unknown",
                    'chapter_name': chapter.name if chapter else "Unknown",
                    'score': attempt.score,
                    'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None
                })
        
        # Get recommended quizzes (quizzes the user hasn't taken yet)
        taken_quiz_ids = [a.quiz_id for a in attempts]
        recommended_quizzes = []
        
        for quiz in available_quizzes:
            if quiz.id not in taken_quiz_ids:
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id) if chapter else None
                
                recommended_quizzes.append({
                    'id': quiz.id,
                    'title': quiz.title,
                    'subject': subject.name if subject else "Unknown",
                    'chapter': chapter.name if chapter else "Unknown",
                    'time_limit': quiz.time_limit,
                    'question_count': Question.query.filter_by(quiz_id=quiz.id).count()
                })
        
        # Limit to 5 recommended quizzes
        recommended_quizzes = recommended_quizzes[:5]
        
        # Get in-progress quizzes
        in_progress_quizzes = []
        for attempt in in_progress_attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            if quiz:
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id) if chapter else None
                
                in_progress_quizzes.append({
                    'id': quiz.id,
                    'attempt_id': attempt.id,
                    'title': quiz.title,
                    'subject': subject.name if subject else "Unknown",
                    'chapter': chapter.name if chapter else "Unknown",
                    'started_at': attempt.started_at.isoformat() if attempt.started_at else None
                })
        
        # Calculate overall statistics
        total_quizzes_taken = len(completed_attempts)
        scores = [a.score for a in completed_attempts if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        best_score = max(scores) if scores else 0
        print("heloo")
        
        return {
            'user': {
                'id': current_user.id,
                'name': current_user.full_name,
                'email': current_user.email
            },
            'stats': {
                'total_quizzes_taken': total_quizzes_taken,
                'quizzes_in_progress': len(in_progress_attempts),
                'average_score': round(avg_score, 1),
                'best_score': round(best_score, 1)
            },
            'recent_attempts': recent_attempts,
            'in_progress_quizzes': in_progress_quizzes,
            'recommended_quizzes': recommended_quizzes,
            'subjects': subject_data
        }

# Add API endpoints for quiz taking
class QuizStartAPI(Resource):
    @auth_required('token')
    def post(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        if not quiz.is_published:
            return {"message": "This quiz is not available"}, 403
        
        # Check if there's an existing incomplete attempt
        existing_attempt = UserQuizAttempt.query.filter_by(
            user_id=current_user.id, 
            quiz_id=quiz_id, 
            completed_at=None
        ).first()
        
        if existing_attempt:
            # Return the existing attempt
            return {
                "message": "Continuing existing attempt",
                "attempt_id": existing_attempt.id,
                "started_at": existing_attempt.started_at.isoformat()
            }
        
        # Create a new attempt
        new_attempt = UserQuizAttempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            started_at=datetime.now()
        )
        db.session.add(new_attempt)
        db.session.commit()
        
        return {
            "message": "Quiz attempt started",
            "attempt_id": new_attempt.id,
            "started_at": new_attempt.started_at.isoformat()
        }

class QuizDetailAPI(Resource):
    @auth_required('token')
    def get(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        if not quiz.is_published and not any(role.name == 'admin' for role in current_user.roles):
            return {"message": "This quiz is not available"}, 403
        
        # Get chapter and subject info
        chapter = Chapter.query.get(quiz.chapter_id)
        subject = Subject.query.get(chapter.subject_id) if chapter else None
        
        # Get questions
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        question_data = []
        
        for question in questions:
            options = Option.query.filter_by(question_id=question.id).all()
            
            # For users, don't include which option is correct
            if not any(role.name == 'admin' for role in current_user.roles):
                option_data = [{'id': o.id, 'text': o.text} for o in options]
            else:
                option_data = [{'id': o.id, 'text': o.text, 'is_correct': o.is_correct} for o in options]
            
            question_data.append({
                'id': question.id,
                'text': question.text,
                'options': option_data
            })
        
        return {
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'time_limit': quiz.time_limit,
            'subject': subject.name if subject else None,
            'chapter': chapter.name if chapter else None,
            'questions': question_data,
            'question_count': len(question_data)
        }

class QuizSubmitAPI(Resource):
    @auth_required('token')
    def post(self, attempt_id):
        attempt = UserQuizAttempt.query.get(attempt_id)
        if not attempt:
            return {"message": "Attempt not found"}, 404
        
        if attempt.user_id != current_user.id:
            return {"message": "Unauthorized access"}, 403
        
        if attempt.completed_at:
            return {"message": "This attempt has already been completed"}, 400
        
        data = request.get_json()
        answers = data.get('answers', {})
        
        # Get the quiz
        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        # Get all questions for this quiz
        questions = Question.query.filter_by(quiz_id=quiz.id).all()
        
        # Calculate score
        correct_count = 0
        total_questions = len(questions)
        
        for question in questions:
            # Get the selected answer for this question
            selected_option_id = answers.get(str(question.id))
            
            if selected_option_id:
                print(f"Selected option ID: {selected_option_id['option_id']}")
                # Check if the selected option is correct
                answered_option_id=selected_option_id['option_id']
                selected_option = Option.query.get(answered_option_id)
                if selected_option and selected_option.question_id == question.id and selected_option.is_correct:
                    correct_count += 1
            
            # Save the user's answer
            if selected_option_id:
                user_answer = UserAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    option_id=answered_option_id
                )
                db.session.add(user_answer)
        
        # Calculate percentage score
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        # Update the attempt
        attempt.score = score
        attempt.completed_at = datetime.now()
        db.session.commit()
        
        return {
            "message": "Quiz submitted successfully",
            "attempt_id": attempt.id,
            "score": score,
            "correct_count": correct_count,
            "total_questions": total_questions
        }

class AttemptDetailAPI(Resource):
    @auth_required('token')
    def get(self, attempt_id):
        attempt = UserQuizAttempt.query.get(attempt_id)
        if not attempt:
            return {"message": "Attempt not found"}, 404
        
        # Check if the user is authorized to view this attempt
        if attempt.user_id != current_user.id and not any(role.name == 'admin' for role in current_user.roles):
            return {"message": "Unauthorized access"}, 403
        
        # Get quiz details
        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        chapter = Chapter.query.get(quiz.chapter_id)
        subject = Subject.query.get(chapter.subject_id) if chapter else None
        
        return {
            'id': attempt.id,
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'subject': subject.name if subject else None,
            'chapter': chapter.name if chapter else None,
            'score': attempt.score,
            'started_at': attempt.started_at.isoformat() if attempt.started_at else None,
            'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
            'time_taken': (attempt.completed_at - attempt.started_at).total_seconds() if attempt.completed_at and attempt.started_at else None
        }

class AttemptAnswersAPI(Resource):
    @auth_required('token')
    def get(self, attempt_id):
        attempt = UserQuizAttempt.query.get(attempt_id)
        if not attempt:
            return {"message": "Attempt not found"}, 404
        
        # Check if the user is authorized to view this attempt
        if attempt.user_id != current_user.id and not any(role.name == 'admin' for role in current_user.roles):
            return {"message": "Unauthorized access"}, 403
        
        # Get quiz details
        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        
        # Get all questions for this quiz
        questions = Question.query.filter_by(quiz_id=quiz.id).all()
        
        # Get user's answers
        user_answers = UserAnswer.query.filter_by(attempt_id=attempt_id).all()
        user_answer_dict = {answer.question_id: answer.option_id for answer in user_answers}
        
        question_data = []
        for question in questions:
            options = Option.query.filter_by(question_id=question.id).all()
            correct_option = next((o for o in options if o.is_correct), None)
            
            selected_option_id = user_answer_dict.get(question.id)
            is_correct = selected_option_id == correct_option.id if correct_option and selected_option_id else False
            
            question_data.append({
                'id': question.id,
                'text': question.text,
                'options': [{'id': o.id, 'text': o.text, 'is_correct': o.is_correct} for o in options],
                'selected_option_id': selected_option_id,
                'is_correct': is_correct
            })
        
        return question_data

class QuizExportAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        try:
            # Get the current admin's email
            admin_email = current_user.email
            
            # Import the task function
            from backend.tasks import generate_quiz_export
            
            # Run synchronously for testing instead of using Celery
            result = generate_quiz_export(admin_email)
            return {'message': 'Export generated successfully', 'download_url': result.get('download_url', '')}, 200
            
            # The Celery version below can be uncommented once Redis is properly set up
            # task = current_app.celery.send_task('backend.tasks.generate_quiz_export', args=[admin_email])
            # return {
            #     'message': 'Export job started successfully. You will receive an email when it is ready.',
            #     'task_id': task.id
            # }, 202
            
        except Exception as e:
            current_app.logger.error(f"Error starting quiz export: {str(e)}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            return {'message': f'Failed to start export: {str(e)}'}, 500

class UserActivationAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    def patch(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404
        
        data = request.get_json()
        active_status = data.get('active')
        
        if active_status is None:
            return {"message": "Active status is required"}, 400
        
        # Check if trying to deactivate the last admin
        if not active_status and any(role.name == 'admin' for role in user.roles):
            admin_count = 0
            active_admin_count = 0
            for u in User.query.all():
                if any(role.name == 'admin' for role in u.roles):
                    admin_count += 1
                    if u.active:
                        active_admin_count += 1
            
            if active_admin_count <= 1 and user.active:
                return {"message": "Cannot deactivate the only active admin user"}, 400
        
        user.active = active_status
        db.session.commit()
        
        return {"message": "User activation status updated successfully", "active": user.active}

api.add_resource(UserDashboardAPI, '/user/dashboard')
api.add_resource(QuizStartAPI, '/quizzes/<int:quiz_id>/start')
api.add_resource(QuizDetailAPI, '/quizzes/<int:quiz_id>')
api.add_resource(QuizSubmitAPI, '/attempts/<int:attempt_id>/submit')
api.add_resource(AttemptDetailAPI, '/attempts/<int:attempt_id>')
api.add_resource(AttemptAnswersAPI, '/attempts/<int:attempt_id>/answers')

# Register the new resources
api.add_resource(UserListAPI, '/admin/users')
api.add_resource(UserAPI, '/admin/users/<int:user_id>')
api.add_resource(UserStatsAPI, '/admin/users/<int:user_id>/stats')
api.add_resource(UserStatusAPI, '/admin/users/<int:user_id>/status')
api.add_resource(UserExportAPI, '/admin/users/export')


api.add_resource(SubjectAPI, '/subjects/<int:subject_id>')
api.add_resource(SubjectListAPI, '/subjects')
api.add_resource(ChapterAPI, '/chapters/<int:chapter_id>')
api.add_resource(ChapterListAPI, '/chapters', '/subjects/<int:subject_id>/chapters')
api.add_resource(QuizAPI, '/quizzes/<int:quiz_id>')
api.add_resource(QuizListAPI, '/quizzes', '/chapters/<int:chapter_id>/quizzes')
api.add_resource(QuestionAPI, '/questions/<int:question_id>')
api.add_resource(QuestionListAPI, '/quizzes/<int:quiz_id>/questions')
api.add_resource(QuizAttemptAPI, '/attempts/<int:attempt_id>', '/quizzes/<int:quiz_id>/attempt')
api.add_resource(UserAttemptsAPI, '/user/attempts')

# Make sure this line is at the bottom of the file and not duplicated
api.add_resource(AdminDashboardAPI, '/admin/dashboard')
api.add_resource(QuizExportAPI, '/admin/quizzes/export')
api.add_resource(UserActivationAPI, '/admin/users/<int:user_id>/activate')