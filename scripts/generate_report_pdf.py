from pathlib import Path


def pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class LightPDFBuilder:
    def __init__(self):
        self.pages = []
        self.current = []
        self.y = 770
        self.page_width = 595.28
        self.page_height = 841.89
        self.margin = 48

    def new_page(self):
        if self.current:
            self.pages.append("\n".join(self.current))
        self.current = []
        self.current.append("0.96 0.97 0.99 rg 0 792 595.28 50 re f")
        self.current.append("0.0 0.10 0.24 rg 48 792 499.28 2 re f")
        self.current.append(
            "BT /F2 9 Tf 0.35 0.42 0.52 rg 48 812 Td "
            "(DIDIER Y. VEYEH  |  COMPLETE CUMULATIVE ARCHITECTURE & IMPLEMENTATION REPORT) Tj ET"
        )
        self.y = 755

    def ensure_space(self, needed: float):
        if self.y - needed < 56:
            self.new_page()

    def title_banner(self, title: str, subtitle: str, date_str: str):
        self.ensure_space(80)
        box_y = self.y - 62
        self.current.append(f"0.95 0.97 1.0 rg 48 {box_y:.1f} 499.28 68 re f")
        self.current.append(f"0.0 0.18 0.40 rg 48 {box_y:.1f} 4 68 re f")
        self.current.append(
            f"BT /F2 16.0 Tf 0.0 0.10 0.24 rg 62 {self.y - 20:.1f} Td ({pdf_escape(title)}) Tj ET"
        )
        self.current.append(
            f"BT /F1 9.5 Tf 0.25 0.32 0.42 rg 62 {self.y - 38:.1f} Td ({pdf_escape(subtitle)}) Tj ET"
        )
        self.current.append(
            f"BT /F1 8.5 Tf 0.40 0.46 0.55 rg 62 {self.y - 53:.1f} Td ({pdf_escape(date_str)}) Tj ET"
        )
        self.y -= 82

    def section_heading(self, num: str, heading: str):
        self.ensure_space(40)
        self.y -= 8
        self.current.append(f"0.95 0.71 0.0 rg 48 {self.y - 3:.1f} 18 16 re f")
        self.current.append(
            f"BT /F2 9.5 Tf 0.0 0.10 0.24 rg 53 {self.y + 1:.1f} Td ({pdf_escape(num)}) Tj ET"
        )
        self.current.append(
            f"BT /F2 12.2 Tf 0.0 0.10 0.24 rg 74 {self.y:.1f} Td ({pdf_escape(heading)}) Tj ET"
        )
        self.current.append(
            f"0.85 0.88 0.93 RG 0.8 w 48 {self.y - 8:.1f} m 547.28 {self.y - 8:.1f} l S"
        )
        self.y -= 24

    def paragraph(
        self,
        text: str,
        indent: float = 0,
        font: str = "F1",
        size: float = 9.6,
        color: str = "0.18 0.22 0.28",
    ):
        words = text.split(" ")
        lines = []
        cur = ""
        max_chars = int((499 - indent) / (size * 0.50))
        for w in words:
            if len(cur) + len(w) + 1 <= max_chars:
                cur = (cur + " " + w).strip()
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        self.ensure_space(len(lines) * (size + 4.4) + 4)
        for line in lines:
            self.current.append(
                f"BT /{font} {size} Tf {color} rg {48 + indent:.1f} {self.y:.1f} Td ({pdf_escape(line)}) Tj ET"
            )
            self.y -= size + 4.1
        self.y -= 2

    def bullet(self, label: str, body: str):
        self.ensure_space(28)
        self.current.append(f"0.0 0.18 0.40 rg 54 {self.y + 2.5:.1f} 3.2 3.2 re f")
        self.current.append(
            f"BT /F2 9.5 Tf 0.05 0.12 0.24 rg 64 {self.y:.1f} Td ({pdf_escape(label)}) Tj ET"
        )
        self.y -= 13.5
        self.paragraph(body, indent=16, size=9.2, color="0.22 0.27 0.34")

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[float]):
        row_h = 18
        self.ensure_space((len(rows) + 2) * row_h)
        x = 48.0
        self.current.append(f"0.91 0.94 0.98 rg 48 {self.y - 13:.1f} 499.28 {row_h} re f")
        cx = x
        for h, w in zip(headers, col_widths):
            self.current.append(
                f"BT /F2 8.8 Tf 0.05 0.14 0.28 rg {cx + 6:.1f} {self.y - 8:.1f} Td ({pdf_escape(h)}) Tj ET"
            )
            cx += w
        self.y -= row_h
        for idx, r in enumerate(rows):
            if idx % 2 == 1:
                self.current.append(
                    f"0.97 0.98 0.995 rg 48 {self.y - 13:.1f} 499.28 {row_h} re f"
                )
            cx = x
            for i, (cell, w) in enumerate(zip(r, col_widths)):
                font = "F3" if i == 0 else "F1"
                size = 8.3 if i == 0 else 8.7
                col = "0.02 0.22 0.45" if i == 0 else "0.20 0.25 0.32"
                self.current.append(
                    f"BT /{font} {size} Tf {col} rg {cx + 6:.1f} {self.y - 8:.1f} Td ({pdf_escape(cell)}) Tj ET"
                )
                cx += w
            self.y -= row_h
        self.y -= 8

    def finish(self) -> bytes:
        if self.current:
            self.pages.append("\n".join(self.current))

        objects = []
        page_obj_ids = []
        content_obj_ids = []
        next_id = 6
        for _ in self.pages:
            page_obj_ids.append(next_id)
            content_obj_ids.append(next_id + 1)
            next_id += 2

        objects.append((1, b"<< /Type /Catalog /Pages 2 0 R >>"))
        kids = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
        objects.append(
            (2, f"<< /Type /Pages /Kids [{kids}] /Count {len(page_obj_ids)} >>".encode())
        )
        objects.append(
            (
                3,
                b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            )
        )
        objects.append(
            (
                4,
                b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            )
        )
        objects.append(
            (
                5,
                b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
            )
        )

        for idx, page_stream in enumerate(self.pages):
            pid = page_obj_ids[idx]
            cid = content_obj_ids[idx]
            footer = (
                f"\n0.85 0.88 0.93 RG 0.6 w 48 38 m 547.28 38 l S\n"
                f"BT /F1 8 Tf 0.45 0.50 0.58 rg 48 25 Td "
                f"(yveyeh.github.io  -  Complete Unabridged Technical Report  |  Page {idx + 1} of {len(self.pages)}) Tj ET"
            )
            stream_bytes = (page_stream + footer).encode("latin-1", errors="replace")
            page_dict = (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] "
                f"/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> "
                f"/Contents {cid} 0 R >>"
            ).encode()
            content_dict = (
                f"<< /Length {len(stream_bytes)} >>\nstream\n".encode()
                + stream_bytes
                + b"\nendstream"
            )
            objects.append((pid, page_dict))
            objects.append((cid, content_dict))

        objects.sort(key=lambda x: x[0])
        out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for oid, body in objects:
            offsets.append(len(out))
            out.extend(f"{oid} 0 obj\n".encode())
            out.extend(body)
            out.extend(b"\nendobj\n")

        xref_pos = len(out)
        out.extend(f"xref\n0 {len(objects) + 1}\n".encode())
        out.extend(b"0000000000 65535 f \n")
        for off in offsets[1:]:
            out.extend(f"{off:010d} 00000 n \n".encode())
        out.extend(
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
        )
        return bytes(out)


