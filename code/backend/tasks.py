import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from backend.models import *
from sqlalchemy import func, desc, or_, extract
from flask import current_app
import logging
import calendar
import csv
import os
from io import StringIO
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
    






def generate_monthly_report_data(user, target_month, target_year):
    """Generate comprehensive monthly report data for a user"""
    
    # Get all attempts for the target month
    monthly_attempts = UserQuizAttempt.query.filter(
        UserQuizAttempt.user_id == user.id,
        extract('month', UserQuizAttempt.started_at) == target_month,
        extract('year', UserQuizAttempt.started_at) == target_year,
        UserQuizAttempt.completed_at.isnot(None)
    ).all()
    
    # Basic statistics
    total_quizzes_taken = len(monthly_attempts)
    
    if total_quizzes_taken == 0:
        return None  # No activity for this month
    
    # Calculate scores and performance
    scores = [attempt.score for attempt in monthly_attempts if attempt.score is not None]
    average_score = sum(scores) / len(scores) if scores else 0
    best_score = max(scores) if scores else 0
    total_time_spent = 0
    
    # Calculate total time spent
    for attempt in monthly_attempts:
        if attempt.completed_at and attempt.started_at:
            total_time_spent += (attempt.completed_at - attempt.started_at).total_seconds()
    
    # Convert to hours and minutes
    total_hours = int(total_time_spent // 3600)
    total_minutes = int((total_time_spent % 3600) // 60)
    
    # Subject-wise performance
    subject_performance = {}
    for attempt in monthly_attempts:
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz and quiz.chapter_id:
            chapter = Chapter.query.get(quiz.chapter_id)
            if chapter and chapter.subject_id:
                subject = Subject.query.get(chapter.subject_id)
                if subject:
                    subject_name = subject.name
                    if subject_name not in subject_performance:
                        subject_performance[subject_name] = {
                            'attempts': 0,
                            'scores': [],
                            'total_time': 0
                        }
                    
                    subject_performance[subject_name]['attempts'] += 1
                    if attempt.score is not None:
                        subject_performance[subject_name]['scores'].append(attempt.score)
                    
                    if attempt.completed_at and attempt.started_at:
                        subject_performance[subject_name]['total_time'] += (attempt.completed_at - attempt.started_at).total_seconds()
    
    # Process subject performance
    for subject_name in subject_performance:
        perf = subject_performance[subject_name]
        perf['average_score'] = sum(perf['scores']) / len(perf['scores']) if perf['scores'] else 0
        perf['time_spent_minutes'] = int(perf['total_time'] // 60)
    
    # Get detailed quiz attempts for the month
    detailed_attempts = []
    for attempt in sorted(monthly_attempts, key=lambda x: x.started_at, reverse=True):
        quiz = Quiz.query.get(attempt.quiz_id)
        if quiz:
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id) if chapter else None
            
            # Calculate time taken
            time_taken_seconds = 0
            if attempt.completed_at and attempt.started_at:
                time_taken_seconds = (attempt.completed_at - attempt.started_at).total_seconds()
            
            time_taken_minutes = int(time_taken_seconds // 60)
            time_taken_display = f"{time_taken_minutes} min" if time_taken_minutes > 0 else "< 1 min"
            
            detailed_attempts.append({
                'quiz_title': quiz.title,
                'subject': subject.name if subject else 'Unknown',
                'chapter': chapter.name if chapter else 'Unknown',
                'score': round(attempt.score, 1) if attempt.score is not None else 0,
                'date': attempt.started_at.strftime('%b %d'),
                'time_taken': time_taken_display,
                'grade': get_grade(attempt.score) if attempt.score is not None else 'F'
            })
    
    return {
        'total_quizzes_taken': total_quizzes_taken,
        'average_score': round(average_score, 1),
        'best_score': round(best_score, 1),
        'total_time_hours': total_hours,
        'total_time_minutes': total_minutes,
        'subject_performance': subject_performance,
        'detailed_attempts': detailed_attempts,
        'month_name': calendar.month_name[target_month],
        'year': target_year
    }

def get_grade(score):
    """Convert score to letter grade"""
    if score >= 90:
        return 'A+'
    elif score >= 80:
        return 'A'
    elif score >= 70:
        return 'B+'
    elif score >= 60:
        return 'B'
    elif score >= 50:
        return 'C'
    else:
        return 'F'

def calculate_user_ranking(target_month, target_year):
    """Calculate user rankings based on performance for the month"""
    
    # Get all users with activity in the target month
    active_users = db.session.query(User).join(UserQuizAttempt).filter(
        User.roles.any(Role.name == 'user'),
        User.active == True,
        extract('month', UserQuizAttempt.started_at) == target_month,
        extract('year', UserQuizAttempt.started_at) == target_year,
        UserQuizAttempt.completed_at.isnot(None)
    ).distinct().all()
    
    user_rankings = []
    
    for user in active_users:
        # Get user's monthly performance
        monthly_attempts = UserQuizAttempt.query.filter(
            UserQuizAttempt.user_id == user.id,
            extract('month', UserQuizAttempt.started_at) == target_month,
            extract('year', UserQuizAttempt.started_at) == target_year,
            UserQuizAttempt.completed_at.isnot(None)
        ).all()
        
        if monthly_attempts:
            scores = [attempt.score for attempt in monthly_attempts if attempt.score is not None]
            average_score = sum(scores) / len(scores) if scores else 0
            total_quizzes = len(monthly_attempts)
            
            # Calculate ranking score (weighted average: 70% avg score, 30% quiz count)
            ranking_score = (average_score * 0.7) + (min(total_quizzes * 5, 30) * 0.3)  # Cap quiz bonus at 6 quizzes
            
            user_rankings.append({
                'user_id': user.id,
                'user_name': user.full_name,
                'average_score': round(average_score, 1),
                'total_quizzes': total_quizzes,
                'ranking_score': ranking_score
            })
    
    # Sort by ranking score (descending)
    user_rankings.sort(key=lambda x: x['ranking_score'], reverse=True)
    
    # Add rank numbers
    for i, user_data in enumerate(user_rankings, 1):
        user_data['rank'] = i
    
    return user_rankings

def send_monthly_activity_report_email(user, report_data, user_ranking, total_users):
    """Send monthly activity report email to user"""
    
    try:
        subject = f"🎯 Your {report_data['month_name']} {report_data['year']} Quiz Performance Report"
        
        # Create subject performance HTML
        subject_performance_html = ""
        if report_data['subject_performance']:
            for subject_name, perf in report_data['subject_performance'].items():
                subject_performance_html += f"""
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 20px; margin: 15px 0; color: white;">
                    <h4 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">{subject_name}</h4>
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                        <div style="text-align: center; margin: 5px;">
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{perf['attempts']}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Quizzes</div>
                        </div>
                        <div style="text-align: center; margin: 5px;">
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{round(perf['average_score'], 1)}%</div>
                            <div style="font-size: 12px; opacity: 0.9;">Avg Score</div>
                        </div>
                        <div style="text-align: center; margin: 5px;">
                            <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{perf['time_spent_minutes']}</div>
                            <div style="font-size: 12px; opacity: 0.9;">Minutes</div>
                        </div>
                    </div>
                </div>
                """
        else:
            subject_performance_html = """
            <div style="background-color: #f8f9fa; border-radius: 15px; padding: 20px; text-align: center; color: #6c757d;">
                <p>No subject-specific data available for this month.</p>
            </div>
            """
        
        # Create detailed attempts HTML
        detailed_attempts_html = ""
        for attempt in report_data['detailed_attempts'][:10]:  # Show top 10
            grade_color = get_grade_color(attempt['grade'])
            detailed_attempts_html += f"""
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 8px; color: #333; font-weight: 500;">{attempt['quiz_title']}</td>
                <td style="padding: 12px 8px; color: #6c757d;">{attempt['subject']}</td>
                <td style="padding: 12px 8px; color: #6c757d;">{attempt['date']}</td>
                <td style="padding: 12px 8px; text-align: center;">
                    <span style="background: {grade_color}; color: white; padding: 4px 8px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        {attempt['score']}% ({attempt['grade']})
                    </span>
                </td>
                <td style="padding: 12px 8px; color: #6c757d; text-align: center;">{attempt['time_taken']}</td>
            </tr>
            """
        
        # Ranking information
        user_rank_info = next((rank for rank in user_ranking if rank['user_id'] == user.id), None)
        rank_display = f"#{user_rank_info['rank']} out of {total_users}" if user_rank_info else "Not ranked"
        
        # Performance insights
        insights = generate_performance_insights(report_data)
        
        body = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Monthly Activity Report</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <div style="max-width: 800px; margin: 0 auto; background-color: white;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700;">📊 Monthly Report</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">{report_data['month_name']} {report_data['year']} Performance Summary</p>
                    <div style="margin-top: 20px; background: rgba(255,255,255,0.2); border-radius: 25px; padding: 10px 20px; display: inline-block;">
                        <span style="font-size: 16px; font-weight: 600;">👋 Hi {user.full_name}!</span>
                    </div>
                </div>
                
                <!-- Summary Stats -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333; margin: 0 0 25px 0; font-size: 24px; font-weight: 600;">📈 Your Performance Overview</h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 40px;">
                        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 15px; padding: 25px; text-align: center; color: white;">
                            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">{report_data['total_quizzes_taken']}</div>
                            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Quizzes Completed</div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #51cf66 0%, #40c057 100%); border-radius: 15px; padding: 25px; text-align: center; color: white;">
                            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">{report_data['average_score']}%</div>
                            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Average Score</div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #339af0 0%, #228be6 100%); border-radius: 15px; padding: 25px; text-align: center; color: white;">
                            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">{report_data['best_score']}%</div>
                            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Best Score</div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #f06292 0%, #e91e63 100%); border-radius: 15px; padding: 25px; text-align: center; color: white;">
                            <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">{report_data['total_time_hours']}h {report_data['total_time_minutes']}m</div>
                            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Time Spent</div>
                        </div>
                    </div>
                    
                    <!-- Ranking -->
                    <div style="background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%); border-radius: 15px; padding: 25px; text-align: center; margin-bottom: 40px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px; font-weight: 600;">🏆 Your Ranking</h3>
                        <div style="font-size: 28px; font-weight: bold; color: #333; margin-bottom: 8px;">{rank_display}</div>
                        <div style="color: #333; opacity: 0.8;">Keep up the great work!</div>
                    </div>
                    
                    <!-- Subject Performance -->
                    <h2 style="color: #333; margin: 0 0 25px 0; font-size: 24px; font-weight: 600;">📚 Subject-wise Performance</h2>
                    {subject_performance_html}
                    
                    <!-- Performance Insights -->
                    <div style="background-color: #f8f9fa; border-radius: 15px; padding: 25px; margin: 40px 0;">
                        <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">💡 Performance Insights</h3>
                        {insights}
                    </div>
                    
                    <!-- Detailed Quiz History -->
                    <h2 style="color: #333; margin: 40px 0 25px 0; font-size: 24px; font-weight: 600;">📝 Your Quiz History</h2>
                    <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #667eea; color: white;">
                                    <th style="padding: 15px 8px; text-align: left; font-weight: 600;">Quiz</th>
                                    <th style="padding: 15px 8px; text-align: left; font-weight: 600;">Subject</th>
                                    <th style="padding: 15px 8px; text-align: left; font-weight: 600;">Date</th>
                                    <th style="padding: 15px 8px; text-align: center; font-weight: 600;">Score</th>
                                    <th style="padding: 15px 8px; text-align: center; font-weight: 600;">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailed_attempts_html}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Footer Call to Action -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="http://localhost:5000" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                                  display: inline-block;">
                            🚀 Continue Learning
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #333; color: white; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                        This report was generated automatically for {report_data['month_name']} {report_data['year']}<br>
                        Keep learning and improving! 🎓
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
                        Quiz Master Team
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email(user.email, subject, body)
        
    except Exception as e:
        current_app.logger.error(f"Error sending monthly report to {user.email}: {str(e)}")
        return False

def get_grade_color(grade):
    """Get color for grade display"""
    grade_colors = {
        'A+': '#4caf50',
        'A': '#8bc34a',
        'B+': '#ffeb3b',
        'B': '#ff9800',
        'C': '#ff5722',
        'F': '#f44336'
    }
    return grade_colors.get(grade, '#6c757d')

def generate_performance_insights(report_data):
    """Generate personalized performance insights"""
    insights = []
    
    # Score-based insights
    if report_data['average_score'] >= 85:
        insights.append("🌟 Excellent performance! You're consistently scoring high.")
    elif report_data['average_score'] >= 70:
        insights.append("👍 Good work! You're maintaining solid performance.")
    else:
        insights.append("📈 Room for improvement. Consider reviewing study materials.")
    
    # Quiz frequency insights
    if report_data['total_quizzes_taken'] >= 15:
        insights.append("🔥 You're very active! Great dedication to learning.")
    elif report_data['total_quizzes_taken'] >= 8:
        insights.append("📚 Nice consistency in taking quizzes.")
    else:
        insights.append("⏰ Try to take more quizzes to improve your skills.")
    
    # Subject diversity insights
    subject_count = len(report_data['subject_performance'])
    if subject_count >= 3:
        insights.append("🌈 Great subject diversity! You're exploring multiple topics.")
    elif subject_count == 2:
        insights.append("📖 Good variety in subjects. Consider exploring more topics.")
    else:
        insights.append("🎯 Focus on diversifying your study subjects for better learning.")
    
    # Create HTML for insights
    insights_html = ""
    for insight in insights:
        insights_html += f"""
        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0; color: #333; font-size: 16px;">{insight}</p>
        </div>
        """
    
    return insights_html

def send_monthly_activity_report():
    """
    Main task to send monthly activity reports to all users
    """
    try:
        print("=== MONTHLY ACTIVITY REPORT TASK STARTED ===")
        current_app.logger.info("Starting monthly activity report task...")
        
        # Calculate for previous month
        today = datetime.now()
        if today.month == 1:
            target_month = 12
            target_year = today.year - 1
        else:
            target_month = today.month - 1
            target_year = today.year
        
        month_name = calendar.month_name[target_month]
        
        print(f"Generating reports for {month_name} {target_year}")
        
        # Calculate user rankings for the month
        user_rankings = calculate_user_ranking(target_month, target_year)
        total_active_users = len(user_rankings)
        
        print(f"Found {total_active_users} active users for {month_name} {target_year}")
        
        # Get all users with activity in the target month
        users_with_activity = db.session.query(User).join(UserQuizAttempt).filter(
            User.roles.any(Role.name == 'user'),
            User.active == True,
            extract('month', UserQuizAttempt.started_at) == target_month,
            extract('year', UserQuizAttempt.started_at) == target_year,
            UserQuizAttempt.completed_at.isnot(None)
        ).distinct().all()
        
        reports_sent = 0
        
        for user in users_with_activity:
            print(f"Generating report for user: {user.email}")
            
            # Generate report data for this user
            report_data = generate_monthly_report_data(user, target_month, target_year)
            
            if report_data:  # Only send if user had activity
                success = send_monthly_activity_report_email(
                    user, 
                    report_data, 
                    user_rankings, 
                    total_active_users
                )
                
                if success:
                    reports_sent += 1
                    print(f"✅ Report sent to {user.email}")
                else:
                    print(f"❌ Failed to send report to {user.email}")
            else:
                print(f"⚠️ No activity data for {user.email}")
        
        # Log results
        result_message = f"Monthly activity reports completed - {reports_sent} reports sent for {month_name} {target_year}"
        current_app.logger.info(result_message)
        print(f"=== {result_message} ===")
        
        return {
            'status': 'completed',
            'reports_sent': reports_sent,
            'target_month': month_name,
            'target_year': target_year,
            'total_active_users': total_active_users,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        error_message = f"Error in monthly activity report task: {str(e)}"
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
    




def export_quiz_data_csv():
    """
    Async task to export comprehensive quiz data to CSV
    This includes users, quizzes, attempts, and performance data
    """
    try:
        print("=== CSV EXPORT TASK STARTED ===")
        current_app.logger.info("Starting CSV export task...")
        
        # Create timestamp for unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quiz_master_export_{timestamp}.csv"
        
        # Get the project root directory (where app.py is located)
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        static_dir = os.path.join(project_root, 'static')
        export_dir = os.path.join(static_dir, 'exports')
        
        # Create directories if they don't exist
        os.makedirs(static_dir, exist_ok=True)
        os.makedirs(export_dir, exist_ok=True)
        
        filepath = os.path.join(export_dir, filename)
        
        print(f"Project root: {project_root}")
        print(f"Static directory: {static_dir}")
        print(f"Export directory: {export_dir}")
        print(f"Generating export file: {filename}")
        print(f"Full file path: {filepath}")
        
        # Verify directory is writable
        if not os.access(export_dir, os.W_OK):
            raise Exception(f"Export directory is not writable: {export_dir}")
        
        # Open CSV file for writing
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write CSV headers
            headers = [
                'Export_Type', 'User_ID', 'User_Email', 'User_Full_Name', 'User_Role', 
                'User_Active', 'User_Created_Date', 'User_Last_Activity',
                'Quiz_ID', 'Quiz_Title', 'Quiz_Description', 'Quiz_Time_Limit', 
                'Quiz_Is_Published', 'Quiz_Created_Date', 'Subject_Name', 'Chapter_Name',
                'Attempt_ID', 'Attempt_Score', 'Attempt_Started_At', 'Attempt_Completed_At',
                'Attempt_Time_Taken_Minutes', 'Total_Questions', 'Correct_Answers',
                'User_Total_Quizzes', 'User_Average_Score', 'User_Best_Score',
                'Subject_Performance', 'Monthly_Activity_Count'
            ]
            writer.writerow(headers)
            
            print("CSV headers written, starting data collection...")
            
            # Get all users (excluding admins for main data, but including for summary)
            all_users = User.query.all()
            regular_users = User.query.filter(User.roles.any(Role.name == 'user')).all()
            
            rows_written = 0
            
            # SECTION 1: USER SUMMARY DATA
            print("Writing user summary data...")
            for user in all_users:
                role = 'admin' if any(r.name == 'admin' for r in user.roles) else 'user'
                
                # Get user's quiz statistics
                user_attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all()
                completed_attempts = [a for a in user_attempts if a.completed_at is not None]
                
                # Calculate user statistics
                total_quizzes = len(completed_attempts)
                scores = [a.score for a in completed_attempts if a.score is not None]
                avg_score = sum(scores) / len(scores) if scores else 0
                best_score = max(scores) if scores else 0
                
                # Subject performance summary
                subject_perf = {}
                for attempt in completed_attempts:
                    quiz = Quiz.query.get(attempt.quiz_id)
                    if quiz and quiz.chapter_id:
                        chapter = Chapter.query.get(quiz.chapter_id)
                        if chapter and chapter.subject_id:
                            subject = Subject.query.get(chapter.subject_id)
                            if subject:
                                if subject.name not in subject_perf:
                                    subject_perf[subject.name] = []
                                subject_perf[subject.name].append(attempt.score or 0)
                
                # Format subject performance
                subject_summary = "; ".join([
                    f"{subj}: {sum(scores)/len(scores):.1f}% ({len(scores)} attempts)" 
                    for subj, scores in subject_perf.items()
                ])
                
                # Monthly activity count (current month)
                current_month = datetime.now().month
                current_year = datetime.now().year
                monthly_count = UserQuizAttempt.query.filter(
                    UserQuizAttempt.user_id == user.id,
                    extract('month', UserQuizAttempt.started_at) == current_month,
                    extract('year', UserQuizAttempt.started_at) == current_year
                ).count()
                
                # Write user summary row
                row = [
                    'USER_SUMMARY',  # Export_Type
                    user.id,  # User_ID
                    user.email,  # User_Email
                    user.full_name or '',  # User_Full_Name
                    role,  # User_Role
                    user.active,  # User_Active
                    user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',  # User_Created_Date
                    user.last_activity.strftime('%Y-%m-%d %H:%M:%S') if user.last_activity else '',  # User_Last_Activity
                    '', '', '', '', '', '',  # Quiz fields (empty for summary)
                    '', '',  # Subject and Chapter (empty for summary)
                    '', '', '', '', '', '', '',  # Attempt fields (empty for summary)
                    total_quizzes,  # User_Total_Quizzes
                    round(avg_score, 1),  # User_Average_Score
                    round(best_score, 1),  # User_Best_Score
                    subject_summary,  # Subject_Performance
                    monthly_count  # Monthly_Activity_Count
                ]
                writer.writerow(row)
                rows_written += 1
            
            print(f"User summary data written: {len(all_users)} users")
            
            # SECTION 2: DETAILED QUIZ ATTEMPT DATA
            print("Writing detailed quiz attempt data...")
            
            # Get all quiz attempts with detailed information
            all_attempts = UserQuizAttempt.query.filter(
                UserQuizAttempt.completed_at.isnot(None)
            ).order_by(UserQuizAttempt.started_at.desc()).all()
            
            for attempt in all_attempts:
                user = User.query.get(attempt.user_id)
                quiz = Quiz.query.get(attempt.quiz_id)
                
                if not user or not quiz:
                    continue
                
                # Get quiz details
                chapter = Chapter.query.get(quiz.chapter_id) if quiz.chapter_id else None
                subject = Subject.query.get(chapter.subject_id) if chapter and chapter.subject_id else None
                
                # Calculate attempt details
                time_taken_minutes = 0
                if attempt.completed_at and attempt.started_at:
                    time_taken_seconds = (attempt.completed_at - attempt.started_at).total_seconds()
                    time_taken_minutes = int(time_taken_seconds // 60)
                
                # Get question/answer details
                user_answers = UserAnswer.query.filter_by(attempt_id=attempt.id).all()
                total_questions = len(user_answers)
                correct_answers = 0
                
                for answer in user_answers:
                    option = Option.query.get(answer.option_id)
                    if option and option.is_correct:
                        correct_answers += 1
                
                # User role
                role = 'admin' if any(r.name == 'admin' for r in user.roles) else 'user'
                
                # User overall statistics (for context)
                user_all_attempts = UserQuizAttempt.query.filter_by(user_id=user.id).all()
                user_completed = [a for a in user_all_attempts if a.completed_at is not None]
                user_scores = [a.score for a in user_completed if a.score is not None]
                user_avg = sum(user_scores) / len(user_scores) if user_scores else 0
                user_best = max(user_scores) if user_scores else 0
                
                # Write detailed attempt row
                row = [
                    'QUIZ_ATTEMPT',  # Export_Type
                    user.id,  # User_ID
                    user.email,  # User_Email
                    user.full_name or '',  # User_Full_Name
                    role,  # User_Role
                    user.active,  # User_Active
                    user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else '',  # User_Created_Date
                    user.last_activity.strftime('%Y-%m-%d %H:%M:%S') if user.last_activity else '',  # User_Last_Activity
                    quiz.id,  # Quiz_ID
                    quiz.title,  # Quiz_Title
                    quiz.description or '',  # Quiz_Description
                    quiz.time_limit,  # Quiz_Time_Limit
                    quiz.is_published,  # Quiz_Is_Published
                    quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else '',  # Quiz_Created_Date
                    subject.name if subject else '',  # Subject_Name
                    chapter.name if chapter else '',  # Chapter_Name
                    attempt.id,  # Attempt_ID
                    attempt.score or 0,  # Attempt_Score
                    attempt.started_at.strftime('%Y-%m-%d %H:%M:%S') if attempt.started_at else '',  # Attempt_Started_At
                    attempt.completed_at.strftime('%Y-%m-%d %H:%M:%S') if attempt.completed_at else '',  # Attempt_Completed_At
                    time_taken_minutes,  # Attempt_Time_Taken_Minutes
                    total_questions,  # Total_Questions
                    correct_answers,  # Correct_Answers
                    len(user_completed),  # User_Total_Quizzes
                    round(user_avg, 1),  # User_Average_Score
                    round(user_best, 1),  # User_Best_Score
                    '',  # Subject_Performance (empty for individual attempts)
                    ''   # Monthly_Activity_Count (empty for individual attempts)
                ]
                writer.writerow(row)
                rows_written += 1
            
            print(f"Detailed attempt data written: {len(all_attempts)} attempts")
            
            # SECTION 3: QUIZ METADATA
            print("Writing quiz metadata...")
            
            all_quizzes = Quiz.query.all()
            for quiz in all_quizzes:
                chapter = Chapter.query.get(quiz.chapter_id) if quiz.chapter_id else None
                subject = Subject.query.get(chapter.subject_id) if chapter and chapter.subject_id else None
                creator = User.query.get(quiz.created_by) if quiz.created_by else None
                
                # Quiz statistics
                quiz_attempts = UserQuizAttempt.query.filter_by(quiz_id=quiz.id).all()
                completed_quiz_attempts = [a for a in quiz_attempts if a.completed_at is not None]
                quiz_scores = [a.score for a in completed_quiz_attempts if a.score is not None]
                
                avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
                total_attempts = len(completed_quiz_attempts)
                question_count = Question.query.filter_by(quiz_id=quiz.id).count()
                
                # Write quiz metadata row
                row = [
                    'QUIZ_METADATA',  # Export_Type
                    creator.id if creator else '',  # User_ID (creator)
                    creator.email if creator else '',  # User_Email (creator)
                    creator.full_name if creator else '',  # User_Full_Name (creator)
                    'admin' if creator and any(r.name == 'admin' for r in creator.roles) else 'user',  # User_Role (creator)
                    '',  # User_Active (not applicable)
                    '',  # User_Created_Date (not applicable)
                    '',  # User_Last_Activity (not applicable)
                    quiz.id,  # Quiz_ID
                    quiz.title,  # Quiz_Title
                    quiz.description or '',  # Quiz_Description
                    quiz.time_limit,  # Quiz_Time_Limit
                    quiz.is_published,  # Quiz_Is_Published
                    quiz.created_at.strftime('%Y-%m-%d %H:%M:%S') if quiz.created_at else '',  # Quiz_Created_Date
                    subject.name if subject else '',  # Subject_Name
                    chapter.name if chapter else '',  # Chapter_Name
                    '',  # Attempt_ID (not applicable)
                    round(avg_quiz_score, 1),  # Attempt_Score (average for this quiz)
                    '',  # Attempt_Started_At (not applicable)
                    '',  # Attempt_Completed_At (not applicable)
                    '',  # Attempt_Time_Taken_Minutes (not applicable)
                    question_count,  # Total_Questions (in this quiz)
                    '',  # Correct_Answers (not applicable)
                    total_attempts,  # User_Total_Quizzes (total attempts for this quiz)
                    round(avg_quiz_score, 1),  # User_Average_Score (average score for this quiz)
                    max(quiz_scores) if quiz_scores else 0,  # User_Best_Score (best score for this quiz)
                    '',  # Subject_Performance (not applicable)
                    ''   # Monthly_Activity_Count (not applicable)
                ]
                writer.writerow(row)
                rows_written += 1
            
            print(f"Quiz metadata written: {len(all_quizzes)} quizzes")
        
        if not os.path.exists(filepath):
            raise Exception(f"Export file was not created: {filepath}")
        
        if not os.access(filepath, os.R_OK):
            raise Exception(f"Export file is not readable: {filepath}")
        print(f"CSV export completed. Total rows: {rows_written}")
        
        # Calculate file size
        file_size = os.path.getsize(filepath)
        file_size_mb = file_size / (1024 * 1024)
        
        # Generate download URL
        download_url = f"http://localhost:5000/api/export/download/{filename}"
        
        print(f"Download URL: {download_url}")
        print(f"File saved at: {filepath}")
        print(f"File size: {file_size_mb:.2f} MB")
        try:
            with open(filepath, 'r') as test_file:
                first_line = test_file.readline()
                print(f"File verification successful. First line: {first_line[:50]}...")
        except Exception as e:
            print(f"Warning: Could not verify file accessibility: {e}")
        # Get all admin users to notify
        admin_users = User.query.filter(User.roles.any(Role.name == 'admin')).all()
        
        
        # Send completion notification to all admins
        notifications_sent = 0
        for admin in admin_users:
            success = send_export_completion_email(
                admin, 
                filename, 
                download_url, 
                rows_written, 
                file_size_mb,
                timestamp
            )
            if success:
                notifications_sent += 1
        
        result_message = f"CSV export completed - {rows_written} rows, {file_size_mb:.2f}MB, {notifications_sent} notifications sent"
        current_app.logger.info(result_message)
        print(f"=== {result_message} ===")
        
        return {
            'status': 'completed',
            'filename': filename,
            'download_url': download_url,
            'rows_exported': rows_written,
            'file_size_mb': round(file_size_mb, 2),
            'notifications_sent': notifications_sent,
            'timestamp': timestamp,
            'export_sections': ['USER_SUMMARY', 'QUIZ_ATTEMPT', 'QUIZ_METADATA']
        }
        
    except Exception as e:
        error_message = f"Error in CSV export task: {str(e)}"
        current_app.logger.error(error_message)
        print(f"❌ {error_message}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        print(traceback.format_exc())
        
        # Notify admins of failure
        try:
            admin_users = User.query.filter(User.roles.any(Role.name == 'admin')).all()
            for admin in admin_users:
                send_export_failure_email(admin, str(e))
        except:
            pass  # Don't let notification failure break the main error handling
        
        return {
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def send_export_completion_email(admin_user, filename, download_url, total_rows, file_size_mb, timestamp):
    """Send email notification when export is completed"""
    try:
        subject = "✅ Quiz Master CSV Export Completed"
        
        # Format timestamp for display
        export_time = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
        formatted_time = export_time.strftime("%B %d, %Y at %I:%M %p")
        
        body = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Export Completed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✅ Export Completed</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your CSV export is ready for download</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0;">Hi {admin_user.full_name}!</h2>
                    
                    <p style="font-size: 16px; color: #6c757d; margin-bottom: 25px;">
                        Your requested CSV export has been completed successfully. Here are the details:
                    </p>
                    
                    <!-- Export Details -->
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📊 Export Details</h3>
                        
                        <div style="display: grid; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                <span style="font-weight: 600; color: #495057;">File Name:</span>
                                <span style="color: #6c757d;">{filename}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                <span style="font-weight: 600; color: #495057;">Export Time:</span>
                                <span style="color: #6c757d;">{formatted_time}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                <span style="font-weight: 600; color: #495057;">Total Records:</span>
                                <span style="color: #6c757d;">{total_rows:,} rows</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span style="font-weight: 600; color: #495057;">File Size:</span>
                                <span style="color: #6c757d;">{file_size_mb:.2f} MB</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Data Sections -->
                    <div style="background-color: #e7f3ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 18px;">📋 Data Sections Included</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #495057;">
                            <li style="margin-bottom: 8px;"><strong>User Summary:</strong> Complete user profiles with performance statistics</li>
                            <li style="margin-bottom: 8px;"><strong>Quiz Attempts:</strong> Detailed attempt data with scores and timing</li>
                            <li style="margin-bottom: 8px;"><strong>Quiz Metadata:</strong> Quiz information with aggregate statistics</li>
                        </ul>
                    </div>
                    
                    <!-- Download Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{download_url}" 
                           style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                                  display: inline-block;">
                            📥 Download CSV File
                        </a>
                    </div>
                    
                    <!-- Important Notes -->
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Notes:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
                            <li>This export contains sensitive data. Please handle it securely.</li>
                            <li>The download link will be available for 30 days.</li>
                            <li>File includes three data types: USER_SUMMARY, QUIZ_ATTEMPT, and QUIZ_METADATA.</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 30px;">
                        Thank you for using Quiz Master!<br>
                        <strong>Quiz Master Admin Team</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email(admin_user.email, subject, body)
        
    except Exception as e:
        current_app.logger.error(f"Error sending export completion email to {admin_user.email}: {str(e)}")
        return False

def send_export_failure_email(admin_user, error_message):
    """Send email notification when export fails"""
    try:
        subject = "❌ Quiz Master CSV Export Failed"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center; color: white;">
                <h1 style="color: white; margin: 0; font-size: 28px;">❌ Export Failed</h1>
                <p style="color: #f8f9fa; margin: 10px 0 0 0;">There was an issue with your CSV export</p>
            </div>
            
            <div style="padding: 30px; background-color: white;">
                <h2 style="color: #495057;">Hi {admin_user.full_name},</h2>
                
                <p style="font-size: 16px; color: #6c757d;">
                    We're sorry, but your CSV export request failed to complete. 
                </p>
                
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h4 style="color: #721c24; margin: 0 0 10px 0;">Error Details:</h4>
                    <p style="color: #721c24; margin: 0; font-family: monospace; font-size: 14px;">{error_message}</p>
                </div>
                
                <p style="font-size: 16px; color: #6c757d;">
                    Please try again later or contact the system administrator if the problem persists.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5000/admin" 
                       style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold;
                              font-size: 16px;">
                        🔄 Try Again
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
                    Quiz Master Admin Team
                </p>
            </div>
        </body>
        </html>
        """
        
        return send_email(admin_user.email, subject, body)
        
    except Exception as e:
        current_app.logger.error(f"Error sending export failure email to {admin_user.email}: {str(e)}")
        return False