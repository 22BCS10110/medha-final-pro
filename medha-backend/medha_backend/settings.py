"""
Django settings for medha_backend project.
Medhā Health Intelligence Platform — Backend Configuration
"""

import os
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
    'abdm_simulator',  # ABDM Simulation Module (Demo/Pilot)
    'consent',          # One-time patient consent system
    'chat',             # Doctor-patient real-time chat
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
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ═══ JWT CONFIG ═══
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ═══ GOOGLE OAUTH CONFIG ═══
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# ═══ SUPABASE SYNC ═══
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
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

# ═══ LOCAL FILE STORAGE ═══
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ═══ CHANNELS (WebSocket for Chat) ═══
ASGI_APPLICATION = 'medha_backend.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
