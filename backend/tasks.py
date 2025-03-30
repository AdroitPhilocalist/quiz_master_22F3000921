import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from backend.models import *
from sqlalchemy import func, desc
from flask import current_app
import calendar
import csv
import os
from io import StringIO
from backend.models import db
def send_email(recipient, subject, body):
    """Helper function to send an email"""
    try:
        # Get email configuration from app config
        sender_email = current_app.config.get('MAIL_DEFAULT_SENDER', 'quizmaster@example.com')
        smtp_server = current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_username = current_app.config.get('MAIL_USERNAME', sender_email)
        smtp_password = current_app.config.get('MAIL_PASSWORD', '')
        
        # Create message
        message = MIMEMultipart()
        message['From'] = sender_email
        message['To'] = recipient
        message['Subject'] = subject
        
        # Add body to email
        message.attach(MIMEText(body, 'html'))
        
        # Connect to server and send
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)
        server.quit()
        
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def send_quiz_reminders():
    """Send reminders about new quizzes to users"""
    try:
        # Get quizzes created in the last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_quizzes = Quiz.query.filter(
            Quiz.created_at >= yesterday,
            Quiz.is_published == True
        ).all()
        
        # If there are new quizzes, send reminders
        if new_quizzes:
            # Get all active users
            users = User.query.filter_by(active=True).all()
            
            # Create email content
            subject = "New Quizzes Available - Quiz Master"
            
            # List of new quizzes
            quiz_list = ""
            for quiz in new_quizzes:
                quiz_list += f"<li><strong>{quiz.title}</strong>: {quiz.description or 'No description'}</li>"
            
            # Send email to each user
            for user in users:
                # Skip if no email
                if not user.email:
                    continue
                    
                # Personalize email
                body = f"""
                <html>
                <body>
                    <h2>Hello {user.full_name or 'there'}!</h2>
                    <p>We have some new quizzes available for you to attempt:</p>
                    <ul>
                        {quiz_list}
                    </ul>
                    <p>Visit <a href="http://localhost:5000">Quiz Master</a> to attempt these quizzes.</p>
                    <p>Happy learning!</p>
                    <p>The Quiz Master Team</p>
                </body>
                </html>
                """
                
                # Send the email
                send_email(user.email, subject, body)
                
            current_app.logger.info(f"Sent quiz reminders to {len(users)} users about {len(new_quizzes)} new quizzes")
        else:
            current_app.logger.info("No new quizzes to send reminders about")
            
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending quiz reminders: {str(e)}")
        return False


