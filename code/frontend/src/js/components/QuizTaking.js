export default {
    props: ['quizId'],
    data() {
        return {
            quiz: null,
            questions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            loading: true,
            error: null,
            attemptId: null,
            timeLeft: 0,
            timer: null,
            quizCompleted: false,
            quizResults: null,
            showConfirmSubmit: false,
            animating: false,
            showHint: false,
            currentHint: null
        }
    },
    computed: {
        currentQuestion() {
            return this.questions[this.currentQuestionIndex] || null;
        },
        progress() {
            if (!this.questions.length) return 0;
            return Math.round(((this.currentQuestionIndex) / this.questions.length) * 100);
        },
        formattedTimeLeft() {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },
        isLastQuestion() {
            return this.currentQuestionIndex === this.questions.length - 1;
        },
        allQuestionsAnswered() {
            return Object.keys(this.userAnswers).length === this.questions.length;
        },
        answeredQuestions() {
            return Object.keys(this.userAnswers).length;
        },
        unansweredQuestions() {
            return this.questions.length - this.answeredQuestions;
        },
        timeLeftPercentage() {
            if (!this.quiz || !this.quiz.time_limit) return 100;
            const totalSeconds = this.quiz.time_limit * 60;
            return (this.timeLeft / totalSeconds) * 100;
        },
        timeLeftClass() {
            if (this.timeLeftPercentage > 50) return 'bg-success';
            if (this.timeLeftPercentage > 25) return 'bg-warning';
            return 'bg-danger';
        },
        timeWarning() {
            return this.timeLeft < 300; // Less than 5 minutes
        },
        timeCritical() {
            return this.timeLeft < 60; // Less than 1 minute
        }
    },
    created() {
        this.startQuiz();
    },
    beforeUnmount() {
        this.stopTimer();
    },
    methods: {
        async startQuiz() {
            this.loading = true;
            try {
                // Start the quiz attempt
                const startResponse = await axios.post(`/api/quizzes/${this.quizId}/start`, {}, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.attemptId = startResponse.data.attempt_id;
                
                // Get quiz details
                const quizResponse = await axios.get(`/api/quizzes/${this.quizId}`, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token')
                    }
                });
                
                this.quiz = quizResponse.data;
                this.questions = quizResponse.data.questions;
                this.timeLeft = quizResponse.data.time_limit * 60; // Convert minutes to seconds
                
                // Start the timer
                this.startTimer();
            } catch (error) {
                this.error = 'Failed to load quiz';
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        
        startTimer() {
            this.timer = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                } else {
                    this.submitQuiz();
                }
            }, 1000);
        },
        
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        
        selectOption(questionId, optionId) {
            const updatedAnswers = { ...this.userAnswers };
            updatedAnswers[questionId] = optionId;
            this.userAnswers = updatedAnswers;
            
            // Auto-advance to next question if not the last one
            if (!this.isLastQuestion && !this.animating) {
                this.animating = true;
                setTimeout(() => {
                    this.nextQuestion();
                    this.animating = false;
                }, 1500);
            }
        },
        
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        
        nextQuestion() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        
        goToQuestion(index) {
            if (index >= 0 && index < this.questions.length) {
                this.currentQuestionIndex = index;
            }
        },
        
        openSubmitConfirmation() {
            this.showConfirmSubmit = true;
        },
        
        cancelSubmit() {
            this.showConfirmSubmit = false;
        },
        
        async submitQuiz() {
            this.loading = true;
            this.stopTimer();
            
            try {
                // Format the answers correctly for the backend
                const formattedAnswers = {};
                for (const questionId in this.userAnswers) {
                    // Make sure we're sending a valid option_id
                    const optionId = this.userAnswers[questionId];
                    if (optionId) {
                        formattedAnswers[questionId] = {
                            option_id: parseInt(optionId)
                        };
                    }
                }
                
                console.log("Submitting answers:", formattedAnswers); // Debug log
                
                const response = await axios.post(`/api/attempts/${this.attemptId}/submit`, {
                    answers: formattedAnswers
                }, {
                    headers: {
                        'Authentication-Token': localStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                });
                
                this.quizCompleted = true;
                this.quizResults = response.data;
                
                // Redirect to results page
                this.$router.push(`/quiz-result/${this.attemptId}`);
            } catch (error) {
                this.error = 'Failed to submit quiz';
                console.error(error.response ? error.response.data : error);
            } finally {
                this.loading = false;
                this.showConfirmSubmit = false;
            }
        },
        
        isOptionSelected(questionId, optionId) {
            return this.userAnswers[questionId] === optionId;
        },
        
        isQuestionAnswered(questionId) {
            return questionId in this.userAnswers;
        }
    },
    template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%); position: relative; overflow: hidden;">
    <!-- Background decorative elements -->
    <div style="position: absolute; top: -120px; right: -80px; width: 300px; height: 300px; border-radius: 50%; background: linear-gradient(135deg, rgba(78, 84, 200, 0.05) 0%, rgba(143, 148, 251, 0.05) 100%); z-index: 0;"></div>
    <div style="position: absolute; bottom: -150px; left: -100px; width: 400px; height: 400px; border-radius: 50%; background: linear-gradient(135deg, rgba(78, 84, 200, 0.03) 0%, rgba(143, 148, 251, 0.03) 100%); z-index: 0;"></div>
    
