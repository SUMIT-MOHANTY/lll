from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import BadRequest, Conflict
import logging
from datetime import datetime
from backend.models.booking import Booking
from backend.middleware.auth import login_required
from backend.config.database import db_session

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

booking_bp = Blueprint('bookings', __name__)

@booking_bp.route('/api/bookings', methods=['POST'])
@login_required
def create_booking(current_user):
    """
    Create a new booking with uniqueness constraint validation
    """
    try:
        logger.info(f"Processing booking request for user: {current_user['id']}")
        data = request.get_json()

        # Validate required fields
        required_fields = ['office_id', 'slot_id', 'booking_date']
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({'error': f"Missing required field: {field}"}), 400

        # Parse booking date
        try:
            booking_date = datetime.fromisoformat(data['booking_date'].replace('Z', '+00:00'))
        except ValueError as e:
            logger.error(f"Invalid date format: {e}")
            return jsonify({'error': f"Invalid date format: {str(e)}"}), 400

        # Create new booking
        new_booking = Booking(
            user_id=current_user['id'],
            office_id=data['office_id'],
            slot_id=data['slot_id'],
            booking_date=booking_date,
            status="confirmed"
        )

        # Save booking with uniqueness constraint
        try:
            db_session.add(new_booking)
            db_session.commit()
            logger.info(f"Booking created successfully: {new_booking.id}")
            return jsonify(new_booking.to_dict()), 201
        except IntegrityError as e:
            db_session.rollback()
            if "unique_booking" in str(e):
                logger.warning(f"Duplicate booking attempted: {str(e)}")
                return jsonify({'error': 'You already have a booking for this slot and date'}), 409
            else:
                logger.error(f"Database integrity error: {str(e)}")
                return jsonify({'error': 'Database constraint violation'}), 400

    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        return jsonify({'error': f"Server error: {str(e)}"}), 500

@booking_bp.route('/api/bookings', methods=['GET'])
@login_required
def get_user_bookings(current_user):
    """Get all bookings for the current user"""
    try:
        bookings = Booking.query.filter_by(user_id=current_user['id']).all()
        return jsonify([booking.to_dict() for booking in bookings])
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        return jsonify({'error': f"Server error: {str(e)}"}), 500

# Error handlers
@booking_bp.errorhandler(BadRequest)
def handle_bad_request(error):
    return jsonify({'error': str(error)}), 400

@booking_bp.errorhandler(Conflict)
def handle_conflict(error):
    return jsonify({'error': str(error)}), 409