def send_monthly_activity_report():
    """
    Generate and send monthly activity reports to all users.
    This task should be scheduled to run on the first day of each month.
    """
    try:
        # Get the previous month's date range
        today = datetime.utcnow()
        first_day_of_current_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
        first_day_of_previous_month = last_day_of_previous_month.replace(day=1)
        
        # Format month name for the report
        previous_month_name = first_day_of_previous_month.strftime("%B %Y")
        
        # Get all active users
        users = User.query.filter_by(active=True).all()
        
        for user in users:
            # Skip if no email
            if not user.email:
                continue
                
            # Get user's quiz attempts for the previous month
            user_attempts = UserQuizAttempt.query.filter(
                UserQuizAttempt.user_id == user.id,
                UserQuizAttempt.completed_at.isnot(None),
                UserQuizAttempt.completed_at >= first_day_of_previous_month,
                UserQuizAttempt.completed_at <= last_day_of_previous_month
            ).all()
            
            # If user has no attempts in the previous month, send a different message
            if not user_attempts:
                subject = f"Your Quiz Master Activity Report - {previous_month_name}"
                body = f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                        <h2 style="color: #4a6ee0;">Hello {user.full_name or 'there'}!</h2>
                        <p>We noticed you didn't take any quizzes on Quiz Master during {previous_month_name}.</p>
                        <p>We have many interesting quizzes waiting for you. Why not check them out?</p>
                        <p><a href="http://localhost:5000" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Visit Quiz Master</a></p>
                        <p>We hope to see you active this month!</p>
                        <p>The Quiz Master Team</p>
                    </div>
                </body>
                </html>
                """
                send_email(user.email, subject, body)
                continue
            
            # Calculate statistics
            total_attempts = len(user_attempts)
            completed_attempts = sum(1 for attempt in user_attempts if attempt.completed_at is not None)
            
            # Calculate scores
            scores = [attempt.score for attempt in user_attempts if attempt.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0
            best_score = max(scores) if scores else 0
            
            # Get subject performance
            subject_performance = {}
            for attempt in user_attempts:
                quiz = Quiz.query.get(attempt.quiz_id)
                if quiz and quiz.chapter_id:
                    chapter = Chapter.query.get(quiz.chapter_id)
                    if chapter and chapter.subject_id:
                        subject = Subject.query.get(chapter.subject_id)
                        if subject:
                            if subject.name not in subject_performance:
                                subject_performance[subject.name] = {
                                    'attempts': 0,
                                    'total_score': 0,
                                    'completed': 0
                                }
                            subject_performance[subject.name]['attempts'] += 1
                            if attempt.score is not None:
                                subject_performance[subject.name]['total_score'] += attempt.score
                                subject_performance[subject.name]['completed'] += 1
            
            # Calculate average score per subject
            for subject_name in subject_performance:
                if subject_performance[subject_name]['completed'] > 0:
                    subject_performance[subject_name]['avg_score'] = round(
                        subject_performance[subject_name]['total_score'] / 
                        subject_performance[subject_name]['completed']
                    )
                else:
                    subject_performance[subject_name]['avg_score'] = 0
            
            # Get user ranking
            # First, get all users who completed quizzes in the previous month
            user_rankings = db.session.query(
                UserQuizAttempt.user_id,
                func.avg(UserQuizAttempt.score).label('average_score'),
                func.count(UserQuizAttempt.id).label('attempt_count')
            ).filter(
                UserQuizAttempt.completed_at.isnot(None),
                UserQuizAttempt.completed_at >= first_day_of_previous_month,
                UserQuizAttempt.completed_at <= last_day_of_previous_month,
                UserQuizAttempt.score.isnot(None)
            ).group_by(UserQuizAttempt.user_id).order_by(
                desc('average_score'), desc('attempt_count')
            ).all()
            
            # Find user's rank
            user_rank = 0
            total_users = len(user_rankings)
            for i, ranking in enumerate(user_rankings):
                if ranking.user_id == user.id:
                    user_rank = i + 1
                    break
            
            # Generate quiz list
            quiz_list_html = ""
            for attempt in user_attempts:
                quiz = Quiz.query.get(attempt.quiz_id)
                if quiz:
                    status = "Completed" if attempt.completed_at else "In Progress"
                    score = f"{attempt.score}%" if attempt.score is not None else "N/A"
                    date = attempt.completed_at.strftime("%d %b %Y") if attempt.completed_at else attempt.started_at.strftime("%d %b %Y")
                    
                    quiz_list_html += f"""
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">{quiz.title}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">{date}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">{status}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">{score}</td>
                    </tr>
                    """
            
            # Generate subject performance HTML
            subject_html = ""
            for subject_name, data in subject_performance.items():
                subject_html += f"""
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{subject_name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{data['attempts']}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{data['avg_score']}%</td>
                </tr>
                """
            
            # Create email content
            subject = f"Your Quiz Master Activity Report - {previous_month_name}"
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4a6ee0;">Hello {user.full_name or 'there'}!</h2>
                    <p>Here's your activity report for <strong>{previous_month_name}</strong>:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #4a6ee0;">Monthly Summary</h3>
                        <p><strong>Total Quizzes Attempted:</strong> {total_attempts}</p>
                        <p><strong>Quizzes Completed:</strong> {completed_attempts}</p>
                        <p><strong>Average Score:</strong> {round(avg_score)}%</p>
                        <p><strong>Best Score:</strong> {best_score}%</p>
                        <p><strong>Your Ranking:</strong> {user_rank} out of {total_users} active users</p>
                    </div>
                    
                    <h3 style="color: #4a6ee0;">Subject Performance</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Subject</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Attempts</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Avg. Score</th>
                        </tr>
                        {subject_html}
                    </table>
                    
                    <h3 style="color: #4a6ee0;">Quiz Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Quiz</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Score</th>
                        </tr>
                        {quiz_list_html}
                    </table>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <p>Keep up the good work! Visit Quiz Master to improve your knowledge and skills.</p>
                        <p><a href="http://localhost:5000" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Visit Quiz Master</a></p>
                        <p>The Quiz Master Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send the email
            send_email(user.email, subject, body)
            
        current_app.logger.info(f"Sent monthly activity reports to {len(users)} users")
        return True
    except Exception as e:
        current_app.logger.error(f"Error sending monthly activity reports: {str(e)}")
        return False


def generate_quiz_export(admin_email):
    """
    Generate a CSV export of all quizzes and their details.
    This is an async job triggered by an admin.
    """
    try:
        # Create a unique filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"quiz_export_{timestamp}.csv"
        
        # Make sure we have a valid static folder path
        if not hasattr(current_app, 'static_folder') or not current_app.static_folder:
            # Fallback to a directory we know exists
            static_folder = "static"
        else:
            static_folder = "static"
            
        # Create exports directory if it doesn't exist
        exports_dir = os.path.join(static_folder, 'exports')
        os.makedirs(exports_dir, exist_ok=True)
        
        filepath = os.path.join(exports_dir, filename)
        
        # Get all quizzes with related data
        quizzes = Quiz.query.all()
        
        # Create CSV file
        with open(filepath, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                'Quiz ID', 'Title', 'Description', 'Chapter', 'Subject',
                'Time Limit (min)', 'Created Date', 'Published', 
                'Questions Count', 'Total Attempts', 'Completion Rate (%)',
                'Average Score (%)', 'Highest Score (%)', 'Lowest Score (%)'
            ])
            
            # Check if there are any quizzes
            if not quizzes:
                writer.writerow(['No quizzes found in the database'] + [''] * 13)
            else:
                # Write quiz data
                for quiz in quizzes:
                    # Get chapter and subject
                    chapter = Chapter.query.get(quiz.chapter_id) if quiz.chapter_id else None
                    chapter_name = chapter.name if chapter else 'N/A'
                    subject_name = 'N/A'
                    if chapter and chapter.subject_id:
                        subject = Subject.query.get(chapter.subject_id)
                        subject_name = subject.name if subject else 'N/A'
                    
                    # Get question count
                    question_count = Question.query.filter_by(quiz_id=quiz.id).count()
                    
                    # Get attempt statistics
                    attempts = UserQuizAttempt.query.filter_by(quiz_id=quiz.id).all()
                    total_attempts = len(attempts)
                    
                    # Handle division by zero
                    if total_attempts > 0:
                        completed_attempts = sum(1 for a in attempts if a.completed_at is not None)
                        completion_rate = (completed_attempts / total_attempts * 100)
                        
                        # Get score statistics
                        scores = [a.score for a in attempts if a.score is not None]
                        avg_score = sum(scores) / len(scores) if scores else 0
                        highest_score = max(scores) if scores else 0
                        lowest_score = min(scores) if scores else 0
                    else:
                        completion_rate = 0
                        avg_score = 0
                        highest_score = 0
                        lowest_score = 0
                    
                    # Write row
                    writer.writerow([
                        quiz.id,
                        quiz.title,
                        quiz.description or 'N/A',
                        chapter_name,
                        subject_name,
                        quiz.time_limit,
                        quiz.created_at.strftime('%Y-%m-%d') if quiz.created_at else 'N/A',
                        'Yes' if quiz.is_published else 'No',
                        question_count,
                        total_attempts,
                        f"{completion_rate:.1f}",
                        f"{avg_score:.1f}",
                        f"{highest_score:.1f}",
                        f"{lowest_score:.1f}"
                    ])
        
        # Generate download URL
        download_url = f"/static/exports/{filename}"
        
        # Send email notification
        subject = "Quiz Export Ready - Quiz Master"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #4a6ee0;">Quiz Export Ready</h2>
                <p>Your requested export of all quiz data is now ready.</p>
                <p>You can download the CSV file using the link below:</p>
                <p><a href="http://localhost:5000{download_url}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Download CSV</a></p>
                <p>This link will be available for the next 7 days.</p>
                <p>The Quiz Master Team</p>
            </div>
        </body>
        </html>
        """
        
        send_email(admin_email, subject, body)
        
        current_app.logger.info(f"Quiz export generated successfully: {filename}")
        return {'status': 'success', 'filename': filename, 'download_url': download_url}
    
    except Exception as e:
        current_app.logger.error(f"Error generating quiz export: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        
        # Send error notification
        subject = "Quiz Export Failed - Quiz Master"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #e74c3c;">Quiz Export Failed</h2>
                <p>We encountered an error while generating your quiz export:</p>
                <p style="background-color: #f8d7da; padding: 10px; border-radius: 5px;">{str(e)}</p>
                <p>Please try again or contact the system administrator.</p>
                <p>The Quiz Master Team</p>
            </div>
        </body>
        </html>
        """
        
        send_email(admin_email, subject, body)
        
        return {'status': 'error', 'message': str(e)}