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