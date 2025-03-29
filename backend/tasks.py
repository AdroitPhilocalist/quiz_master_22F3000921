from app import celery, app
from backend.models import User, Quiz, UserQuizAttempt, Chapter, Subject
from flask import render_template
from datetime import datetime, timedelta
import csv
import io
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import requests
import os

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
EMAIL_USERNAME = os.environ.get('EMAIL_USERNAME', 'your-email@gmail.com')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', 'your-app-password')

def send_email(to_email, subject, html_content, attachment=None):
    """Helper function to send emails"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))
        
        # Attach file if provided
        if attachment:
            attachment_name, attachment_data = attachment
            part = MIMEApplication(attachment_data)
            part.add_header('Content-Disposition', f'attachment; filename="{attachment_name}"')
            msg.attach(part)
        
        # Connect to SMTP server and send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        app.logger.error(f"Email sending failed: {str(e)}")
        return False

def send_gchat_notification(webhook_url, message):
    """Send notification to Google Chat"""
    try:
        payload = {"text": message}
        response = requests.post(webhook_url, json=payload)
        return response.status_code == 200
    except Exception as e:
        app.logger.error(f"Google Chat notification failed: {str(e)}")
        return False

@celery.task
def send_daily_reminders():
    """Send daily reminders to users who haven't visited recently or have new quizzes"""
    # Get users who haven't been active in the last 3 days
    three_days_ago = datetime.utcnow() - timedelta(days=3)
    inactive_users = User.query.filter(User.last_activity < three_days_ago).all()
    
    # Get recently published quizzes (last 24 hours)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    new_quizzes = Quiz.query.filter(
        Quiz.is_published == True,
        Quiz.created_at > one_day_ago
    ).all()
    
    # Send reminders
    for user in inactive_users:
        # Skip if user doesn't have an email
        if not user.email:
            continue
            
        # Prepare message
        subject = "Quiz Master - We miss you!"
        message = f"""
        <html>
        <body>
            <h2>Hello {user.full_name},</h2>
            <p>We noticed you haven't visited Quiz Master recently. We have many quizzes waiting for you!</p>
        """
        
        # Add new quizzes if any
        if new_quizzes:
            message += "<p>Check out these new quizzes:</p><ul>"
            for quiz in new_quizzes:
                chapter = Chapter.query.get(quiz.chapter_id)
                subject_name = "Unknown"
                if chapter:
                    subject = Subject.query.get(chapter.subject_id)
                    if subject:
                        subject_name = subject.name
                
                message += f"<li><strong>{quiz.title}</strong> - {subject_name}</li>"
            message += "</ul>"
        
        message += """
            <p>Visit <a href="http://localhost:5000">Quiz Master</a> to continue your learning journey!</p>
            <p>Best regards,<br>The Quiz Master Team</p>
        </body>
        </html>
        """
        
        # Send email
        send_email(user.email, subject, message)
        
        # If user has Google Chat webhook URL, send notification there too
        if hasattr(user, 'gchat_webhook') and user.gchat_webhook:
            chat_message = f"Hello {user.full_name}, we miss you at Quiz Master! We have new quizzes waiting for you."
            send_gchat_notification(user.gchat_webhook, chat_message)
    
    return f"Sent reminders to {len(inactive_users)} users about {len(new_quizzes)} new quizzes"

