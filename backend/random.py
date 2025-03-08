from flask import jsonify, request
from flask_restful import Api, Resource, fields, marshal_with
from flask_security import auth_required, current_user, roles_required
from backend.models import db, User, Role, Quiz, Question, Option, UserQuizAttempt, UserAnswer, Subject, Chapter
from datetime import datetime

api = Api(prefix='/api')

# Existing field definitions...

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

# Update quiz_fields to include chapter_id
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

# Update quiz_detail_fields to include chapter_id
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

# Register new resources
api.add_resource(SubjectAPI, '/subjects/<int:subject_id>')
api.add_resource(SubjectListAPI, '/subjects')
api.add_resource(ChapterAPI, '/chapters/<int:chapter_id>')
api.add_resource(ChapterListAPI, '/chapters', '/subjects/<int:subject_id>/chapters')
api.add_resource(QuizListAPI, '/quizzes', '/chapters/<int:chapter_id>/quizzes')

# Existing resource registrations...