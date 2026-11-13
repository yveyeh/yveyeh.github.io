import hashlib
import os
import re
import secrets
import time
from datetime import datetime, timezone
from core.database import DomainValidationError, EntityNotFoundError, TransactionManager
from models import BlogCommentModel, BlogPostModel, PostInteractionModel, TechJobModel
from repositories import (
    DiagnosticsRepository,
    InteractionRepository,
    JobRepository,
    PostRepository,
    ProfileRepository,
)
from seed import seed_jobs, seed_posts

AVATAR_COLORS = (
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-cyan-600",
)

VALID_REACTIONS = frozenset({"fire", "smart", "rocket", "shield", "heart"})
VALID_WORKPLACES = frozenset({"remote", "hybrid", "in-office"})
VALID_EMPLOYMENTS = frozenset({"full-time", "part-time", "contract"})


class AuthService:
    """
    Encapsulates SHA-256 passcode verification, session lifecycle, and brute-force rate limiting.
    """

    SESSION_TIMEOUT_SEC = 30 * 60
    MAX_FAILED_ATTEMPTS = 3
    LOCKOUT_DURATION_SEC = 15 * 60

    def __init__(self) -> None:
        self._active_tokens: dict[str, float] = {}
        self._failed_attempts: dict[str, dict] = {}

    def login(self, client_ip: str, passcode: str) -> tuple[dict, int]:
        now = time.time()
        state = self._failed_attempts.get(client_ip, {"count": 0, "lockout_until": 0.0})

        if state["lockout_until"] > now:
            remaining = int(state["lockout_until"] - now)
            return (
                {
                    "authenticated": False,
                    "lockedOut": True,
                    "remainingSeconds": remaining,
                    "error": f"Too many attempts. Try again in {remaining}s.",
                },
                429,
            )

        expected = os.getenv("ADMIN_PASSCODE", "didi2026")
        given_hash = hashlib.sha256(passcode.encode("utf-8")).hexdigest()
        expected_hash = hashlib.sha256(expected.encode("utf-8")).hexdigest()

        if secrets.compare_digest(given_hash, expected_hash):
            self._failed_attempts.pop(client_ip, None)
            token = secrets.token_urlsafe(32)
            self._active_tokens[token] = now + self.SESSION_TIMEOUT_SEC
            return (
                {
                    "authenticated": True,
                    "token": token,
                    "expiresIn": self.SESSION_TIMEOUT_SEC,
                },
                200,
            )

        state["count"] += 1
        if state["count"] >= self.MAX_FAILED_ATTEMPTS:
            state["lockout_until"] = now + self.LOCKOUT_DURATION_SEC
            self._failed_attempts[client_ip] = state
            return (
                {
                    "authenticated": False,
                    "lockedOut": True,
                    "remainingSeconds": self.LOCKOUT_DURATION_SEC,
                    "error": "Too many failed attempts. Account temporarily locked for 15 minutes.",
                },
                429,
            )

        self._failed_attempts[client_ip] = state
        remaining_attempts = self.MAX_FAILED_ATTEMPTS - state["count"]
        return (
            {
                "authenticated": False,
                "lockedOut": False,
                "remainingAttempts": remaining_attempts,
                "error": f"Invalid passcode. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining.",
            },
            401,
        )

    def verify(self, token: str) -> bool:
        now = time.time()
        expiry = self._active_tokens.get(token)
        return bool(expiry and expiry > now)

    def logout(self, token: str) -> None:
        self._active_tokens.pop(token, None)


class ProfileService:
    """Domain service for site profile & social handles with ACID transactional updates."""

    def __init__(self, repo: ProfileRepository) -> None:
        self._repo = repo

    def get_profile_bundle(self) -> dict:
        with TransactionManager.atomic():
            profile = self._repo.get_or_init_profile(for_update=False)
            socials = self._repo.list_socials()
            return {
                "profile": profile.to_dict(),
                "socials": [s.to_dict() for s in socials],
            }

    def update_profile(self, payload: dict) -> dict:
        with TransactionManager.atomic():
            profile = self._repo.get_or_init_profile(for_update=True)
            field_map = (
                ("name", "name"),
                ("shortName", "short_name"),
                ("nickname", "nickname"),
                ("title", "title"),
                ("shortTitle", "short_title"),
                ("email", "email"),
                ("avatar", "avatar"),
                ("statusBadge", "status_badge"),
                ("bio", "bio"),
                ("githubUrl", "github_url"),
                ("gitlabUrl", "gitlab_url"),
                ("bookingUrl", "booking_url"),
            )
            for json_key, attr in field_map:
                if json_key in payload and payload[json_key] is not None:
                    setattr(profile, attr, str(payload[json_key]))
            return profile.to_dict()

    def list_socials(self) -> list[dict]:
        return [s.to_dict() for s in self._repo.list_socials()]


