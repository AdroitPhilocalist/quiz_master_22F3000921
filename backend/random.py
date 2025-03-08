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