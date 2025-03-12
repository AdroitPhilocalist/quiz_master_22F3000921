import csv
from io import StringIO
from flask import jsonify, request
from flask_restful import Api, Resource, fields, marshal_with
from flask_security import auth_required, current_user, roles_required
from backend.models import *
from datetime import datetime
api = Api(prefix='/api')

# Define fields for marshalling
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

# Register resources
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