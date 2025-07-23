from app import app
from backend.models import *
from backend.tasks import send_monthly_activity_report
from datetime import datetime, timedelta
import random

def create_test_data_for_last_month():
    """Create test quiz attempts for last month to test monthly reports"""
    with app.app_context():
        # Calculate last month
        today = datetime.now()
        if today.month == 1:
            target_month = 12
            target_year = today.year - 1
        else:
            target_month = today.month - 1
            target_year = today.year
        
        print(f"Creating test data for {target_month}/{target_year}")
        
        # Get or create test user
        user = User.query.filter_by(email="user1@gmail.com").first()
        if not user:
            print("❌ Test user not found. Please run the app first to create users.")
            return
        
        # Get or create subjects and chapters
        subject = Subject.query.first()
        if not subject:
            subject = Subject(name="Mathematics", description="Math subject", created_by=1)
            db.session.add(subject)
            db.session.flush()
        
        chapter = Chapter.query.filter_by(subject_id=subject.id).first()
        if not chapter:
            chapter = Chapter(name="Algebra", subject_id=subject.id, description="Algebra chapter", created_by=1)
            db.session.add(chapter)
            db.session.flush()
        
        # Create test quizzes
        test_quizzes = []
        for i in range(5):
            quiz = Quiz(
                title=f"Test Quiz {i+1}",
                description=f"Test quiz {i+1} for monthly report testing",
                time_limit=30,
                chapter_id=chapter.id,
                created_by=1,
                is_published=True,
                created_at=datetime(target_year, target_month, 1)
            )
            db.session.add(quiz)
            db.session.flush()
            
            # Add a test question
            question = Question(
                text=f"Test question for quiz {i+1}?",
                quiz_id=quiz.id,
                created_at=datetime(target_year, target_month, 1)
            )
            db.session.add(question)
            db.session.flush()
            
            # Add options
            for j in range(4):
                option = Option(
                    question_id=question.id,
                    text=f"Option {j+1}",
                    is_correct=(j == 0)  # First option is correct
                )
                db.session.add(option)
            
            test_quizzes.append(quiz.id)
        
        db.session.commit()
        
        # Create test attempts for last month
        for i, quiz_id in enumerate(test_quizzes):
            for attempt_num in range(random.randint(1, 3)):  # 1-3 attempts per quiz
                # Create random date in target month
                day = random.randint(1, 28)  # Safe day for any month
                hour = random.randint(9, 18)
                minute = random.randint(0, 59)
                
                start_time = datetime(target_year, target_month, day, hour, minute)
                end_time = start_time + timedelta(minutes=random.randint(10, 45))
                
                # Create attempt
                attempt = UserQuizAttempt(
                    user_id=user.id,
                    quiz_id=quiz_id,
                    score=random.randint(60, 95),  # Random score between 60-95%
                    started_at=start_time,
                    completed_at=end_time
                )
                db.session.add(attempt)
                db.session.flush()
                
                # Add a test answer
                question = Question.query.filter_by(quiz_id=quiz_id).first()
                if question:
                    correct_option = Option.query.filter_by(question_id=question.id, is_correct=True).first()
                    if correct_option:
                        user_answer = UserAnswer(
                            attempt_id=attempt.id,
                            question_id=question.id,
                            option_id=correct_option.id
                        )
                        db.session.add(user_answer)
        
        db.session.commit()
        print(f"✅ Created test data for monthly report testing")
        print(f"📊 User {user.email} now has quiz attempts for {target_month}/{target_year}")

def test_monthly_report():
    """Test the monthly report generation"""
    with app.app_context():
        print("=== TESTING MONTHLY REPORT GENERATION ===")
        result = send_monthly_activity_report()
        print(f"Task result: {result}")

if __name__ == "__main__":
    print("1. Creating test data...")
    create_test_data_for_last_month()
    
    print("\n2. Testing monthly report generation...")
    test_monthly_report()