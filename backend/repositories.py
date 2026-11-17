from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from sqlalchemy import func
from models import (
    BlogCommentModel,
    BlogPostModel,
    PostInteractionModel,
    SiteProfile,
    SocialLink,
    TechJobModel,
    db,
)
from seed import BASELINE_METRICS

T = TypeVar("T")


class IReadRepository(ABC, Generic[T]):
    """Interface Segregation (ISP) & Dependency Inversion (DIP) contract for read repositories."""

    @abstractmethod
    def list_all(self) -> list[T]:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, identifier: str, for_update: bool = False) -> T | None:
        raise NotImplementedError


class ProfileRepository:
    """Single Responsibility (SRP): Data access for site profile and social links."""

    def get_or_init_profile(self, for_update: bool = False) -> SiteProfile:
        query = SiteProfile.query
        if for_update:
            query = query.with_for_update()
        profile = query.first()
        if not profile:
            profile = SiteProfile(id=1)
            db.session.add(profile)
            db.session.flush()
        return profile

    def list_socials(self) -> list[SocialLink]:
        return SocialLink.query.order_by(SocialLink.sort_order.asc()).all()


class PostRepository(IReadRepository[BlogPostModel]):
    """Single Responsibility (SRP): Data access for blog posts."""

    def list_all(self) -> list[BlogPostModel]:
        return BlogPostModel.query.order_by(BlogPostModel.date.desc()).all()

    def get_by_id(self, identifier: str, for_update: bool = False) -> BlogPostModel | None:
        query = BlogPostModel.query.filter(
            (BlogPostModel.slug == identifier) | (BlogPostModel.id == identifier)
        )
        if for_update:
            query = query.with_for_update()
        return query.first()

    def get_by_id_or_slug(self, post_id: str, slug: str, for_update: bool = False) -> BlogPostModel | None:
        query = BlogPostModel.query.filter(
            (BlogPostModel.id == post_id) | (BlogPostModel.slug == slug)
        )
        if for_update:
            query = query.with_for_update()
        return query.first()

    def add(self, post: BlogPostModel) -> BlogPostModel:
        db.session.add(post)
        db.session.flush()
        return post

    def delete(self, post: BlogPostModel) -> None:
        db.session.delete(post)
        db.session.flush()


class InteractionRepository:
    """Single Responsibility (SRP): ACID-safe data access for post interactions and comments."""

    def get_or_create(self, slug: str, for_update: bool = False) -> PostInteractionModel:
        query = PostInteractionModel.query.filter_by(post_slug=slug)
        if for_update:
            query = query.with_for_update()
        inter = query.first()
        if not inter:
            m = BASELINE_METRICS.get(
                slug,
                {"views": 120, "shares": 10, "fire": 12, "smart": 8, "rocket": 10, "shield": 15, "heart": 7},
            )
            inter = PostInteractionModel(
                post_slug=slug,
                views=m["views"],
                shares=m["shares"],
                fire=m["fire"],
                smart=m["smart"],
                rocket=m["rocket"],
                shield=m["shield"],
                heart=m["heart"],
            )
            db.session.add(inter)
            db.session.flush()
        return inter

    def list_comments(self, slug: str) -> list[BlogCommentModel]:
        return (
            BlogCommentModel.query.filter_by(post_slug=slug)
            .order_by(BlogCommentModel.created_at.desc())
            .all()
        )

    def add_comment(self, comment: BlogCommentModel) -> BlogCommentModel:
        db.session.add(comment)
        db.session.flush()
        return comment


class JobRepository(IReadRepository[TechJobModel]):
    """Single Responsibility (SRP): Data access for tech job opportunities."""

    def list_all(self) -> list[TechJobModel]:
        return TechJobModel.query.order_by(
            TechJobModel.featured.desc(), TechJobModel.date_posted.desc()
        ).all()

    def get_by_id(self, identifier: str, for_update: bool = False) -> TechJobModel | None:
        query = TechJobModel.query.filter_by(id=identifier)
        if for_update:
            query = query.with_for_update()
        return query.first()

    def add(self, job: TechJobModel) -> TechJobModel:
        db.session.add(job)
        db.session.flush()
        return job

    def delete(self, job: TechJobModel) -> None:
        db.session.delete(job)
        db.session.flush()


class DiagnosticsRepository:
    """Single Responsibility (SRP): Read-only aggregate telemetry counts."""

    def get_counts(self) -> dict[str, int]:
        return {
            "posts": db.session.query(func.count(BlogPostModel.id)).scalar() or 0,
            "jobs": db.session.query(func.count(TechJobModel.id)).scalar() or 0,
            "comments": db.session.query(func.count(BlogCommentModel.id)).scalar() or 0,
            "socials": db.session.query(func.count(SocialLink.id)).scalar() or 0,
        }

