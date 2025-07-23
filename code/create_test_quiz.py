from app import app
from backend.models import *
from datetime import datetime

def create_test_quiz():
    with app.app_context():
        # Check if we have subjects and chapters
        subject = Subject.query.first()
        if not subject:
            subject = Subject(name="Mathematics", description="Math subject for testing", created_by=1)
            db.session.add(subject)
            db.session.commit()
            print(f"Created subject: {subject.name}")
        
        chapter = Chapter.query.filter_by(subject_id=subject.id).first()
        if not chapter:
            chapter = Chapter(name="Algebra", subject_id=subject.id, description="Algebra chapter", created_by=1)
            db.session.add(chapter)
            db.session.commit()
            print(f"Created chapter: {chapter.name}")
        
        # Create a NEW quiz with current timestamp (this will trigger notifications)
        new_quiz = Quiz(
            title=f"Test Quiz - {datetime.now().strftime('%H:%M:%S')}",
            description="This quiz was created for testing daily reminders",
            time_limit=30,
            chapter_id=chapter.id,
            created_by=1,  # Admin user ID
            is_published=True,
            created_at=datetime.now()  # This is key - new quiz within 24 hours
        )
        db.session.add(new_quiz)
        
        # Add some test questions to make it a complete quiz
        db.session.commit()  # Commit quiz first to get ID
        
        question1 = Question(
            text="What is 2 + 2?",
            quiz_id=new_quiz.id,
            created_at=datetime.now()
        )
        db.session.add(question1)
        db.session.commit()  # Commit question to get ID
        
        # Add options
        options = [
            Option(question_id=question1.id, text="3", is_correct=False),
            Option(question_id=question1.id, text="4", is_correct=True),
            Option(question_id=question1.id, text="5", is_correct=False),
            Option(question_id=question1.id, text="6", is_correct=False)
        ]
        for option in options:
            db.session.add(option)
        
        db.session.commit()
        
        print(f"✅ Created test quiz: {new_quiz.title} (ID: {new_quiz.id})")
        print(f"✅ Added question with 4 options")
        print(f"✅ This should trigger BOTH inactivity reminders AND new quiz notifications!")

if __name__ == "__main__":
    create_test_quiz()