def build_report() -> None:
    pdf = LightPDFBuilder()
    pdf.new_page()
    pdf.title_banner(
        "UI Alignment, Flask + MySQL Backend & Vuex 4 Report",
        "Complete Unabridged Living Report: UI Fixes, Flask/MySQL API, Vuex 4, SOLID/ACID & Live System Flow",
        "Project: yveyeh.github.io   |   Author: Didier Yufenyuy Veyeh   |   All Sections Preserved",
    )

    # ── SECTION 01 (Preserved in full from Report v1) ─────────────────
    pdf.section_heading("01", "Why /jobs Looked Broken & How It Was Fixed")
    pdf.bullet(
        "Root Cause (Missing Theme Token):",
        "JobsView.html referenced bg-navy-950, which was not defined inside @theme in src/style.css. This caused Tailwind v4 to render a white background while keeping text-white, making headings and stats invisible.",
    )
    pdf.bullet(
        "Design System Unification with /blog:",
        "Added --color-navy-950 (#000f24) to src/style.css and standardized JobsView.html on bg-navy-900 to match BlogListView.html. Added the sticky top navigation header with headshot, title, and navigation links (<- Home, Technical Blog, Admin Studio).",
    )
    pdf.bullet(
        "Cohesive Components & Layout:",
        "Aligned the Hero section, search input, workplace/employment filter pills, Featured Opportunity Spotlight banner, 3-column JobCard grid, and bottom Referral CTA banner with the exact styling of the Blog page.",
    )

    # ── SECTION 02 (Preserved in full from Report v1) ─────────────────
    pdf.section_heading("02", "Complete Flask + MySQL 8.0 Backend Architecture")
    pdf.paragraph(
        "All application data is now persisted in and served from a Python Flask REST API backed by a MySQL 8.0 database (container yveyeh-mysql on 127.0.0.1:3306, schema yveyeh_portfolio), configured in docker-compose.yml and backend/.env. GitHub commit/deployment integration has been removed from the Admin Studio."
    )
    pdf.table(
        ["MySQL Table", "Model Class", "Purpose & Stored Attributes"],
        [
            ["site_profile", "SiteProfile", "Hero profile name, title, email, avatar, bio, status badge & repo URLs"],
            ["social_links", "SocialLink", "9-dot launcher social platforms, URLs, brand colors & sort order"],
            ["blog_posts", "BlogPostModel", "All 8 full Markdown technical articles, tags (JSON), category & author"],
            ["post_interactions", "PostInteractionModel", "Per-article view counters, share counts & 5 reaction counters"],
            ["blog_comments", "BlogCommentModel", "Reader comments with ISO timestamps, handles & avatar colors"],
            ["tech_jobs", "TechJobModel", "Curated job roles, workplace/employment types, salary & referral links"],
        ],
        [115, 115, 269.28],
    )

    # ── SECTION 03 (Preserved in full from Report v1) ─────────────────
    pdf.section_heading("03", "Flask REST API Endpoints (backend/app.py)")
    pdf.paragraph(
        "Vite (vite.config.js) proxies /api requests to http://127.0.0.1:5000. All frontend views and AdminStudioView read and write directly through these endpoints:"
    )
    pdf.table(
        ["Method & Endpoint", "Description"],
        [
            ["GET  /api/health", "Returns MySQL connection health and live row counts across all tables"],
            ["GET/PUT /api/profile", "Fetches or updates site profile metadata and social handle links"],
            ["GET  /api/socials", "Returns ordered social links for the 9-dot launcher"],
            ["GET/POST /api/posts", "Lists all blog posts or creates/upserts an article in MySQL"],
            ["GET/PUT/DELETE /api/posts/<slug>", "Fetches, updates, or deletes a specific blog post by slug or ID"],
            ["POST /api/posts/reset", "Resets blog_posts table in MySQL back to the 8 seed articles"],
            ["GET  /api/posts/<slug>/interactions", "Returns views, shares, reactions, and comments for an article"],
            ["POST /api/posts/<slug>/view | share", "Atomically increments article view or share count in MySQL"],
            ["POST /api/posts/<slug>/react", "Increments or decrements fire, smart, rocket, shield, or heart"],
            ["POST /api/posts/<slug>/comments", "Persists a new reader comment in MySQL and returns updated list"],
            ["GET/POST /api/jobs", "Lists all tech job opportunities or publishes a new role to MySQL"],
            ["GET/PUT/DELETE /api/jobs/<id>", "Fetches, updates, or deletes a job opportunity in MySQL"],
            ["POST /api/jobs/reset", "Resets tech_jobs table in MySQL back to initial curated roles"],
            ["POST /api/auth/login | verify | logout", "Verifies admin passcode with SHA-256 + brute-force lockout"],
        ],
        [185, 314.28],
    )

    # ── SECTION 04 (Preserved in full from Report v2 + v3 update) ─────
    pdf.section_heading(
        "04", "Nine-Dot Button with Curly Pork-Tail / Smiley Arrow & 'MORE' Callout"
    )
    pdf.bullet(
        "45-Degree Bottom-Left Orientation (AppsLauncher.html):",
        "Positioned the attention-grabbing callout at a 45-degree angle below and to the left of the top-right 9-dot button (absolute top-8 right-8 sm:top-9 sm:right-9), pointing diagonally up-and-right toward the button.",
    )
    pdf.bullet(
        "Smiley Swoop + Curly Pork-Tail SVG Path:",
        "Features an animated gold SVG arrow with a smiley swoop and pork-tail loop plus a subtle pulse ring around the 9-dot button so it immediately catches visitors' attention. Clicking either the 'MORE' callout/arrow or the 9-dot button opens the menu (and hides the arrow while open).",
    )
    pdf.bullet(
        "Right Edge of 'MORE' Pill Touching the Exact End of the Arrow Tail:",
        "Both the 'MORE' pill (rect x='2' y='56' width='56' height='24' rx='12', right edge at x=58, y=68) and the 45-degree pork-tail arrow are rendered inside one unified SVG (viewBox='0 0 138 86'). The arrow tail starts at M 58 68 -> C 80 68, 100 54, 94 36 C 89 22, 71 29, 79 43 C 87 57, 108 36, 124 10, so the right side of the 'MORE' pill directly touches the very tip of the arrow tail.",
    )

    # ── SECTION 05 (Preserved in full from Report v2) ─────────────────
    pdf.section_heading("05", "Why *Store Was Named That Way & Migrating to Vuex 4")
    pdf.bullet(
        "Why It Was Originally Written as Composables:",
        "In Vue 3, lightweight reactive singletons (useBlogStore, useJobStore) or Pinia are often used instead of Vuex. However, Vuex 4 (vuex@^4.1.0) is the official Vuex release for Vue 3 and gives a strict, centralized state -> getters -> mutations -> actions architecture.",
    )
    pdf.bullet(
        "Full Migration to Centralized Vuex 4 Store (src/store/index.ts):",
        "Installed vuex@^4.1.0, configured TypeScript path declarations in tsconfig.json, registered createApp(App).use(store) in src/main.ts, and wired blogStore.ts, jobStore.ts, and profileStore.ts directly to the centralized Vuex store.",
    )
    pdf.table(
        ["Vuex 4 Layer", "Identifier", "Responsibility in src/store/index.ts"],
        [
            ["state", "posts, jobs, profile, socials...", "Single source of truth for articles, jobs, profile & DB health"],
            ["getters", "allPosts, postBySlug, allJobs...", "Reactive selectors for filtered views and slug/ID lookups"],
            ["mutations", "SET_POSTS, UPSERT_POST, REMOVE_POST", "Synchronous state transitions for blog articles"],
            ["mutations", "SET_JOBS, ADD_JOB, UPDATE_JOB...", "Synchronous state transitions for tech job opportunities"],
            ["mutations", "SET_PROFILE, SET_SOCIALS, SET_BACKEND...", "Updates site profile, 9-dot social links & MySQL telemetry"],
            ["actions", "fetchPosts, savePost, deletePost...", "Async REST calls to Flask + MySQL (/api/posts)"],
            ["actions", "fetchJobs, addJob, updateJob...", "Async REST calls to Flask + MySQL (/api/jobs)"],
            ["actions", "fetchProfileAndSocials, fetchBackend...", "Syncs profile, socials, and /api/health telemetry from MySQL"],
        ],
        [95, 165, 239.28],
    )

    # ── SECTION 06 (Appended: SOLID OOP & Strict ACID Backend) ────────
    pdf.section_heading("06", "SOLID OOP & Strict ACID Backend Architecture")
    pdf.bullet(
        "Atomicity (backend/core/database.py - TransactionManager.atomic()):",
        "Provides a Unit-of-Work context manager where multi-table operations (such as saving a BlogPostModel and initializing its PostInteractionModel) commit together or automatically rollback() on any exception.",
    )
    pdf.bullet(
        "Consistency & Domain Validation:",
        "Domain invariants (DomainValidationError, EntityNotFoundError) and schema constraints are validated prior to commit and handled via centralized Flask error handlers.",
    )
    pdf.bullet(
        "Isolation & Concurrency Safety:",
        "Configured READ COMMITTED engine isolation with explicit InnoDB row-level pessimistic locks (with_for_update() / SELECT ... FOR UPDATE) and server-side atomic SQL increments (PostInteractionModel.views + 1) so concurrent requests never overwrite counters.",
    )
    pdf.bullet(
        "Durability (backend/models.py - BaseEntity):",
        "Enforces mysql_engine='InnoDB' and utf8mb4_unicode_ci across all tables with connection pool pre-ping health checks.",
    )
    pdf.bullet(
        "SOLID OOP Repository & Service Layers:",
        "Abstract IReadRepository[T] contract (ISP/DIP) in backend/repositories.py is implemented by PostRepository, InteractionRepository, JobRepository, ProfileRepository, and DiagnosticsRepository (SRP), and injected into BlogService, JobService, ProfileService, AuthService, and DiagnosticsService in backend/services.py.",
    )

    # ── SECTION 07 (Appended: Centralized Home Page System Design Video) ─
    pdf.section_heading(
        "07", "Upgraded Home Page Looping Video: Centralized Live System Design Flow"
    )
    pdf.bullet(
        "1080p @ 30fps H.264 Seamless Loop (system-design-flow.mp4 & bg.mp4):",
        "Replaced the legacy 6.1 MB background video (backed up at bg-legacy.mp4) with a 470 KB 1920x1080 @ 30fps H.264 seamlessly looping Live System Design Flow video and matching bg-mobile-fallback.jpg.",
    )
    pdf.bullet(
        "Centralized, Aesthetic 3-Tier Symmetrical Topology:",
        "Centered around the Kubernetes Mesh (Cilium eBPF + Istio mTLS) hub at (x=1190, y=545) with concentric orbital rings, expanding sonar waves, double-layered curved Bezier pipelines, and glowing animated data packets.",
    )
    pdf.bullet(
        "Polyglot Data Plane with PostgreSQL 16 + MongoDB + Redis:",
        "Tier 1 (Ingress & CI): GIT + OIDC AUTH, ZERO-TRUST CI GATE (Trivy + Cosign), CLOUDFLARE + ENVOY WAF. Tier 2 (Core Hub): ARGO CD GITOPS, KUBERNETES MESH, OTEL + PROMETHEUS. Tier 3 (Data Plane): REDIS CLUSTER, POSTGRESQL 16 (ACID Primary + Read Replicas), and MONGODB SHARD (Replica Set Document Store).",
    )
    pdf.bullet(
        "Crystal-Clear Contrast in HomeView.html:",
        "Bound src='/assets/video/system-design-flow.mp4' directly on the <video> element and replaced the heavy bg-umber/70 overlay with a directional gradient (bg-linear-to-r from-navy-950/70 via-navy-900/20 to-navy-950/10) so the live system design flow shines through clearly.",
    )

    # ── SECTION 08 (Appended: Full-Stack Unit Testing & Coverage >= 85%) ─
    pdf.section_heading(
        "08", "Full-Stack Unit Testing & Coverage Report (Frontend & Backend >= 85%)"
    )
    pdf.paragraph(
        "Automated unit and integration test suites were engineered across the entire Vue 3 + TypeScript + Vuex 4 frontend (Vitest + @vue/test-utils + happy-dom + V8 coverage) and the SOLID OOP + ACID Flask backend (pytest + pytest-cov), enforcing a strict >= 85% minimum coverage threshold in both vite.config.js and backend/pyproject.toml."
    )
    pdf.table(
        ["Test Suite Layer", "Runner & Tooling", "Coverage Metrics Achieved"],
        [
            [
                "Backend (Flask / SOLID / ACID)",
                "pytest 9.2 + pytest-cov 7.1",
                "99.85% Total (648 / 649 stmts; 100% models, repos, services, ACID)",
            ],
            [
                "Frontend (Vue 3 / Vuex 4 / UI)",
                "Vitest 1.6 + @vitest/coverage-v8",
                "99.62% Stmts | 99.62% Lines | 99.18% Funcs | 85.93% Branches",
            ],
        ],
        [150, 145, 204.28],
    )
    pdf.table(
        ["Module / Test Target", "Stmts / Lines", "Funcs / Branches", "Verified Unit Test Scenarios"],
        [
            [
                "backend/core/database.py",
                "100.0%",
                "100.0%",
                "TransactionManager.atomic() commit & automatic rollback on failure",
            ],
            [
                "backend/models.py & seed.py",
                "100.0%",
                "100.0%",
                "InnoDB BaseEntity, 6 ORM models, JSON serialization & idempotent seed",
            ],
            [
                "backend/repositories.py",
                "100.0%",
                "100.0%",
                "IReadRepository[T], Profile, Post, Interaction, Job & Diagnostics repos",
            ],
            [
                "backend/services.py",
                "100.0%",
                "100.0%",
                "AuthService lockout, ProfileService, BlogService, JobService & Diagnostics",
            ],
            [
                "backend/app.py",
                "99.32%",
                "100.0%",
                "All 21 REST API routes, 400/404 domain error handlers & MySQL bootstrap",
            ],
            [
                "src/store/index.ts & src/data/*",
                "99.90%",
                "98.8% / 93.3%",
                "Vuex 4 state, getters, mutations, async fetch actions & store wrappers",
            ],
            [
                "src/utils/date.ts & router/*",
                "100.0%",
                "100.0%",
                "formatRelativeTime, formatDate, Vue Router guards & scrollBehavior",
            ],
            [
                "src/composables/*",
                "100.0%",
                "100% / 85.9%",
                "useBlogInteractions (views/shares/reactions/comments) & useBlogPost",
            ],
            [
                "src/components/** (15 comps)",
                "99.78%",
                "100% / 96.4%",
                "AppsLauncher, BrandIcon, JobCard, JobFilterBar & all 11 Blog components",
            ],
            [
                "src/views/** (5 views)",
                "98.78%",
                "100% / 80.5%",
                "HomeView, BlogListView, BlogPostView, JobsView & AdminStudioView CRUD",
            ],
        ],
        [135, 68, 78, 218.28],
    )

    # ── SECTION 09 (Appended: Auth Lockout Policy Update & IDE Config) ──
    pdf.section_heading(
        "09", "Admin Auth Brute-Force Policy Update (3 Attempts / 15-Min Lockout)"
    )
    pdf.bullet(
        "Stricter Brute-Force Lockout Threshold (3 Attempts, 15 Minutes):",
        "Updated AuthService in backend/services.py (MAX_FAILED_ATTEMPTS = 3, LOCKOUT_DURATION_SEC = 900) and AdminStudioView.ts (MAX_FAILED_ATTEMPTS = 3, LOCKOUT_DURATION_MS = 15 * 60 * 1000) so 3 consecutive invalid passcodes lock the studio for 15 minutes (HTTP 429).",
    )
    pdf.bullet(
        "Admin Studio Passcode Reference:",
        "The configured admin passcode in backend/.env and backend/services.py is 'didi2026' (verified via constant-time SHA-256 comparison secrets.compare_digest on the backend and Web Crypto SHA-256 fallback on the frontend).",
    )
    pdf.bullet(
        "Workspace IDE Problems Console Resolution (pyrightconfig.json & .vscode/settings.json):",
        "Configured pyrightconfig.json and .vscode/settings.json at the workspace root to bind the IDE Python language server to backend/.venv/bin/python with extraPaths=['backend'], unified IReadRepository.get_by_id signatures in backend/repositories.py, added explicit SQLAlchemy typing on BaseEntity in backend/models.py, and disabled false-positive CSS unknownAtRules warnings for Tailwind v4 @theme directives.",
    )

    output_path = Path(
        "/home/devops-2/Projects/yveyeh.github.io/public/docs/Flask-MySQL-Backend-and-UI-Report.pdf"
    )
    output_path.write_bytes(pdf.finish())
    print(
        f"Generated {output_path} ({output_path.stat().st_size} bytes, {len(pdf.pages)} pages)"
    )


if __name__ == "__main__":
    build_report()

