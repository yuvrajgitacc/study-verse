# StudyVerse - AI Study Partner

A Flask-based study companion application. StudyVerse helps university students manage their studies with AI assistance, Pomodoro timers, task management, and progress tracking.

## Features

- **Authentication**: Sign up and sign in with email
- **Dashboard**: Overview of study stats, proficiency, and quick actions
- **Personal AI Agent**: Chat with an AI study companion
- **Group Chat**: Collaborate with study groups
- **Todos**: Manage personal and group tasks
- **Pomodoro Timer**: Focus sessions with breaks
- **Syllabus**: Track course topics and proficiency
- **Progress**: View study statistics and achievements
- **Settings**: Manage profile and preferences

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite (default, can be changed)
- **Authentication**: Flask-Login

## Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Run the application**:
```bash
python app.py
```

3. **Access the application**:
   - Open your browser and go to `http://localhost:5000`
   - Sign up for a new account or sign in

## Project Structure

```
.
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/            # HTML templates
│   ├── layout.html       # Base layout with sidebar
│   ├── auth.html         # Authentication page
│   ├── dashboard.html    # Dashboard page
│   ├── chat.html         # Personal AI chat
│   ├── group_chat.html   # Group chat
│   ├── todos.html        # Todo management
│   ├── pomodoro.html     # Pomodoro timer
│   ├── syllabus.html     # Syllabus tracking
│   ├── progress.html     # Progress statistics
│   └── settings.html     # Settings page
├── static/
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       ├── main.js       # Common utilities
│       ├── auth.js       # Authentication logic
│       ├── chat.js       # Chat functionality
│       ├── todos.js      # Todo management
│       ├── pomodoro.js   # Timer functionality
│       ├── syllabus.js   # Syllabus features
│       └── group_chat.js # Group chat features
└── StudyVerse.db             # SQLite database (created automatically)
```

## Configuration

The application uses environment variables for configuration:

- `SECRET_KEY`: Flask secret key (defaults to a placeholder - change in production)
- `DATABASE_URL`: Database connection string (defaults to SQLite)

To use a different database, set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL=postgresql://user:password@localhost/StudyVerse
python app.py
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/<id>` - Update todo
- `DELETE /api/todos/<id>` - Delete todo

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/history` - Get chat history

### Pomodoro
- `POST /api/pomodoro/sessions` - Save Pomodoro session

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

## Development

The application runs in debug mode by default. For production:

1. Set `FLASK_ENV=production`
2. Use a production WSGI server (e.g., Gunicorn)
3. Set a strong `SECRET_KEY`
4. Use a production database (PostgreSQL recommended)

## Notes

- The AI chat responses are currently simple placeholders. You can integrate with OpenAI, Anthropic, or other AI services by modifying the `/api/chat` endpoint in `app.py`.
- Google OAuth sign-in is not yet implemented (placeholder in UI).
- PDF upload functionality is simulated (you can implement actual PDF processing).

## License

This project is for educational purposes.

