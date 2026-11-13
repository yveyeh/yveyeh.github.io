from datetime import datetime, timedelta, timezone
from pathlib import Path
import json
from core.database import TransactionManager
from models import (
    db,
    SiteProfile,
    SocialLink,
    BlogPostModel,
    PostInteractionModel,
    BlogCommentModel,
    TechJobModel,
)

SEED_POSTS_PATH = Path(__file__).parent / "seed_posts.json"

INITIAL_SOCIALS = [
    {"id": "github", "label": "GitHub", "href": "https://github.com/yveyeh", "bg": "bg-neutral-900", "sort_order": 1},
    {"id": "gitlab", "label": "GitLab", "href": "https://gitlab.com/yveyeh", "bg": "bg-[#fc6d26]", "sort_order": 2},
    {
        "id": "linkedin",
        "label": "LinkedIn",
        "href": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "bg": "bg-[#0a66c2]",
        "sort_order": 3,
    },
    {"id": "reddit", "label": "Reddit", "href": "#", "bg": "bg-[#ff4500]", "sort_order": 4},
    {"id": "twitter", "label": "X / Twitter", "href": "https://twitter.com/yveyeh1", "bg": "bg-black", "sort_order": 5},
    {"id": "youtube", "label": "YouTube", "href": "#", "bg": "bg-[#ff0000]", "sort_order": 6},
    {
        "id": "instagram",
        "label": "Instagram",
        "href": "https://www.instagram.com/yveyeh/",
        "bg": "bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]",
        "sort_order": 7,
    },
    {"id": "pinterest", "label": "Pinterest", "href": "#", "bg": "bg-[#ff0000]", "sort_order": 8},
    {
        "id": "whatsapp",
        "label": "WhatsApp",
        "href": "https://wa.me/00237675007995/?text=Hello Didi...",
        "bg": "bg-[#25d366]",
        "sort_order": 9,
    },
]

INITIAL_JOBS = [
    {
        "id": "job-lead-devsecops-architect",
        "title": "Lead DevSecOps Architect",
        "company": "CloudNative Security Corp",
        "location": "Remote (Global / EMEA)",
        "workplace_type": "remote",
        "employment_type": "full-time",
        "salary_range": "$165,000 - $210,000 USD",
        "referral_link": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "description": "Spearhead zero-trust cloud infrastructure, automated supply-chain verification (Cosign/Sigstore), ephemeral OIDC credentials, and GitOps policy enforcement across multi-tenant Kubernetes clusters.",
        "tags": ["DevSecOps", "Kubernetes", "Cosign", "Kyverno", "Terraform", "AWS"],
        "date_posted": "2026-10-24T10:00:00.000Z",
        "featured": True,
    },
    {
        "id": "job-senior-cloud-platform-engineer",
        "title": "Senior Cloud Platform Engineer",
        "company": "FinTech Velocity",
        "location": "London, UK (Hybrid - 1 day/wk)",
        "workplace_type": "hybrid",
        "employment_type": "full-time",
        "salary_range": "£95,000 - £125,000 GBP",
        "referral_link": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "description": "Design and operate high-throughput OpenTofu infrastructure, HashiCorp Vault operator secrets pipelines, and automated blue/green delivery mechanisms for distributed banking microservices.",
        "tags": ["Terraform", "OpenTofu", "Vault", "Kubernetes", "GCP", "Golang"],
        "date_posted": "2026-10-22T08:30:00.000Z",
        "featured": True,
    },
    {
        "id": "job-staff-sre-observability",
        "title": "Staff Site Reliability Engineer (Observability)",
        "company": "DataStream Global",
        "location": "Berlin / Amsterdam / Remote",
        "workplace_type": "remote",
        "employment_type": "full-time",
        "salary_range": "€110,000 - €140,000 EUR",
        "referral_link": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "description": "Own enterprise SLIs/SLOs, OpenTelemetry distributed tracing, Prometheus federation, and chaos engineering practices for a multi-region stream processing platform.",
        "tags": ["SRE", "OpenTelemetry", "Prometheus", "Grafana", "Kafka", "eBPF"],
        "date_posted": "2026-10-20T14:15:00.000Z",
        "featured": False,
    },
    {
        "id": "job-kubernetes-security-specialist-contract",
        "title": "Kubernetes & Hardening Specialist",
        "company": "Apex Threat Defense",
        "location": "Remote (US / Canada / LatAm)",
        "workplace_type": "remote",
        "employment_type": "contract",
        "salary_range": "$90 - $125 / hour",
        "referral_link": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "description": "Conduct CIS benchmark cluster hardening, implement eBPF runtime security with Cilium and Falco, and eliminate privileged container runtimes for enterprise clients.",
        "tags": ["Kubernetes", "Cilium", "Falco", "eBPF", "Trivy", "Security Audits"],
        "date_posted": "2026-10-18T11:45:00.000Z",
        "featured": False,
    },
    {
        "id": "job-cloud-infrastructure-lead",
        "title": "Cloud Infrastructure & Automation Lead",
        "company": "ScaleX Digital Labs",
        "location": "Paris, France (In-office / Hybrid)",
        "workplace_type": "in-office",
        "employment_type": "full-time",
        "salary_range": "€85,000 - €110,000 EUR",
        "referral_link": "https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/",
        "description": "Lead a team of 6 engineers automating multi-cloud Landing Zones, cost optimization policies, and self-service internal developer platforms (IDP) using Backstage and Crossplane.",
        "tags": ["Crossplane", "Backstage", "AWS", "Azure", "Docker", "CI/CD"],
        "date_posted": "2026-10-15T09:00:00.000Z",
        "featured": False,
    },
]

