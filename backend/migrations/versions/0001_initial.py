"""Esquema inicial, independiente de modelos futuros."""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("portfolio", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("revision", sa.Integer(), nullable=False), sa.Column("content", sa.JSON(), nullable=False))
    op.create_table("admins", sa.Column("username", sa.String(80), primary_key=True), sa.Column("password_hash", sa.Text(), nullable=False))
    op.create_table("admin_sessions", sa.Column("token_hash", sa.String(64), primary_key=True), sa.Column("username", sa.String(80), nullable=False), sa.Column("expires_at", sa.Float(), nullable=False))
    op.create_table("messages", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(100), nullable=False), sa.Column("email", sa.String(254), nullable=False), sa.Column("phone", sa.String(40), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("created_at", sa.Float(), nullable=False), sa.Column("attended", sa.Boolean(), nullable=False))


def downgrade():
    for table in ("messages", "admin_sessions", "admins", "portfolio"):
        op.drop_table(table)