<!-- Loading State -->
<div v-if="loading && !quiz" style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);">
    <div style="width: 220px; height: 220px; background: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); position: relative; overflow: hidden;">
        <!-- Replace CSS animations with SVG animations -->
        <svg style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="transparent" stroke-width="3" stroke-dasharray="301.59" stroke-dashoffset="0" style="stroke-dashoffset: 75%; stroke-linecap: round;">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="stroke" values="transparent; #6e77f0; transparent" dur="1s" repeatCount="indefinite"></animate>
            </circle>
            <circle cx="50" cy="50" r="40" fill="none" stroke="transparent" stroke-width="3" stroke-dasharray="251.33" stroke-dashoffset="0" style="stroke-dashoffset: 75%; stroke-linecap: round;">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 50 50" to="360 50 50" dur="1.5s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="stroke" values="transparent; #a5aafa; transparent" dur="1.5s" repeatCount="indefinite"></animate>
            </circle>
            <circle cx="50" cy="50" r="32" fill="none" stroke="transparent" stroke-width="3" stroke-dasharray="201.06" stroke-dashoffset="0" style="stroke-dashoffset: 75%; stroke-linecap: round;">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 50 50" to="360 50 50" dur="2s" repeatCount="indefinite"></animateTransform>
                <animate attributeName="stroke" values="transparent; #d4d7fa; transparent" dur="2s" repeatCount="indefinite"></animate>
            </circle>
        </svg>
        <div style="font-size: 18px; font-weight: 600; color: #5a67e3; position: relative; z-index: 1;">Loading Quiz...</div>
    </div>
    <p style="margin-top: 25px; color: #6e77f0; font-size: 16px; letter-spacing: 1px; font-weight: 500;">Preparing your challenge...</p>
</div>
    
    <!-- Error State -->
    <div v-else-if="error" style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 20px;">
        <div style="background: white; border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); padding: 30px; max-width: 500px; width: 100%; text-align: center;">
            <div style="width: 80px; height: 80px; background: rgba(234, 84, 85, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px;">
                <i class="fas fa-exclamation-triangle" style="color: #ea5455; font-size: 32px;"></i>
            </div>
            <h3 style="color: #333; margin-bottom: 10px; font-weight: 600;">Oops! Something went wrong</h3>
            <p style="color: #666; margin-bottom: 25px;">{{ error }}</p>
            <button @click="startQuiz" style="background: linear-gradient(135deg, #6e77f0 0%, #5a67e3 100%); color: white; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(106, 119, 240, 0.3);">
                <i class="fas fa-redo me-2"></i> Try Again
            </button>
        </div>
    </div>
    
    <!-- Quiz Content -->
    <div v-else-if="quiz" style="min-height: 100vh; padding: 30px 20px; position: relative; z-index: 1;">
        <div class="container-fluid" style="max-width: 1400px; margin: 0 auto;">
            <!-- Quiz Header -->
            <div class="row mb-4">
                <div class="col-12">
                    <div style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); overflow: hidden; position: relative;">
                        <!-- Decorative elements -->
                        <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);"></div>
                        <div style="position: absolute; bottom: -40px; left: 20%; width: 100px; height: 100px; border-radius: 50%; background: rgba(255, 255, 255, 0.05);"></div>
                        <div style="position: absolute; top: 40%; left: 30px; width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);"></div>
                        <div style="position: absolute; top: 20%; right: 20%; width: 15px; height: 15px; border-radius: 50%; background: rgba(255, 255, 255, 0.15);"></div>
                        
                        <div style="padding: 30px; position: relative; z-index: 1;">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <h2 style="color: white; font-weight: 700; margin-bottom: 8px; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">{{ quiz.title }}</h2>
                                    <div style="display: flex; align-items: center;">
                                        <div style="background: rgba(255, 255, 255, 0.2); padding: 5px 15px; border-radius: 30px; margin-right: 10px;">
                                            <span style="color: white; font-size: 14px; font-weight: 500;"><i class="fas fa-book me-2"></i>{{ quiz.subject }}</span>
                                        </div>
                                        <div style="background: rgba(255, 255, 255, 0.2); padding: 5px 15px; border-radius: 30px;">
                                            <span style="color: white; font-size: 14px; font-weight: 500;"><i class="fas fa-layer-group me-2"></i>{{ quiz.chapter }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mt-3 mt-md-0">
                                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                        <div style="position: relative; width: 100%; max-width: 200px; height: 200px; margin-bottom: 15px;">
                                            <!-- Circular timer -->
                                            <div style="position: relative; width: 100%; height: 100%;">
                                                <svg width="100%" height="100%" viewBox="0 0 120 120" style="transform: rotate(-90deg)">
                                                    <!-- Background circle -->
                                                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="12"></circle>
                                                    <!-- Progress circle with animation -->
                                                    <circle cx="60" cy="60" r="54" fill="none" :stroke="timeLeftPercentage > 50 ? '#4cd964' : timeLeftPercentage > 25 ? '#ffcc00' : '#ff3b30'" stroke-width="12" :stroke-dasharray="339.292" :stroke-dashoffset="(1 - timeLeftPercentage/100) * 339.292" style="transition: all 1s linear;"></circle>
                                                </svg>
                                                <!-- Time display in center -->
                                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex-direction: column;">
                                                    <span style="font-size: 32px; color: white; font-weight: 700; letter-spacing: 1px; margin-bottom: 5px;" :style="{'color': timeLeft < 60 ? '#ff3b30' : 'white', 'animation': timeCritical ? 'pulse 1s infinite' : 'none'}">{{ formattedTimeLeft }}</span>
                                                    <span style="font-size: 14px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 1px;">Time Left</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button @click="openSubmitConfirmation" style="background: rgba(255, 255, 255, 0.9); color: #5a67e3; border: none; padding: 12px 25px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);"
                                                onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(0, 0, 0, 0.15)';"
                                                onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.1)';">
                                            <i class="fas fa-paper-plane me-2"></i> Submit Quiz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Progress bar at bottom -->
                        <div style="height: 8px; background: rgba(255, 255, 255, 0.1); width: 100%; overflow: hidden;">
                            <div :style="{ width: progress + '%', height: '100%', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '0', transition: 'width 0.5s ease' }"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Main Question Column -->
                <div class="col-lg-9 order-2 order-lg-1">
                    <!-- Question Panel -->
                    <div style="background: white; border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); overflow: hidden; margin-bottom: 30px; height: calc(100% - 30px);">
                        <!-- Question header -->
                        <div style="padding: 20px 30px; background: linear-gradient(to right, rgba(90, 103, 227, 0.05), rgba(110, 119, 240, 0.05)); border-bottom: 1px solid rgba(0, 0, 0, 0.05); display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); border-radius: 12px; display: flex; justify-content: center; align-items: center; margin-right: 15px; box-shadow: 0 4px 10px rgba(90, 103, 227, 0.2);">
                                    <span style="color: white; font-weight: 600; font-size: 18px;">{{ currentQuestionIndex + 1 }}</span>
                                </div>
                                <h5 style="margin: 0; color: #333; font-weight: 600;">Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h5>
                            </div>
                            <div style="background: #f8f9fa; border-radius: 30px; padding: 5px 15px; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <span style="color: #5a67e3; font-weight: 600; font-size: 14px;">{{ progress }}% Complete</span>
                            </div>
                        </div>
                        
                        <!-- Question content -->
                        <div style="padding: 30px; flex-grow: 1; display: flex; flex-direction: column; position: relative;">
                            <div v-if="currentQuestion" class="animate__animated animate__fadeIn" style="animation-duration: 0.5s;">
                                <!-- Question text -->
                                <div style="margin-bottom: 30px; padding: 25px; border-radius: 16px; background: #f8f9fa; border-left: 4px solid #5a67e3; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                                    <h4 style="color: #333; font-weight: 600; margin: 0;">{{ currentQuestion.text }}</h4>
                                </div>
                                
                                <!-- Options -->
                                <div style="display: flex; flex-direction: column; gap: 16px;">
                                    <div v-for="(option, idx) in currentQuestion.options" :key="option.id" 
                                        class="animate__animated" 
                                        :class="{'animate__pulse': isOptionSelected(currentQuestion.id, option.id)}"
                                        :style="{'animation-duration': '0.5s', 'animation-delay': 0.1 * idx + 's'}"
                                        @click="selectOption(currentQuestion.id, option.id)">
                                        <div style="border-radius: 16px; overflow: hidden; transition: all 0.3s ease; cursor: pointer; position: relative;"
                                            :style="{
                                                'background': isOptionSelected(currentQuestion.id, option.id) ? 'linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%)' : 'white',
                                                'box-shadow': isOptionSelected(currentQuestion.id, option.id) 
                                                    ? '0 10px 25px rgba(90, 103, 227, 0.3)' 
                                                    : '0 4px 15px rgba(0, 0, 0, 0.05)',
                                                'transform': isOptionSelected(currentQuestion.id, option.id) ? 'translateY(-3px)' : 'none'
                                            }"
                                            onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(0, 0, 0, 0.1)';"
                                            onmouseout="if(!this.classList.contains('selected')) { this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.05)'; }">
                                            
                                            <!-- Option content -->
                                            <div style="padding: 20px; display: flex; align-items: center; position: relative; overflow: hidden;">
                                                <!-- Selection indicator -->
                                                <div style="width: 26px; height: 26px; min-width: 26px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-right: 15px; transition: all 0.3s ease;"
                                                    :style="{
                                                        'background': isOptionSelected(currentQuestion.id, option.id) ? 'white' : 'rgba(90, 103, 227, 0.1)',
                                                        'border': isOptionSelected(currentQuestion.id, option.id) ? 'none' : '2px solid rgba(90, 103, 227, 0.3)'
                                                    }">
                                                    <i v-if="isOptionSelected(currentQuestion.id, option.id)" class="fas fa-check" style="color: #5a67e3; font-size: 12px;"></i>
                                                </div>
                                                
                                                <!-- Option letter and text -->
                                                <div style="flex-grow: 1; display: flex; align-items: center;">
                                                    <div style="width: 36px; height: 36px; min-width: 36px; border-radius: 10px; display: flex; justify-content: center; align-items: center; margin-right: 15px; font-weight: 600; background: rgba(90, 103, 227, 0.1); color: #5a67e3;"
                                                        :style="{
                                                            'background': isOptionSelected(currentQuestion.id, option.id) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(90, 103, 227, 0.1)',
                                                            'color': isOptionSelected(currentQuestion.id, option.id) ? 'white' : '#5a67e3'
                                                        }">
                                                        {{ String.fromCharCode(65 + idx) }}
                                                    </div>
                                                    <span style="font-size: 16px; font-weight: 500; transition: color 0.3s ease;"
                                                        :style="{ 'color': isOptionSelected(currentQuestion.id, option.id) ? 'white' : '#333' }">
                                                        {{ option.text }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Navigation Footer -->
                        <div style="padding: 20px 30px; background: #f8f9fa; border-top: 1px solid rgba(0, 0, 0, 0.05); display: flex; justify-content: space-between; align-items: center;">
                            <button @click="previousQuestion" 
                                :disabled="currentQuestionIndex === 0"
                                style="padding: 12px 25px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center;"
                                :style="{
                                    'background': currentQuestionIndex === 0 ? '#f1f3f5' : 'white',
                                    'color': currentQuestionIndex === 0 ? '#adb5bd' : '#5a67e3',
                                    'border': currentQuestionIndex === 0 ? '1px solid #dee2e6' : '1px solid #5a67e3',
                                    'box-shadow': currentQuestionIndex === 0 ? 'none' : '0 4px 10px rgba(90, 103, 227, 0.15)'
                                }"
                                onmouseover="if(!this.disabled) { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(90, 103, 227, 0.2)'; }"
                                onmouseout="if(!this.disabled) { this.style.transform=''; this.style.boxShadow='0 4px 10px rgba(90, 103, 227, 0.15)'; }">
                                <i class="fas fa-arrow-left me-2"></i> Previous
                            </button>
                            
                            <button v-if="!isLastQuestion" 
                                @click="nextQuestion"
                                style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); color: white; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(90, 103, 227, 0.3); display: flex; align-items: center;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(90, 103, 227, 0.4)';"
                                onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(90, 103, 227, 0.3)';">
                                Next <i class="fas fa-arrow-right ms-2"></i>
                            </button>
                            
                            <button v-else 
                                @click="openSubmitConfirmation"
                                style="background: linear-gradient(135deg, #28c76f 0%, #20a55b 100%); color: white; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(40, 199, 111, 0.3); display: flex; align-items: center;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(40, 199, 111, 0.4)';"
                                onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(40, 199, 111, 0.3)';">
                                <i class="fas fa-check me-2"></i> Finish Quiz
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Side Navigation Column -->
                <div class="col-lg-3 order-1 order-lg-2 mb-4 mb-lg-0">
                    <!-- Progress card -->
                    <div style="background: white; border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07); overflow: hidden; position: relative;">
                        <!-- Decorative elements -->
                        <div style="position: absolute; top: -15px; right: -15px; width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(90, 103, 227, 0.03) 0%, rgba(110, 119, 240, 0.03) 100%);"></div>
                        <div style="position: absolute; bottom: -20px; left: -20px; width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, rgba(90, 103, 227, 0.02) 0%, rgba(110, 119, 240, 0.02) 100%);"></div>
                        
                        <!-- Progress header -->
                        <div style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); padding: 20px; position: relative;">
                            <h5 style="color: white; margin: 0 0 12px 0; font-weight: 600; font-size: 18px;">Your Progress</h5>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 10px 15px; flex: 1; margin-right: 8px; text-align: center;">
                                    <span style="color: white; font-weight: 600; font-size: 20px; display: block;">{{ answeredQuestions }}</span>
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Answered</span>
                                </div>
                                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px 15px; flex: 1; margin-left: 8px; text-align: center;">
                                    <span style="color: white; font-weight: 600; font-size: 20px; display: block;">{{ unansweredQuestions }}</span>
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Remaining</span>
                                </div>
                            </div>
                            
                            <div style="background: rgba(255, 255, 255, 0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                                <div :style="{ width: (answeredQuestions / questions.length * 100) + '%', height: '100%', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '3px', transition: 'width 0.5s ease' }"></div>
                            </div>
                        </div>
                        
                        <!-- Question Navigator -->
                        <div style="padding: 20px;">
                            <h6 style="margin: 0 0 15px 0; color: #333; font-weight: 600; font-size: 16px;">Question Navigator</h6>
                            
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                <button v-for="(question, index) in questions" :key="question.id" 
                                    @click="goToQuestion(index)"
                                    style="width: 100%; aspect-ratio: 1/1; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden;"
                                    :style="{
                                        'background': index === currentQuestionIndex ? 'linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%)' : (isQuestionAnswered(question.id) ? 'rgba(28, 200, 138, 0.1)' : 'rgba(0, 0, 0, 0.03)'),
                                        'color': index === currentQuestionIndex ? 'white' : (isQuestionAnswered(question.id) ? '#1cc88a' : '#666'),
                                        'box-shadow': index === currentQuestionIndex ? '0 8px 15px rgba(90, 103, 227, 0.3)' : 'none',
                                        'transform': index === currentQuestionIndex ? 'scale(1.05)' : 'scale(1)'
                                    }"
                                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 15px rgba(0, 0, 0, 0.1)';"
                                    onmouseout="if(this.getAttribute('data-current') !== 'true') { this.style.transform='scale(1)'; this.style.boxShadow='none'; }"
                                    :data-current="index === currentQuestionIndex ? 'true' : 'false'">
                                    <span>{{ index + 1 }}</span>
                                    <i v-if="isQuestionAnswered(question.id) && index !== currentQuestionIndex" class="fas fa-check" style="position: absolute; bottom: 5px; right: 5px; font-size: 8px;"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Time info section -->
                        <div style="padding: 0 20px 20px;">
                            <div style="background: rgba(0, 0, 0, 0.02); border-radius: 16px; padding: 15px; margin-top: 10px;">
                                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                    <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f6c23e 0%, #dda20a 100%); display: flex; justify-content: center; align-items: center; margin-right: 15px; box-shadow: 0 4px 10px rgba(246, 194, 62, 0.2);">
                                        <i class="fas fa-hourglass-half" style="color: white;"></i>
                                    </div>
                                    <div>
                                        <h6 style="margin: 0; color: #333; font-weight: 600; font-size: 14px;">Time Remaining</h6>
                                        <p style="margin: 0; color: #666; font-size: 12px;">Manage your time wisely!</p>
                                    </div>
                                </div>
                                
                                <div :class="{'animate__animated': timeWarning, 'animate__pulse': timeWarning, 'animate__infinite': timeWarning}" 
                                     :style="{'animation-duration': '1.5s', 'animation-name': timeWarning ? 'pulse' : 'none', 'animation-iteration-count': timeWarning ? 'infinite' : '1'}">
                                    <div style="background: rgba(255, 255, 255, 0.8); border-radius: 12px; padding: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03); display: flex; justify-content: space-between; align-items: center;" 
                                         :style="{'border-left': timeCritical ? '4px solid #ea5455' : (timeWarning ? '4px solid #f6c23e' : 'none')}">
                                        <div style="font-weight: 700; font-size: 22px; letter-spacing: 1px;" 
                                             :style="{'color': timeCritical ? '#ea5455' : (timeWarning ? '#f6c23e' : '#333')}">
                                            {{ formattedTimeLeft }}
                                        </div>
                                        <div style="width: 50%; height: 6px; background: rgba(0, 0, 0, 0.05); border-radius: 3px; overflow: hidden;">
                                            <div :style="{ width: timeLeftPercentage + '%', height: '100%', borderRadius: '3px', transition: 'width 1s linear', background: timeLeftPercentage > 50 ? 'linear-gradient(to right, #4cd964, #1cc88a)' : (timeLeftPercentage > 25 ? 'linear-gradient(to right, #ffcc00, #f6c23e)' : 'linear-gradient(to right, #ff3b30, #ea5455)') }"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Submit button for small screens -->
                            <button @click="openSubmitConfirmation" class="d-block d-lg-none mt-3 w-100" style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(90, 103, 227, 0.3); margin-top: 15px; width: 100%;">
                                <i class="fas fa-paper-plane me-2"></i> Submit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Submit Confirmation Modal -->
    <div v-if="showConfirmSubmit" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; border-radius: 20px; box-shadow: 0 15px 35px rgba(50, 50, 93, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1); max-width: 500px; width: 90%; padding: 0; overflow: hidden; animation: fadeIn 0.3s ease-out;">
            <!-- Modal Header -->
            <div style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); padding: 20px; position: relative;">
                <h4 style="color: white; margin: 0; font-weight: 600;">Submit Quiz</h4>
            </div>
            
            <!-- Modal Body -->
            <div style="padding: 25px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 70px; height: 70px; background: rgba(90, 103, 227, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 15px;">
                        <i class="fas fa-paper-plane" style="color: #5a67e3; font-size: 28px;"></i>
                    </div>
                    <h5 style="color: #333; font-weight: 600; margin-bottom: 10px;">Are you sure you want to submit?</h5>
                    <p style="color: #666; margin-bottom: 0;">
                        You've answered <span style="font-weight: 600; color: #5a67e3;">{{ answeredQuestions }}</span> out of <span style="font-weight: 600; color: #5a67e3;">{{ questions.length }}</span> questions.
                        <span v-if="unansweredQuestions > 0" style="display: block; color: #ea5455; margin-top: 5px; font-weight: 500;">
                            You still have {{ unansweredQuestions }} unanswered questions!
                        </span>
                    </p>
                </div>
                
                <!-- Warning if there are unanswered questions -->
                <div v-if="unansweredQuestions > 0" style="background: rgba(234, 84, 85, 0.1); border-left: 4px solid #ea5455; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: #333; margin: 0; font-size: 14px;">
                        <i class="fas fa-exclamation-triangle me-2" style="color: #ea5455;"></i>
                        You have <strong>{{ unansweredQuestions }}</strong> unanswered questions. Unanswered questions will be marked as incorrect.
                    </p>
                </div>
                
                <!-- Buttons -->
                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                    <button @click="cancelSubmit" style="background: #f1f3f5; color: #495057; border: none; padding: 12px 25px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(0, 0, 0, 0.1)';"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 10px rgba(0, 0, 0, 0.05)';">
                        Cancel
                    </button>
                    <button @click="submitQuiz" style="background: linear-gradient(135deg, #5a67e3 0%, #6e77f0 100%); color: white; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(90, 103, 227, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(90, 103, 227, 0.4)';"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(90, 103, 227, 0.3)';">
                        Submit Quiz
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    </div>`
}
                                