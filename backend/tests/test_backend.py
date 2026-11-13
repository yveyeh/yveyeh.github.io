import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app, ensure_mysql_database
from core.database import DomainValidationError, EntityNotFoundError, TransactionManager
from models import (
    BlogCommentModel,
    BlogPostModel,
    PostInteractionModel,
    SiteProfile,
    SocialLink,
    TechJobModel,
    db,
    utcnow_iso,
)
from repositories import (
    DiagnosticsRepository,
    IReadRepository,
    InteractionRepository,
    JobRepository,
    PostRepository,
    ProfileRepository,
)
from seed import load_seed_posts, seed_all, seed_jobs, seed_posts


@pytest.fixture()
def app():
    test_app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )
    yield test_app
    with test_app.app_context():
        db.session.remove()
        db.drop_all()
        db.engine.dispose()


@pytest.fixture()
def client(app):
    return app.test_client()


# ── 1. Core Database & ACID Transaction Manager Tests ─────────────────────────
def test_utcnow_iso():
    ts = utcnow_iso()
    assert isinstance(ts, str) and "T" in ts
    with patch("seed.SEED_POSTS_PATH", Path("/nonexistent/seed_posts.json")):
        assert load_seed_posts() == []


def test_iread_repository_abstract_methods():
    class DummyRepo(IReadRepository[str]):
        def list_all(self) -> list[str]:
            return super().list_all()  # type: ignore[safe-super]

        def get_by_id(self, identifier: str, for_update: bool = False) -> str | None:
            return super().get_by_id(identifier, for_update)  # type: ignore[safe-super]

    repo = DummyRepo()
    with pytest.raises(NotImplementedError):
        repo.list_all()
    with pytest.raises(NotImplementedError):
        repo.get_by_id("1")


def test_transaction_manager_atomic_rollback(app):
    """Verify ACID Atomicity: an exception inside TransactionManager.atomic() rolls back all uncommitted writes."""
    with app.app_context():
        initial_count = TechJobModel.query.count()
        with pytest.raises(RuntimeError, match="Simulated failure"):
            with TransactionManager.atomic():
                db.session.add(
                    TechJobModel(
                        id="job-rollback-test",
                        title="Rollback Role",
                        company="ACID Corp",
                        location="Remote",
                        workplace_type="remote",
                        employment_type="full-time",
                        referral_link="https://example.com",
                        description="Should be rolled back",
                        tags=["ACID"],
                    )
                )
                db.session.flush()
                raise RuntimeError("Simulated failure")

        assert TechJobModel.query.count() == initial_count
        assert TechJobModel.query.filter_by(id="job-rollback-test").first() is None


def test_ensure_mysql_database_branches():
    # Non-mysql URL returns immediately
    ensure_mysql_database("sqlite:///:memory:")
    # Malformed mysql URL returns immediately
    ensure_mysql_database("mysql+pymysql://invalid_url")

    # Valid mysql URL executes CREATE DATABASE IF NOT EXISTS
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    with patch("app.pymysql.connect", return_value=mock_conn) as mock_connect:
        ensure_mysql_database("mysql+pymysql://user:pass@127.0.0.1:3306/test_db")
        mock_connect.assert_called_once_with(
            host="127.0.0.1", port=3306, user="user", password="pass"
        )
        mock_cursor.execute.assert_called_once()
        mock_conn.commit.assert_called_once()
        mock_conn.close.assert_called_once()

    # Exception during pymysql.connect is caught gracefully
    with patch("app.pymysql.connect", side_effect=OSError("Connection refused")):
        ensure_mysql_database("mysql+pymysql://user:pass@127.0.0.1:3306/test_db")


# ── 2. Health & Diagnostics Endpoint Tests ────────────────────────────────────
def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "ok"
    assert data["engine"] == "sqlite"
    assert data["counts"]["posts"] >= 8
    assert data["counts"]["jobs"] >= 5
    assert data["counts"]["socials"] >= 9
    assert data["counts"]["comments"] >= 8