@celery.task
def generate_monthly_report():
    """Generate and send monthly activity reports to all users"""
    # Get the previous month
    today = datetime.utcnow()
    first_day_current_month = datetime(today.year, today.month, 1)
    last_day_previous_month = first_day_current_month - timedelta(days=1)
    first_day_previous_month = datetime(last_day_previous_month.year, last_day_previous_month.month, 1)
    
    month_name = first_day_previous_month.strftime("%B %Y")
    
    # Get all active users
    users = User.query.filter_by(active=True).all()
    
    for user in users:
        # Skip if user doesn't have an email
        if not user.email:
            continue
            
        # Get user's quiz attempts for the previous month
        attempts = UserQuizAttempt.query.filter(
            UserQuizAttempt.user_id == user.id,
            UserQuizAttempt.started_at >= first_day_previous_month,
            UserQuizAttempt.started_at <= last_day_previous_month,
            UserQuizAttempt.completed_at != None
        ).all()
        
        # Skip if user has no attempts in the previous month
        if not attempts:
            continue
            
        # Calculate statistics
        total_attempts = len(attempts)
        completed_attempts = sum(1 for a in attempts if a.completed_at is not None)
        
        # Calculate average score
        scores = [a.score for a in attempts if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Get subject performance
        subject_performance = {}
        for attempt in attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            if not quiz:
                continue
                
            chapter = Chapter.query.get(quiz.chapter_id)
            if not chapter:
                continue
                
            subject = Subject.query.get(chapter.subject_id)
            if not subject:
                continue
                
            subject_name = subject.name
            if subject_name not in subject_performance:
                subject_performance[subject_name] = {
                    'attempts': 0,
                    'total_score': 0,
                    'completed': 0
                }
                
            subject_performance[subject_name]['attempts'] += 1
            if attempt.score is not None:
                subject_performance[subject_name]['total_score'] += attempt.score
            if attempt.completed_at is not None:
                subject_performance[subject_name]['completed'] += 1
        
        # Calculate average score per subject
        for subject in subject_performance:
            if subject_performance[subject]['completed'] > 0:
                subject_performance[subject]['avg_score'] = (
                    subject_performance[subject]['total_score'] / 
                    subject_performance[subject]['completed']
                )
            else:
                subject_performance[subject]['avg_score'] = 0
        
        # Render HTML template for email
        html_content = render_template(
            'monthly_report.html',
            user=user,
            month=month_name,
            total_attempts=total_attempts,
            completed_attempts=completed_attempts,
            avg_score=avg_score,
            subject_performance=subject_performance
        )
        
        # Send email
        subject = f"Quiz Master - Your Activity Report for {month_name}"
        send_email(user.email, subject, html_content)
    
    return f"Generated and sent monthly reports for {len(users)} users"

@celery.task
def export_user_quiz_data(user_id):
    """Export user's quiz data to CSV"""
    user = User.query.get(user_id)
    if not user:
        return "User not found"
    
    # Get all completed quiz attempts for the user
    attempts = UserQuizAttempt.query.filter(
        UserQuizAttempt.user_id == user_id,
        UserQuizAttempt.completed_at != None
    ).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Quiz ID', 'Quiz Title', 'Chapter', 'Subject', 
        'Date Taken', 'Score', 'Time Spent (minutes)', 'Status'
    ])
    
    # Write data rows
    for attempt in attempts:
        quiz = Quiz.query.get(attempt.quiz_id)
        if not quiz:
            continue
            
        chapter = Chapter.query.get(quiz.chapter_id) if quiz.chapter_id else None
        chapter_name = chapter.name if chapter else "N/A"
        
        subject_name = "N/A"
        if chapter and chapter.subject_id:
            subject = Subject.query.get(chapter.subject_id)
            if subject:
                subject_name = subject.name
        
        date_taken = attempt.started_at.strftime("%Y-%m-%d %H:%M") if attempt.started_at else "N/A"
        score = f"{attempt.score}%" if attempt.score is not None else "N/A"
        time_spent = round(attempt.time_spent / 60, 1) if attempt.time_spent else "N/A"
        status = "Completed" if attempt.completed_at else "In Progress"
        
        writer.writerow([
            attempt.quiz_id, quiz.title, chapter_name, subject_name,
            date_taken, score, time_spent, status
        ])
    
    # Get the CSV data
    csv_data = output.getvalue()
    output.close()
    
    # Send email with CSV attachment
    subject = "Quiz Master - Your Quiz Data Export"
    html_content = f"""
    <html>
    <body>
        <h2>Hello {user.full_name},</h2>
        <p>Your requested quiz data export is attached.</p>
        <p>Thank you for using Quiz Master!</p>
    </body>
    </html>
    """
    
    filename = f"quiz_data_{user.id}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    send_email(user.email, subject, html_content, (filename, csv_data.encode()))
    
    return f"Exported quiz data for user {user_id}"

@celery.task
def export_admin_quiz_data():
    """Export all users' quiz data for admin"""
    # Get all users with their quiz attempts
    users = User.query.all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'User ID', 'User Name', 'Email', 'Total Quizzes Attempted', 
        'Quizzes Completed', 'Average Score', 'Total Time Spent (hours)'
    ])
    
    # Write data rows
    for user in users:
        # Get all attempts for this user
        attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all()
        total_attempted = len(attempts)
        
        completed_attempts = sum(1 for a in attempts if a.completed_at is not None)
        
        # Calculate average score
        scores = [a.score for a in attempts if a.score is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        
        # Calculate total time spent
        total_time = sum(a.time_spent for a in attempts if a.time_spent is not None)
        total_hours = round(total_time / 3600, 1)  # Convert seconds to hours
        
        writer.writerow([
            user.id, user.full_name, user.email, 
            total_attempted, completed_attempts, avg_score, total_hours
        ])
    
    # Get the CSV data
    csv_data = output.getvalue()
    output.close()
    
    # Get admin emails
    admin_role = Role.query.filter_by(name='admin').first()
    if admin_role:
        admin_users = User.query.join(UserRoles).filter(UserRoles.role_id == admin_role.id).all()
        
        for admin in admin_users:
            if not admin.email:
                continue
                
            # Send email with CSV attachment
            subject = "Quiz Master - User Quiz Data Export"
            html_content = f"""
            <html>
            <body>
                <h2>Hello {admin.full_name},</h2>
                <p>Your requested user quiz data export is attached.</p>
                <p>This report includes data for all users in the system.</p>
            </body>
            </html>
            """
            
            filename = f"all_users_quiz_data_{datetime.utcnow().strftime('%Y%m%d')}.csv"
            send_email(admin.email, subject, html_content, (filename, csv_data.encode()))
    
    return "Exported quiz data for all users"