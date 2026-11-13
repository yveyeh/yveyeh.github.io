from datetime import datetime, timezone
from typing import Any
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseEntity(db.Model):  # type: ignore[name-defined]
    """Abstract base entity enforcing InnoDB ACID engine and UTF-8 charset."""

    __abstract__ = True
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci",
    }
    query: Any

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)


class SiteProfile(BaseEntity):
    __tablename__ = "site_profile"

    id = db.Column(db.Integer, primary_key=True, default=1)
    name = db.Column(db.String(120), nullable=False, default="Didier Yufenyuy Veyeh")
    short_name = db.Column(db.String(80), nullable=False, default="Didier Y. Veyeh")
    nickname = db.Column(db.String(60), nullable=False, default="Didi")
    title = db.Column(db.String(150), nullable=False, default="DevSecOps Solutions Architect")
    short_title = db.Column(db.String(100), nullable=False, default="DevSecOps Architect")
    email = db.Column(db.String(150), nullable=False, default="didi@yveyeh.dev")
    avatar = db.Column(db.String(255), nullable=False, default="/assets/img/didier-headshot.jpg")
    status_badge = db.Column(db.String(120), nullable=False, default="Available for Projects")
    bio = db.Column(
        db.Text,
        nullable=False,
        default=(
            "Welcome to my digital space. I am a DevSecOps Solutions Architect dedicated to "
            "engineering secure-by-design cloud infrastructure, automated CI/CD security pipelines, "
            "and resilient software systems. Explore my open-source projects, architecture blueprints, "
            "and technical publications."
        ),
    )
    github_url = db.Column(db.String(255), nullable=False, default="https://github.com/yveyeh?tab=repositories")
    gitlab_url = db.Column(db.String(255), nullable=False, default="https://gitlab.com/yveyeh")
    booking_url = db.Column(db.String(255), nullable=False, default="https://calendar.app.google/aG7cdAD42dc22dcq7")

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "shortName": self.short_name,
            "nickname": self.nickname,
            "title": self.title,
            "shortTitle": self.short_title,
            "email": self.email,
            "avatar": self.avatar,
            "statusBadge": self.status_badge,
            "bio": self.bio,
            "githubUrl": self.github_url,
            "gitlabUrl": self.gitlab_url,
            "bookingUrl": self.booking_url,
        }


class SocialLink(BaseEntity):
    __tablename__ = "social_links"

    id = db.Column(db.String(50), primary_key=True)
    label = db.Column(db.String(80), nullable=False)
    href = db.Column(db.String(255), nullable=False)
    bg = db.Column(db.String(160), nullable=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "label": self.label,
            "href": self.href,
            "bg": self.bg,
            "sortOrder": self.sort_order,
        }


class BlogPostModel(BaseEntity):
    __tablename__ = "blog_posts"

    id = db.Column(db.String(120), primary_key=True)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=False, default="")
    category = db.Column(db.String(100), nullable=False, default="DevSecOps")
    tags = db.Column(db.JSON, nullable=False, default=list)
    date = db.Column(db.String(32), nullable=False)
    read_time = db.Column(db.String(40), nullable=False, default="5 min read")
    featured = db.Column(db.Boolean, nullable=False, default=False)
    author_name = db.Column(db.String(120), nullable=False, default="Didier Yufenyuy Veyeh")
    author_title = db.Column(db.String(150), nullable=False, default="DevSecOps Solutions Architect")
    author_avatar = db.Column(db.String(255), nullable=False, default="/assets/img/didier-headshot.jpg")
    content = db.Column(db.Text(length=16777215), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "summary": self.summary,
            "category": self.category,
            "tags": self.tags if isinstance(self.tags, list) else [],
            "date": self.date,
            "readTime": self.read_time,
            "featured": bool(self.featured),
            "author": {
                "name": self.author_name,
                "title": self.author_title,
                "avatar": self.author_avatar,
            },
            "content": self.content,
        }


class PostInteractionModel(BaseEntity):
    __tablename__ = "post_interactions"

    post_slug = db.Column(db.String(150), primary_key=True)
    views = db.Column(db.Integer, nullable=False, default=0)
    shares = db.Column(db.Integer, nullable=False, default=0)
    fire = db.Column(db.Integer, nullable=False, default=0)
    smart = db.Column(db.Integer, nullable=False, default=0)
    rocket = db.Column(db.Integer, nullable=False, default=0)
    shield = db.Column(db.Integer, nullable=False, default=0)
    heart = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self, comments: list[dict] | None = None) -> dict:
        return {
            "views": self.views,
            "shares": self.shares,
            "reactions": {
                "fire": self.fire,
                "smart": self.smart,
                "rocket": self.rocket,
                "shield": self.shield,
                "heart": self.heart,
            },
            "comments": comments if comments is not None else [],
        }


class BlogCommentModel(BaseEntity):
    __tablename__ = "blog_comments"

    id = db.Column(db.String(80), primary_key=True)
    post_slug = db.Column(db.String(150), nullable=False, index=True)
    author_name = db.Column(db.String(120), nullable=False)
    author_handle = db.Column(db.String(120), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.String(64), nullable=False, default=utcnow_iso)
    avatar_color = db.Column(db.String(60), nullable=False, default="bg-emerald-600")

    def to_dict(self) -> dict:
        result = {
            "id": self.id,
            "authorName": self.author_name,
            "content": self.content,
            "createdAt": self.created_at,
            "avatarColor": self.avatar_color,
        }
        if self.author_handle:
            result["authorHandle"] = self.author_handle
        return result


class TechJobModel(BaseEntity):
    __tablename__ = "tech_jobs"

    id = db.Column(db.String(120), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(160), nullable=False)
    location = db.Column(db.String(160), nullable=False, default="Remote")
    workplace_type = db.Column(db.String(32), nullable=False, default="remote")
    employment_type = db.Column(db.String(32), nullable=False, default="full-time")
    salary_range = db.Column(db.String(120), nullable=True)
    referral_link = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=False)
    tags = db.Column(db.JSON, nullable=False, default=list)
    date_posted = db.Column(db.String(64), nullable=False, default=utcnow_iso)
    featured = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        data = {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "workplaceType": self.workplace_type,
            "employmentType": self.employment_type,
            "referralLink": self.referral_link,
            "description": self.description,
            "tags": self.tags if isinstance(self.tags, list) else [],
            "datePosted": self.date_posted,
            "featured": bool(self.featured),
        }
        if self.salary_range:
            data["salaryRange"] = self.salary_range
        return data