# ── 3. Profile & Socials Endpoints & Repository Tests ─────────────────────────
def test_get_and_update_profile(client, app):
    res = client.get("/api/profile")
    assert res.status_code == 200
    bundle = res.get_json()
    assert "profile" in bundle and "socials" in bundle
    assert bundle["profile"]["nickname"] == "Didi"
    assert len(bundle["socials"]) == 9

    # Update profile fields
    update_payload = {
        "name": "Didier Y. Veyeh (Updated)",
        "shortName": "Didier V.",
        "nickname": "DidiOps",
        "title": "Principal DevSecOps Architect",
        "shortTitle": "Principal Architect",
        "email": "didi@secops.io",
        "avatar": "/assets/img/new.jpg",
        "statusBadge": "Consulting Open",
        "bio": "Updated bio text",
        "githubUrl": "https://github.com/yveyeh",
        "gitlabUrl": "https://gitlab.com/yveyeh",
        "bookingUrl": "https://calendar.google.com",
    }
    put_res = client.put("/api/profile", json=update_payload)
    assert put_res.status_code == 200
    updated = put_res.get_json()
    assert updated["nickname"] == "DidiOps"
    assert updated["title"] == "Principal DevSecOps Architect"

    # Socials standalone endpoint
    soc_res = client.get("/api/socials")
    assert soc_res.status_code == 200
    assert len(soc_res.get_json()) == 9

    # Test auto-init when SiteProfile table is empty
    with app.app_context():
        SiteProfile.query.delete()
        db.session.commit()
        repo = ProfileRepository()
        recreated = repo.get_or_init_profile(for_update=False)
        assert recreated.id == 1


# ── 4. Admin Authentication & Rate Limiting Tests ─────────────────────────────
def test_auth_login_verify_logout_and_lockout(client):
    # Invalid token verification
    verify_bad = client.get("/api/auth/verify", headers={"Authorization": "Bearer invalid"})
    assert verify_bad.status_code == 401

    # Valid login
    login_ok = client.post("/api/auth/login", json={"passcode": "didi2026"})
    assert login_ok.status_code == 200
    token = login_ok.get_json()["token"]
    assert token

    # Verify valid token
    verify_ok = client.get("/api/auth/verify", headers={"Authorization": f"Bearer {token}"})
    assert verify_ok.status_code == 200
    assert verify_ok.get_json()["authenticated"] is True

    # Logout invalidates token
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.get_json()["authenticated"] is False

    verify_after = client.get("/api/auth/verify", headers={"Authorization": f"Bearer {token}"})
    assert verify_after.status_code == 401

    # Brute-force rate limiting: 3 failed attempts trigger 429 lockout for 15 minutes (900s)
    for attempt in range(1, 3):
        bad_res = client.post("/api/auth/login", json={"passcode": "wrong-pass"})
        assert bad_res.status_code == 401
        assert bad_res.get_json()["remainingAttempts"] == 3 - attempt

    # 3rd failed attempt locks out for 15 minutes (900 seconds)
    lock_res = client.post("/api/auth/login", json={"passcode": "wrong-pass"})
    assert lock_res.status_code == 429
    assert lock_res.get_json()["lockedOut"] is True
    assert lock_res.get_json()["remainingSeconds"] == 900

    # Subsequent attempt while locked out immediately returns 429
    locked_again = client.post("/api/auth/login", json={"passcode": "didi2026"})
    assert locked_again.status_code == 429
    assert locked_again.get_json()["lockedOut"] is True


