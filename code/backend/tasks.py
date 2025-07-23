import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from backend.models import *
from sqlalchemy import func, desc, or_
from flask import current_app
import logging

def send_email(recipient, subject, body):
    """Helper function to send an email"""
    try:
        # Get email configuration from app config
        sender_email = current_app.config.get('MAIL_DEFAULT_SENDER', 'quizmaster@example.com')
        smtp_server = current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_username = current_app.config.get('MAIL_USERNAME', sender_email)
        smtp_password = current_app.config.get('MAIL_PASSWORD', '')
        
        print(f"=== EMAIL DEBUG ===")
        print(f"Sending to: {recipient}")
        print(f"From: {sender_email}")
        print(f"Subject: {subject}")
        print(f"SMTP Server: {smtp_server}:{smtp_port}")
        
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
        
        current_app.logger.info(f"Email sent successfully to {recipient}")
        print(f"✅ Email sent successfully to {recipient}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {recipient}: {str(e)}")
        print(f"❌ Failed to send email to {recipient}: {str(e)}")
        return False

def send_inactivity_reminder(user, available_quizzes):
    """Send reminder to inactive user"""
    try:
        subject = "Don't forget to practice! - Quiz Master"
        
        # Create quiz list HTML
        quiz_list_html = ""
        for quiz in available_quizzes:
            chapter = Chapter.query.get(quiz.chapter_id)
            subject_obj = Subject.query.get(chapter.subject_id) if chapter else None
            
            quiz_list_html += f"""
            <div style="background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; border-radius: 5px;">
                <h4 style="color: #007bff; margin: 0 0 5px 0;">{quiz.title}</h4>
                <p style="margin: 5px 0; color: #6c757d;">
                    <strong>Subject:</strong> {subject_obj.name if subject_obj else 'N/A'} | 
                    <strong>Chapter:</strong> {chapter.name if chapter else 'N/A'}
                </p>
                <p style="margin: 5px 0; color: #6c757d;">
                    <strong>Time Limit:</strong> {quiz.time_limit} minutes
                </p>
                <p style="margin: 5px 0 0 0; color: #495057;">{quiz.description or 'Test your knowledge!'}</p>
            </div>
            """
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📚 Quiz Master</h1>
                <p style="color: #f8f9fa; margin: 10px 0 0 0;">Your learning journey awaits!</p>
            </div>
            
            <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #495057;">Hi {user.full_name}! 👋</h2>
                
                <p style="font-size: 16px; color: #6c757d;">
                    We noticed you haven't visited Quiz Master recently. Don't let your learning momentum slow down!
                </p>
                
                <p style="font-size: 16px; color: #6c757d;">
                    Here are some quizzes we think you'll find interesting:
                </p>
                
                {quiz_list_html}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5000" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold;
                              font-size: 16px;
                              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        🚀 Start Learning Now
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
                    Keep up the great work on your learning journey!<br>
                    The Quiz Master Team
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(user.email, subject, body)
        
    except Exception as e:
        current_app.logger.error(f"Error sending inactivity reminder to {user.email}: {str(e)}")
        return False

