"""Add unique constraint to bookings

Revision ID: ${timestamp}
Revises:
Create Date: $(date -u +"%Y-%m-%d %H:%M:%S.%3N")

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '${timestamp}'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add unique constraint to prevent duplicate bookings
    op.create_unique_constraint('uix_user_slot', 'bookings', ['user_id', 'slot_id'])

def downgrade():
    # Remove unique constraint
    op.drop_constraint('uix_user_slot', 'bookings', type_='unique')
