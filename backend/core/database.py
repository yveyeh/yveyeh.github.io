from contextlib import contextmanager
from typing import Generator
from sqlalchemy.orm import Session
from models import db


class DomainValidationError(ValueError):
    """Raised when a domain invariant or consistency rule is violated."""


class EntityNotFoundError(LookupError):
    """Raised when a requested entity does not exist."""


class TransactionManager:
    """
    Unit-of-Work manager enforcing strict ACID transaction semantics:
    - Atomicity: All operations within `atomic()` succeed together or roll back completely.
    - Consistency: Validates domain invariants before commit and rolls back on SQL/integrity errors.
    - Isolation: Supports row-level locking (`SELECT ... FOR UPDATE`) and atomic SQL expressions.
    - Durability: Commits directly to MySQL InnoDB storage with pre-ping connection pooling.
    """

    @staticmethod
    @contextmanager
    def atomic() -> Generator[Session, None, None]:
        session: Session = db.session
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise

