from flask import request, jsonify
from functools import wraps
import jwt
import logging
from datetime import datetime, timedelta
import os

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get JWT secret from environment or use default for development
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key-change-in-production')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # Check if token is in headers
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                logger.warning("Malformed Authorization header")
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            logger.warning("No token provided")
            return jsonify({'error': 'Authentication token is required'}), 401

        try:
            # Decode and verify token
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user = {
                'id': payload['user_id'],
                'email': payload['email'],
                'role': payload.get('role', 'user')
            }
        except jwt.ExpiredSignatureError:
            logger.warning("Expired token")
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({'error': f"Token validation error: {str(e)}"}), 500

        return f(user, *args, **kwargs)

    return decorated_function