BASELINE_METRICS = {
    "introduction-to-docker-guide": {
        "views": 342,
        "shares": 28,
        "fire": 42,
        "smart": 35,
        "rocket": 29,
        "shield": 38,
        "heart": 19,
    },
    "zero-trust-cicd-pipeline": {
        "views": 512,
        "shares": 44,
        "fire": 63,
        "smart": 48,
        "rocket": 31,
        "shield": 72,
        "heart": 27,
    },
    "terraform-opentofu-multi-cloud": {
        "views": 289,
        "shares": 19,
        "fire": 27,
        "smart": 39,
        "rocket": 22,
        "shield": 34,
        "heart": 15,
    },
    "kubernetes-secrets-vault-operator": {
        "views": 405,
        "shares": 32,
        "fire": 45,
        "smart": 51,
        "rocket": 28,
        "shield": 61,
        "heart": 23,
    },
}


def load_seed_posts() -> list[dict]:
    if SEED_POSTS_PATH.exists():
        return json.loads(SEED_POSTS_PATH.read_text(encoding="utf-8"))
    return []


def seed_posts(force_reset: bool = False) -> None:
    with TransactionManager.atomic():
        if force_reset:
            BlogPostModel.query.delete()
            db.session.flush()

        if BlogPostModel.query.count() == 0:
            posts_data = load_seed_posts()
            two_days_ago = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()

            for post in posts_data:
                author = post.get("author") or {}
                slug = post["slug"]
                post_row = BlogPostModel(
                    id=post["id"],
                    slug=slug,
                    title=post["title"],
                    summary=post.get("summary", ""),
                    category=post.get("category", "DevSecOps"),
                    tags=post.get("tags", []),
                    date=post.get("date", "2026-10-15"),
                    read_time=post.get("readTime", "5 min read"),
                    featured=bool(post.get("featured", False)),
                    author_name=author.get("name", "Didier Yufenyuy Veyeh"),
                    author_title=author.get("title", "DevSecOps Solutions Architect"),
                    author_avatar=author.get("avatar", "/assets/img/didier-headshot.jpg"),
                    content=post.get("content", ""),
                )
                db.session.add(post_row)

                if not db.session.get(PostInteractionModel, slug):
                    m = BASELINE_METRICS.get(
                        slug,
                        {"views": 185, "shares": 14, "fire": 24, "smart": 19, "rocket": 15, "shield": 28, "heart": 11},
                    )
                    db.session.add(
                        PostInteractionModel(
                            post_slug=slug,
                            views=m["views"],
                            shares=m["shares"],
                            fire=m["fire"],
                            smart=m["smart"],
                            rocket=m["rocket"],
                            shield=m["shield"],
                            heart=m["heart"],
                        )
                    )

                if BlogCommentModel.query.filter_by(post_slug=slug).count() == 0:
                    db.session.add(
                        BlogCommentModel(
                            id=f"comm-seed-{slug}",
                            post_slug=slug,
                            author_name="Alex Rivera",
                            author_handle="@arivera_sec",
                            content="The real-world architectural blueprints make this crystal clear. Sharing with our platform engineering team right away!",
                            created_at=two_days_ago,
                            avatar_color="bg-emerald-600",
                        )
                    )


def seed_jobs(force_reset: bool = False) -> None:
    with TransactionManager.atomic():
        if force_reset:
            TechJobModel.query.delete()
            db.session.flush()

        if TechJobModel.query.count() == 0:
            for job in INITIAL_JOBS:
                db.session.add(TechJobModel(**job))


def seed_all() -> None:
    with TransactionManager.atomic():
        if SiteProfile.query.count() == 0:
            db.session.add(SiteProfile(id=1))

        if SocialLink.query.count() == 0:
            for s in INITIAL_SOCIALS:
                db.session.add(SocialLink(**s))

    seed_posts(force_reset=False)
    seed_jobs(force_reset=False)

