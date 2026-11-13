import os
import re
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from core.database import DomainValidationError, EntityNotFoundError
from models import db
from repositories import (
    DiagnosticsRepository,
    InteractionRepository,
    JobRepository,
    PostRepository,
    ProfileRepository,
)
from seed import seed_all
from services import (
    AuthService,
    BlogService,
    DiagnosticsService,
    JobService,
    ProfileService,
)

load_dotenv(Path(__file__).parent / ".env")


def ensure_mysql_database(db_url: str) -> None:
    """Create the MySQL database if it doesn't already exist."""
    if not db_url.startswith("mysql"):
        return
    try:
        m = re.match(r"mysql\+pymysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/([^\?]+)", db_url)
        if not m:
            return
        user, password, host, port_str, dbname = m.groups()
        port = int(port_str or 3306)
        conn = pymysql.connect(host=host, port=port, user=user, password=password)
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"[DB Bootstrap] Notice while ensuring MySQL database exists: {exc}")


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db_url = (
        (test_config or {}).get("SQLALCHEMY_DATABASE_URI")
        or os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://yveyeh:yveyeh_secret_2026@127.0.0.1:3306/yveyeh_portfolio",
        )
    )
    ensure_mysql_database(db_url)

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if db_url.startswith("mysql"):
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "pool_pre_ping": True,
            "pool_recycle": 280,
            "isolation_level": "READ COMMITTED",
        }
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "yveyeh-devsecops-flask-secret-2026")

    if test_config:
        app.config.update(test_config)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_all()

    # Dependency Injection: Repositories -> Services
    profile_service = ProfileService(ProfileRepository())
    blog_service = BlogService(PostRepository(), InteractionRepository())
    job_service = JobService(JobRepository())
    auth_service = AuthService()
    diagnostics_service = DiagnosticsService(DiagnosticsRepository(), db_url)

    # Centralized Domain Exception Handlers
    @app.errorhandler(DomainValidationError)
    def handle_validation_error(err: DomainValidationError):
        return jsonify({"error": str(err)}), 400

    @app.errorhandler(EntityNotFoundError)
    def handle_not_found_error(err: EntityNotFoundError):
        return jsonify({"error": str(err)}), 404

    # ── Health & Diagnostics ──────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return jsonify(diagnostics_service.get_health())

    # ── Profile & Socials Endpoints ───────────────────────────────────
    @app.get("/api/profile")
    def get_profile():
        return jsonify(profile_service.get_profile_bundle())

    @app.put("/api/profile")
    def update_profile():
        payload = request.get_json(force=True) or {}
        return jsonify(profile_service.update_profile(payload))

    @app.get("/api/socials")
    def get_socials():
        return jsonify(profile_service.list_socials())

    # ── Admin Auth Endpoints ──────────────────────────────────────────
    @app.post("/api/auth/login")
    def admin_login():
        client_ip = request.remote_addr or "local"
        data = request.get_json(force=True) or {}
        passcode = str(data.get("passcode", ""))
        body, status = auth_service.login(client_ip, passcode)
        return jsonify(body), status

    @app.get("/api/auth/verify")
    def verify_token():
        token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        if auth_service.verify(token):
            return jsonify({"authenticated": True})
        return jsonify({"authenticated": False}), 401

    @app.post("/api/auth/logout")
    def admin_logout():
        token = request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        auth_service.logout(token)
        return jsonify({"authenticated": False})

    # ── Blog Posts CRUD Endpoints ─────────────────────────────────────
    @app.get("/api/posts")
    def list_posts():
        return jsonify(blog_service.list_posts())

    @app.get("/api/posts/<slug_or_id>")
    def get_post(slug_or_id: str):
        return jsonify(blog_service.get_post(slug_or_id))

    @app.post("/api/posts")
    def create_or_save_post():
        data = request.get_json(force=True) or {}
        saved, created = blog_service.save_post(data)
        return jsonify(saved), (201 if created else 200)

    @app.put("/api/posts/<id_or_slug>")
    def update_post(id_or_slug: str):
        data = request.get_json(force=True) or {}
        return jsonify(blog_service.update_post(id_or_slug, data))

    @app.delete("/api/posts/<id_or_slug>")
    def delete_post(id_or_slug: str):
        blog_service.delete_post(id_or_slug)
        return jsonify({"deleted": True, "id": id_or_slug})

    @app.post("/api/posts/reset")
    def reset_posts_endpoint():
        return jsonify(blog_service.reset_posts())

    # ── Blog Post Interactions & Comments Endpoints ───────────────────
    @app.get("/api/posts/<slug>/interactions")
    def get_interactions(slug: str):
        return jsonify(blog_service.get_interactions(slug))

    @app.post("/api/posts/<slug>/view")
    def increment_view(slug: str):
        return jsonify(blog_service.increment_view(slug))

    @app.post("/api/posts/<slug>/share")
    def increment_share(slug: str):
        return jsonify(blog_service.increment_share(slug))

    @app.post("/api/posts/<slug>/react")
    def react_to_post(slug: str):
        data = request.get_json(force=True) or {}
        return jsonify(
            blog_service.toggle_reaction(
                slug,
                str(data.get("type", "")),
                str(data.get("action", "increment")),
            )
        )

    @app.post("/api/posts/<slug>/comments")
    def add_post_comment(slug: str):
        data = request.get_json(force=True) or {}
        return jsonify(blog_service.add_comment(slug, data)), 201

    # ── Tech Jobs CRUD Endpoints ──────────────────────────────────────
    @app.get("/api/jobs")
    def list_jobs():
        return jsonify(job_service.list_jobs())

    @app.get("/api/jobs/<job_id>")
    def get_job(job_id: str):
        return jsonify(job_service.get_job(job_id))

    @app.post("/api/jobs")
    def create_job():
        data = request.get_json(force=True) or {}
        return jsonify(job_service.create_job(data)), 201

    @app.put("/api/jobs/<job_id>")
    def update_job(job_id: str):
        data = request.get_json(force=True) or {}
        return jsonify(job_service.update_job(job_id, data))

    @app.delete("/api/jobs/<job_id>")
    def delete_job(job_id: str):
        job_service.delete_job(job_id)
        return jsonify({"deleted": True, "id": job_id})

    @app.post("/api/jobs/reset")
    def reset_jobs_endpoint():
        return jsonify(job_service.reset_jobs())

    return app


if __name__ == "__main__":  # pragma: no cover
    app = create_app()
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host=host, port=port, debug=debug)