# ── 5. Blog Posts CRUD & ACID Service Tests ───────────────────────────────────
def test_blog_posts_crud_and_validation(client):
    # List seeded posts
    list_res = client.get("/api/posts")
    assert list_res.status_code == 200
    posts = list_res.get_json()
    assert len(posts) >= 8

    # Get single post by slug
    single_res = client.get("/api/posts/zero-trust-cicd-pipeline")
    assert single_res.status_code == 200
    assert single_res.get_json()["slug"] == "zero-trust-cicd-pipeline"

    # Get non-existent post -> 404 EntityNotFoundError
    not_found = client.get("/api/posts/non-existent-slug-999")
    assert not_found.status_code == 404

    # Create post validation failure (missing title) -> 400 DomainValidationError
    bad_post = client.post("/api/posts", json={"title": "   "})
    assert bad_post.status_code == 400

    # Create new post (201)
    new_post_payload = {
        "title": "PostgreSQL 16 + MongoDB Hybrid Architecture",
        "summary": "Polyglot persistence in high-throughput Kubernetes meshes.",
        "category": "Architecture",
        "tags": ["PostgreSQL", "MongoDB", "Kubernetes"],
        "featured": True,
        "author": {
            "name": "Didier Yufenyuy Veyeh",
            "title": "DevSecOps Solutions Architect",
            "avatar": "/assets/img/didier-headshot.jpg",
        },
        "content": "# Hybrid Data Plane\nDetailed content with over two hundred words " * 20,
    }
    create_res = client.post("/api/posts", json=new_post_payload)
    assert create_res.status_code == 201
    created_post = create_res.get_json()
    slug = created_post["slug"]
    assert slug == "postgresql-16-mongodb-hybrid-architecture"

    # Upsert existing post via POST /api/posts (200)
    upsert_payload = {
        **new_post_payload,
        "id": created_post["id"],
        "slug": slug,
        "summary": "Updated summary via upsert",
    }
    upsert_res = client.post("/api/posts", json=upsert_payload)
    assert upsert_res.status_code == 200
    assert upsert_res.get_json()["summary"] == "Updated summary via upsert"

    # Update post via PUT /api/posts/<slug>
    put_res = client.put(
        f"/api/posts/{slug}",
        json={
            "title": "PostgreSQL 16 + MongoDB Mesh (Rev 2)",
            "slug": slug,
            "summary": "Rev 2 summary",
            "category": "Cloud Security",
            "tags": ["PostgreSQL", "MongoDB"],
            "date": "2026-11-13",
            "readTime": "6 min read",
            "featured": False,
            "content": "Updated markdown content",
        },
    )
    assert put_res.status_code == 200
    assert put_res.get_json()["title"] == "PostgreSQL 16 + MongoDB Mesh (Rev 2)"

    # Update non-existent post -> 404
    put_404 = client.put("/api/posts/missing-post", json={"title": "No"})
    assert put_404.status_code == 404

    # Delete post via DELETE /api/posts/<slug>
    del_res = client.delete(f"/api/posts/{slug}")
    assert del_res.status_code == 200
    assert del_res.get_json()["deleted"] is True

    # Delete non-existent post -> 404
    del_404 = client.delete(f"/api/posts/{slug}")
    assert del_404.status_code == 404

    # Reset posts via POST /api/posts/reset
    reset_res = client.post("/api/posts/reset")
    assert reset_res.status_code == 200
    assert len(reset_res.get_json()) >= 8


# ── 6. Blog Interactions, Reactions & Comments Endpoints Tests ────────────────
def test_blog_interactions_views_shares_reactions_comments(client):
    slug = "brand-new-article-slug"

    # Auto-creates baseline interaction metrics on first fetch
    inter_res = client.get(f"/api/posts/{slug}/interactions")
    assert inter_res.status_code == 200
    initial = inter_res.get_json()
    assert initial["views"] == 120
    assert initial["shares"] == 10

    # Increment view
    view_res = client.post(f"/api/posts/{slug}/view")
    assert view_res.status_code == 200
    assert view_res.get_json()["views"] == 121

    # Increment share
    share_res = client.post(f"/api/posts/{slug}/share")
    assert share_res.status_code == 200
    assert share_res.get_json()["shares"] == 11

    # React increment & decrement
    fire_inc = client.post(
        f"/api/posts/{slug}/react", json={"type": "fire", "action": "increment"}
    )
    assert fire_inc.status_code == 200
    assert fire_inc.get_json()["reactions"]["fire"] == initial["reactions"]["fire"] + 1

    fire_dec = client.post(
        f"/api/posts/{slug}/react", json={"type": "fire", "action": "decrement"}
    )
    assert fire_dec.status_code == 200
    assert fire_dec.get_json()["reactions"]["fire"] == initial["reactions"]["fire"]

    # Invalid reaction type -> 400
    bad_react = client.post(
        f"/api/posts/{slug}/react", json={"type": "invalid_emoji", "action": "increment"}
    )
    assert bad_react.status_code == 400

    # Add comment validation error -> 400
    bad_comm = client.post(
        f"/api/posts/{slug}/comments", json={"authorName": "", "content": ""}
    )
    assert bad_comm.status_code == 400

    # Add valid comment with handle -> 201
    comm_res = client.post(
        f"/api/posts/{slug}/comments",
        json={
            "authorName": "Sarah Connor",
            "authorHandle": "@sconnor_sec",
            "content": "Great zero-trust patterns!",
        },
    )
    assert comm_res.status_code == 201
    comments = comm_res.get_json()["comments"]
    assert len(comments) == 1
    assert comments[0]["authorName"] == "Sarah Connor"
    assert comments[0]["authorHandle"] == "@sconnor_sec"