class BlogService:
    """
    Domain service for Blog Posts and Interactions enforcing ACID properties:
    - Multi-table writes (BlogPostModel + PostInteractionModel) execute inside a single atomic transaction.
    - Counter updates (views, shares, reactions) use row-level locking (`SELECT ... FOR UPDATE`) to prevent lost updates.
    """

    def __init__(
        self,
        post_repo: PostRepository,
        interaction_repo: InteractionRepository,
    ) -> None:
        self._posts = post_repo
        self._interactions = interaction_repo

    def list_posts(self) -> list[dict]:
        return [p.to_dict() for p in self._posts.list_all()]

    def get_post(self, slug_or_id: str) -> dict:
        post = self._posts.get_by_id(slug_or_id)
        if not post:
            raise EntityNotFoundError("Article not found")
        return post.to_dict()

    def save_post(self, data: dict) -> tuple[dict, bool]:
        title = (data.get("title") or "").strip()
        if not title:
            raise DomainValidationError("Article title is required")

        raw_slug = (data.get("slug") or "").strip()
        slug = raw_slug or re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", title.lower()))
        post_id = (data.get("id") or "").strip() or slug or f"post-{int(time.time() * 1000)}"
        content = data.get("content") or ""
        word_count = len(content.split())
        default_read_time = f"{max(1, round(word_count / 200))} min read"
        author = data.get("author") or {}
        tags = data.get("tags") if isinstance(data.get("tags"), list) else []

        with TransactionManager.atomic():
            existing = self._posts.get_by_id_or_slug(post_id, slug, for_update=True)
            if existing:
                existing.title = title
                existing.slug = slug
                existing.summary = data.get("summary") or ""
                existing.category = data.get("category") or "DevSecOps"
                existing.tags = tags
                existing.date = data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
                existing.read_time = data.get("readTime") or default_read_time
                existing.featured = bool(data.get("featured", False))
                existing.content = content
                if author.get("name"):
                    existing.author_name = author["name"]
                if author.get("title"):
                    existing.author_title = author["title"]
                if author.get("avatar"):
                    existing.author_avatar = author["avatar"]

                self._interactions.get_or_create(existing.slug, for_update=False)
                return existing.to_dict(), False

            new_post = BlogPostModel(
                id=post_id,
                slug=slug,
                title=title,
                summary=data.get("summary") or "",
                category=data.get("category") or "DevSecOps",
                tags=tags,
                date=data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                read_time=data.get("readTime") or default_read_time,
                featured=bool(data.get("featured", False)),
                author_name=author.get("name", "Didier Yufenyuy Veyeh"),
                author_title=author.get("title", "DevSecOps Solutions Architect"),
                author_avatar=author.get("avatar", "/assets/img/didier-headshot.jpg"),
                content=content,
            )
            self._posts.add(new_post)
            self._interactions.get_or_create(new_post.slug, for_update=False)
            return new_post.to_dict(), True

    def update_post(self, id_or_slug: str, data: dict) -> dict:
        with TransactionManager.atomic():
            post = self._posts.get_by_id(id_or_slug, for_update=True)
            if not post:
                raise EntityNotFoundError("Post not found")

            if "title" in data and data["title"]:
                post.title = data["title"].strip()
            if "slug" in data and data["slug"]:
                post.slug = data["slug"].strip()
            if "summary" in data:
                post.summary = data["summary"] or ""
            if "category" in data and data["category"]:
                post.category = data["category"]
            if "tags" in data and isinstance(data["tags"], list):
                post.tags = data["tags"]
            if "date" in data and data["date"]:
                post.date = data["date"]
            if "readTime" in data and data["readTime"]:
                post.read_time = data["readTime"]
            if "featured" in data:
                post.featured = bool(data["featured"])
            if "content" in data:
                post.content = data["content"] or ""
            return post.to_dict()

    def delete_post(self, id_or_slug: str) -> None:
        with TransactionManager.atomic():
            post = self._posts.get_by_id(id_or_slug, for_update=True)
            if not post:
                raise EntityNotFoundError("Post not found")
            self._posts.delete(post)

    def reset_posts(self) -> list[dict]:
        seed_posts(force_reset=True)
        return self.list_posts()

    def get_interactions(self, slug: str) -> dict:
        with TransactionManager.atomic():
            inter = self._interactions.get_or_create(slug, for_update=False)
            comments = [c.to_dict() for c in self._interactions.list_comments(slug)]
            return inter.to_dict(comments)

    def increment_view(self, slug: str) -> dict:
        with TransactionManager.atomic():
            inter = self._interactions.get_or_create(slug, for_update=True)
            inter.views = PostInteractionModel.views + 1
            # Flush and refresh to read the exact database-evaluated counter
        return self.get_interactions(slug)

    def increment_share(self, slug: str) -> dict:
        with TransactionManager.atomic():
            inter = self._interactions.get_or_create(slug, for_update=True)
            inter.shares = PostInteractionModel.shares + 1
        return self.get_interactions(slug)

    def toggle_reaction(self, slug: str, reaction_type: str, action: str) -> dict:
        if reaction_type not in VALID_REACTIONS:
            raise DomainValidationError("Invalid reaction type")

        with TransactionManager.atomic():
            inter = self._interactions.get_or_create(slug, for_update=True)
            current_val = getattr(inter, reaction_type, 0)
            if action == "decrement":
                setattr(inter, reaction_type, max(0, current_val - 1))
            else:
                setattr(inter, reaction_type, current_val + 1)
            comments = [c.to_dict() for c in self._interactions.list_comments(slug)]
            return inter.to_dict(comments)

    def add_comment(self, slug: str, data: dict) -> dict:
        author_name = (data.get("authorName") or "").strip()
        content = (data.get("content") or "").strip()
        author_handle = (data.get("authorHandle") or "").strip() or None

        if not author_name or not content:
            raise DomainValidationError("Author name and comment content are required")

        with TransactionManager.atomic():
            color_idx = int(time.time() * 1000) % len(AVATAR_COLORS)
            comment = BlogCommentModel(
                id=f"comm-{int(time.time() * 1000)}-{secrets.token_hex(2)}",
                post_slug=slug,
                author_name=author_name,
                author_handle=author_handle,
                content=content,
                created_at=datetime.now(timezone.utc).isoformat(),
                avatar_color=AVATAR_COLORS[color_idx],
            )
            self._interactions.add_comment(comment)
            inter = self._interactions.get_or_create(slug, for_update=False)
            comments = [c.to_dict() for c in self._interactions.list_comments(slug)]
            return inter.to_dict(comments)


