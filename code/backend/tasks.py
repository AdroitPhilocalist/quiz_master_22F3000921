import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from backend.models import *
from sqlalchemy import func, desc, or_, extract
from flask import current_app
import logging
import calendar

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