# ── 7. Tech Jobs CRUD Endpoints Tests ─────────────────────────────────────────
def test_tech_jobs_crud_and_validation(client):
    # List seeded jobs
    list_res = client.get("/api/jobs")
    assert list_res.status_code == 200
    assert len(list_res.get_json()) >= 5

    # Get single job
    job_res = client.get("/api/jobs/job-lead-devsecops-architect")
    assert job_res.status_code == 200
    assert job_res.get_json()["company"] == "CloudNative Security Corp"

    # Get non-existent job -> 404
    assert client.get("/api/jobs/non-existent-job").status_code == 404

    # Create job validation failure -> 400
    assert client.post("/api/jobs", json={"title": "Only Title"}).status_code == 400

    # Create job with fallback workplace/employment normalization (201)
    create_res = client.post(
        "/api/jobs",
        json={
            "title": "Principal Platform Security Engineer",
            "company": "CyberMesh Inc",
            "location": "Zurich / Remote",
            "workplaceType": "invalid-workplace",
            "employmentType": "invalid-employment",
            "salaryRange": "CHF 180,000 - 210,000",
            "referralLink": "https://example.com/apply",
            "description": "Architect zero-trust Kubernetes platforms.",
            "tags": ["Kubernetes", "eBPF"],
            "featured": True,
        },
    )
    assert create_res.status_code == 201
    created_job = create_res.get_json()
    job_id = created_job["id"]
    assert created_job["workplaceType"] == "remote"
    assert created_job["employmentType"] == "full-time"
    assert created_job["salaryRange"] == "CHF 180,000 - 210,000"

    # Update job via PUT /api/jobs/<id>
    put_res = client.put(
        f"/api/jobs/{job_id}",
        json={
            "title": "VP of Platform Security",
            "company": "CyberMesh Global",
            "location": "Geneva",
            "workplaceType": "hybrid",
            "employmentType": "contract",
            "salaryRange": "",
            "referralLink": "https://example.com/vp",
            "description": "Updated description",
            "tags": ["Executive", "DevSecOps"],
            "featured": False,
        },
    )
    assert put_res.status_code == 200
    updated_job = put_res.get_json()
    assert updated_job["title"] == "VP of Platform Security"
    assert updated_job["workplaceType"] == "hybrid"
    assert updated_job["employmentType"] == "contract"
    assert "salaryRange" not in updated_job

    # Update non-existent job -> 404
    assert client.put("/api/jobs/missing-id", json={"title": "X"}).status_code == 404

    # Delete job via DELETE /api/jobs/<id>
    del_res = client.delete(f"/api/jobs/{job_id}")
    assert del_res.status_code == 200
    assert del_res.get_json()["deleted"] is True

    # Delete non-existent job -> 404
    assert client.delete(f"/api/jobs/{job_id}").status_code == 404

    # Reset jobs via POST /api/jobs/reset
    reset_res = client.post("/api/jobs/reset")
    assert reset_res.status_code == 200
    assert len(reset_res.get_json()) == 5