class JobService:
    """Domain service for Tech Job Opportunities with ACID validation & locking."""

    def __init__(self, job_repo: JobRepository) -> None:
        self._jobs = job_repo

    def list_jobs(self) -> list[dict]:
        return [j.to_dict() for j in self._jobs.list_all()]

    def get_job(self, job_id: str) -> dict:
        job = self._jobs.get_by_id(job_id)
        if not job:
            raise EntityNotFoundError("Job opportunity not found")
        return job.to_dict()

    def create_job(self, data: dict) -> dict:
        title = (data.get("title") or "").strip()
        company = (data.get("company") or "").strip()
        referral_link = (data.get("referralLink") or "").strip()
        if not title or not company or not referral_link:
            raise DomainValidationError("Title, company, and referralLink are required")

        workplace = data.get("workplaceType") or "remote"
        if workplace not in VALID_WORKPLACES:
            workplace = "remote"

        employment = data.get("employmentType") or "full-time"
        if employment not in VALID_EMPLOYMENTS:
            employment = "full-time"

        job_id = (data.get("id") or "").strip() or f"job-{int(time.time() * 1000)}-{secrets.token_hex(2)}"

        with TransactionManager.atomic():
            new_job = TechJobModel(
                id=job_id,
                title=title,
                company=company,
                location=(data.get("location") or "Remote").strip(),
                workplace_type=workplace,
                employment_type=employment,
                salary_range=(data.get("salaryRange") or "").strip() or None,
                referral_link=referral_link,
                description=(data.get("description") or "").strip(),
                tags=data.get("tags") if isinstance(data.get("tags"), list) else [],
                date_posted=data.get("datePosted") or datetime.now(timezone.utc).isoformat(),
                featured=bool(data.get("featured", False)),
            )
            self._jobs.add(new_job)
            return new_job.to_dict()

    def update_job(self, job_id: str, data: dict) -> dict:
        with TransactionManager.atomic():
            job = self._jobs.get_by_id(job_id, for_update=True)
            if not job:
                raise EntityNotFoundError("Job not found")

            if "title" in data and data["title"]:
                job.title = data["title"].strip()
            if "company" in data and data["company"]:
                job.company = data["company"].strip()
            if "location" in data:
                job.location = (data["location"] or "Remote").strip()
            if "workplaceType" in data and data["workplaceType"] in VALID_WORKPLACES:
                job.workplace_type = data["workplaceType"]
            if "employmentType" in data and data["employmentType"] in VALID_EMPLOYMENTS:
                job.employment_type = data["employmentType"]
            if "salaryRange" in data:
                job.salary_range = (data["salaryRange"] or "").strip() or None
            if "referralLink" in data and data["referralLink"]:
                job.referral_link = data["referralLink"].strip()
            if "description" in data:
                job.description = (data["description"] or "").strip()
            if "tags" in data and isinstance(data["tags"], list):
                job.tags = data["tags"]
            if "featured" in data:
                job.featured = bool(data["featured"])

            return job.to_dict()

    def delete_job(self, job_id: str) -> None:
        with TransactionManager.atomic():
            job = self._jobs.get_by_id(job_id, for_update=True)
            if not job:
                raise EntityNotFoundError("Job not found")
            self._jobs.delete(job)

    def reset_jobs(self) -> list[dict]:
        seed_jobs(force_reset=True)
        return self.list_jobs()


class DiagnosticsService:
    """Provides system health and row-count diagnostics."""

    def __init__(self, repo: DiagnosticsRepository, db_url: str) -> None:
        self._repo = repo
        self._db_url = db_url

    def get_health(self) -> dict:
        return {
            "status": "ok",
            "engine": "mysql" if "mysql" in self._db_url else "sqlite",
            "database": self._db_url.rsplit("/", 1)[-1],
            "counts": self._repo.get_counts(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

