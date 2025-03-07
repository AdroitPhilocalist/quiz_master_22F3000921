from flask import jsonify, request
from flask_restful import Api, Resource, fields, marshal_with
from flask_security import auth_required, current_user, roles_required
from backend.models import db, User, Role, Quiz, Question, Option, UserQuizAttempt, UserAnswer

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

quiz_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'description': fields.String,
    'time_limit': fields.Integer,
    'created_by': fields.Integer,
    'created_at': fields.DateTime,
    'is_published': fields.Boolean
}

quiz_detail_fields = {
    'id': fields.Integer,
    'title': fields.String,
    'description': fields.String,
    'time_limit': fields.Integer,
    'created_by': fields.Integer,
    'created_at': fields.DateTime,
    'is_published': fields.Boolean,
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

class QuizListAPI(Resource):
    @marshal_with(quiz_fields)
    @auth_required('token')
    def get(self):
        if 'admin' in [role.name for role in current_user.roles]:
            # Admins can see all quizzes
            quizzes = Quiz.query.all()
        else:
            # Regular users can only see published quizzes
            quizzes = Quiz.query.filter_by(is_published=True).all()
        return quizzes
    
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        time_limit = data.get('time_limit', 600)  # Default 10 minutes
        
        if not title:
            return {"message": "Title is required"}, 400
        
        quiz = Quiz(
            title=title,
            description=description,
            time_limit=time_limit,
            created_by=current_user.id,
            is_published=False
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

# Register resources
api.add_resource(QuizAPI, '/quizzes/<int:quiz_id>')
api.add_resource(QuizListAPI, '/quizzes')
api.add_resource(QuestionAPI, '/questions/<int:question_id>')
api.add_resource(QuestionListAPI, '/quizzes/<int:quiz_id>/questions')
api.add_resource(QuizAttemptAPI, '/attempts/<int:attempt_id>', '/quizzes/<int:quiz_id>/attempt')
api.add_resource(UserAttemptsAPI, '/user/attempts')