def send_new_quiz_notification(user, new_quizzes):
    """Send notification about new quizzes"""
    try:
        subject = f"🎉 {len(new_quizzes)} New Quiz{'es' if len(new_quizzes) > 1 else ''} Available!"
        
        # Create quiz list HTML
        quiz_list_html = ""
        for quiz in new_quizzes:
            chapter = Chapter.query.get(quiz.chapter_id)
            subject_obj = Subject.query.get(chapter.subject_id) if chapter else None
            
            quiz_list_html += f"""
            <div style="background-color: #e7f3ff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; border-radius: 5px;">
                <h4 style="color: #0066cc; margin: 0 0 5px 0;">{quiz.title} <span style="background: #ff6b6b; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">NEW</span></h4>
                <p style="margin: 5px 0; color: #6c757d;">
                    <strong>Subject:</strong> {subject_obj.name if subject_obj else 'N/A'} | 
                    <strong>Chapter:</strong> {chapter.name if chapter else 'N/A'}
                </p>
                <p style="margin: 5px 0; color: #6c757d;">
                    <strong>Time Limit:</strong> {quiz.time_limit} minutes
                </p>
                <p style="margin: 5px 0 0 0; color: #495057;">{quiz.description or 'Ready for a new challenge?'}</p>
            </div>
            """
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Quiz Master</h1>
                <p style="color: #f8f9fa; margin: 10px 0 0 0;">Fresh content just for you!</p>
            </div>
            
            <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #495057;">Hi {user.full_name}! 🎯</h2>
                
                <p style="font-size: 16px; color: #6c757d;">
                    Great news! We've just added {len(new_quizzes)} new quiz{'es' if len(new_quizzes) > 1 else ''} to Quiz Master.
                </p>
                
                <p style="font-size: 16px; color: #6c757d;">
                    Check out what's new:
                </p>
                
                {quiz_list_html}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5000" 
                       style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold;
                              font-size: 16px;
                              box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);">
                        ✨ Try New Quizzes
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
                    Happy learning!<br>
                    The Quiz Master Team
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(user.email, subject, body)
        
    except Exception as e:
        current_app.logger.error(f"Error sending new quiz notification to {user.email}: {str(e)}")
        return False

# Task function - will be registered later
def send_daily_reminders():
    """
    Daily reminder task that:
    1. Finds users who haven't visited recently
    2. Finds newly created quizzes
    3. Sends reminder emails
    """
    try:
        print("=== DAILY REMINDER TASK STARTED ===")
        current_app.logger.info("Starting daily reminder task...")
        
        # Define "recent activity" as within last 24 hours
        yesterday = datetime.now() - timedelta(days=1)
        
        # Find users who haven't been active recently
        inactive_users = User.query.filter(
            User.roles.any(Role.name == 'user'),  # Only regular users
            User.active == True  # Only active users
        ).all()
        
        # Find new quizzes created in the last 24 hours
        new_quizzes = Quiz.query.filter(
            Quiz.created_at >= yesterday,
            Quiz.is_published == True
        ).all()
        
        # Get all active users for new quiz notifications
        all_active_users = User.query.filter(
            User.roles.any(Role.name == 'user'),
            User.active == True
        ).all()
        
        print(f"Found {len(inactive_users)} inactive users")
        print(f"Found {len(new_quizzes)} new quizzes")
        print(f"Found {len(all_active_users)} active users")
        
        # Send reminders for inactive users
        inactive_reminder_count = 0
        if inactive_users:
            for user in inactive_users:
                print(f"Processing inactive user: {user.email}")
                # Get user's quiz history to recommend relevant quizzes
                user_attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all()
                attempted_quiz_ids = [attempt.quiz_id for attempt in user_attempts]
                
                # Find available quizzes user hasn't attempted
                available_quizzes = Quiz.query.filter(
                    Quiz.is_published == True,
                    ~Quiz.id.in_(attempted_quiz_ids) if attempted_quiz_ids else True,
                    or_(Quiz.activation_date == None, Quiz.activation_date <= datetime.now())
                ).limit(3).all()  # Limit to 3 recommendations
                
                print(f"Found {len(available_quizzes)} available quizzes for {user.email}")
                
                if available_quizzes:
                    success = send_inactivity_reminder(user, available_quizzes)
                    if success:
                        inactive_reminder_count += 1
        
        # Send notifications for new quizzes
        new_quiz_reminder_count = 0
        if new_quizzes and all_active_users:
            for user in all_active_users:
                print(f"Sending new quiz notification to: {user.email}")
                success = send_new_quiz_notification(user, new_quizzes)
                if success:
                    new_quiz_reminder_count += 1
        
        # Log results
        result_message = f"Daily reminder task completed - Inactivity: {inactive_reminder_count}, New Quiz: {new_quiz_reminder_count}"
        current_app.logger.info(result_message)
        print(f"=== {result_message} ===")
        
        return {
            'status': 'completed',
            'inactive_reminders': inactive_reminder_count,
            'new_quiz_notifications': new_quiz_reminder_count,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        error_message = f"Error in daily reminder task: {str(e)}"
        current_app.logger.error(error_message)
        print(f"❌ {error_message}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        print(traceback.format_exc())
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }