"""
Django settings for medha_backend project.
Medhā Health Intelligence Platform — Backend Configuration
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-e^dx&yhjm@f7p8(m#w(zwi!5=-uu94g5@*4&v&a6xp2li35c7+'

DEBUG = True

ALLOWED_HOSTS = ['*']

# ═══ INSTALLED APPS ═══
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # Project apps
    'hospitals',  # Hospital management (multi-tenant)
    'accounts',
    'patients',   # Patient data model (patient-facing UI is a separate future app)
    'doctors',
    'records',
    'billing',
    'contact',
]

# ═══ MIDDLEWARE ═══
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ═══ CORS ═══
CORS_ALLOW_ALL_ORIGINS = True  # Dev only

# ═══ REST FRAMEWORK ═══
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

ROOT_URLCONF = 'medha_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'medha_backend.wsgi.application'

# ═══ DATABASE (SQLITE) ═══
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ═══ AUTH ═══
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

# ═══ I18N ═══
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ═══ STATIC ═══
STATIC_URL = 'static/'

# ═══ DEFAULT AUTO FIELD ═══
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ═══ SUPABASE CONFIG ═══
# Supabase Authentication for patient mobile app
# The JWT tokens from Supabase are verified by the backend.
# SQLite remains the source of truth for all business data.
import os

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://mnwhjlgjncmdcjewktuo.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2hqbGdqbmNtZGNqZXdrdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDEyOTAsImV4cCI6MjA5MDg3NzI5MH0.Ieucdm23X2umTxXXapzyBJko6_A-08GojQCEOv75pkY')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2hqbGdqbmNtZGNqZXdrdHVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMwMTI5MCwiZXhwIjoyMDkwODc3MjkwfQ.K-XZs9RRGju-It-ojruLO2uPw5GEH5-IbXZ5ueTTnW8')

# ═══ FIREBASE CONFIG (REMOVED - replaced by Supabase) ═══
# Firebase has been replaced by Supabase for authentication.
# See SUPABASE_* settings above.
