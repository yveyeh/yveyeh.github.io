import type { BlogPost } from '../types/blog'

/**
 * Seed articles for Didier Yufenyuy Veyeh's DevSecOps & Cloud Architecture Blog.
 * @author Didier Yufenyuy Veyeh <https://yveyeh.github.io>
 * @copyright © 2021. Tenshnova (https://www.yveyeh.dev)
 */

export const initialPosts: BlogPost[] = [
  {
    id: 'zero-trust-cicd-pipeline',
    slug: 'zero-trust-cicd-pipeline',
    title: 'Engineering Zero-Trust CI/CD Pipelines: From Git Commit to Production Clusters',
    summary: 'A deep-dive architectural blueprint for shifting security left with cryptographic provenance, ephemeral OIDC runners, and policy enforcement via Kyverno and Cosign.',
    category: 'CI/CD Security',
    tags: ['DevSecOps', 'Kubernetes', 'Cosign', 'Kyverno', 'OIDC', 'Supply Chain Security'],
    date: '2026-10-15',
    readTime: '7 min read',
    featured: true,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Engineering Zero-Trust CI/CD Pipelines: From Git Commit to Production Clusters

In modern cloud environments, software supply chain attacks have moved from theoretical risks to primary threat vectors. Securing the CI/CD pipeline requires moving beyond static credential storage and embracing **cryptographic provenance**, **ephemeral authentication**, and **admission policy enforcement**.

---

## 1. The Zero-Trust Pipeline Paradigm

Traditional continuous integration relies on persistent, high-privilege credentials stored as repository secrets. A compromised build step or malicious pull request can leak these long-lived credentials, providing an attacker full lateral access into target cloud infrastructure.

A Zero-Trust pipeline replaces persistent credentials with short-lived **OpenID Connect (OIDC)** tokens minted by the Git provider and verified directly by the cloud provider (AWS IAM, GCP Workload Identity, or Azure Federated Credentials).

\`\`\`yaml
# Example: Ephemeral GitHub Actions OIDC Authentication to GCP
permissions:
  id-token: write
  contents: read

steps:
  - name: Authenticate to Google Cloud via Workload Identity
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
      service_account: 'ci-runner@prod-infra-sec.iam.gserviceaccount.com'
\`\`\`

---

## 2. Cryptographic Artifact Signing with Sigstore Cosign

Building a container image is only half the battle. How does your production Kubernetes cluster verify that an image running in namespace \`production\` was actually built by your trusted pipeline and has not been tampered with?

Using **Sigstore Cosign**, we sign container images directly during the pipeline run using keyless signing backed by Fulcio and Rekor transparency logs:

\`\`\`bash
# Keyless signing of container digest
cosign sign --yes \\
  ghcr.io/yveyeh/secure-microservice@sha256:7b52...
\`\`\`

---

## 3. Automated Vulnerability Gate with Trivy

Before signing, the image must pass rigorous Static Application Security Testing (SAST) and Container Vulnerability Scanning. We automate this using **Trivy** with exit codes tailored for build gate thresholds:

\`\`\`bash
trivy image \\
  --exit-code 1 \\
  --severity CRITICAL,HIGH \\
  --ignore-unfixed \\
  ghcr.io/yveyeh/secure-microservice:latest
\`\`\`

---

## 4. Kubernetes Admission Enforcement with Kyverno

Signing images is meaningless if clusters allow unsigned images to run. We deploy **Kyverno** or Open Policy Agent (OPA) Gatekeeper to enforce cluster-level verification:

\`\`\`yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-sigstore-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "ghcr.io/yveyeh/*"
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/yveyeh/*"
                    issuer: "https://token.actions.githubusercontent.com"
\`\`\`

---

## Summary

By combining OIDC identity federation, vulnerability scanning gates, keyless Sigstore signatures, and Kyverno admission controls, we create a resilient, tamper-evident pipeline where **no unauthorized artifact can ever touch production clusters**.
`
  },
  {
    id: 'terraform-opentofu-multi-cloud',
    slug: 'terraform-opentofu-multi-cloud',
    title: 'Architecting Resilient Multi-Cloud Infrastructure as Code with OpenTofu',
    summary: 'Best practices for modular IaC, state file segregation, remote locking, and zero-drift drift detection across AWS, GCP, and Kubernetes environments.',
    category: 'Cloud Architecture',
    tags: ['Terraform', 'OpenTofu', 'MultiCloud', 'IaC', 'GCP', 'AWS', 'Security'],
    date: '2026-09-28',
    readTime: '6 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Architecting Resilient Multi-Cloud Infrastructure as Code with OpenTofu

When scaling distributed systems across multiple cloud platforms, Infrastructure as Code (IaC) governance often degrades into monolithic state files and brittle dependencies. 

This guide breaks down modular architectures, state boundary segregation, and automated security linting using **OpenTofu** and **Checkov**.

---

## 1. Modular Directory Layout by Blast Radius

Never store an entire cloud estate in a single root module. Separate your state by operational velocity and blast radius:

\`\`\`
infra/
├── modules/
│   ├── gke-cluster/
│   ├── vpc-network/
│   └── cloud-kms/
└── environments/
    ├── networking/     # Updated quarterly
    ├── identity/       # Updated semi-annually
    └── workloads/      # Updated continuously
\`\`\`

---

## 2. Encrypted Remote State with Strict Object Locking

A compromised state file exposes database passwords, TLS private keys, and cloud resource IDs. Enforce KMS client-side encryption and Bucket Lock:

\`\`\`hcl
terraform {
  backend "gcs" {
    bucket                      = "tf-state-prod-secure-3829"
    prefix                      = "env/production"
    encryption_key              = "projects/p-sec/locations/global/keyRings/tf/cryptoKeys/state-key"
  }
}
\`\`\`

---

## 3. Pre-Commit Security Linting with Checkov & TFLint

Prevent misconfigurations before they ever leave the developer's laptop:

\`\`\`bash
# Scan for CIS benchmark violations
checkov -d . --framework terraform --compact
\`\`\`

This catches unencrypted storage buckets, overly permissive ingress security groups, and missing audit log sinks.
`
  },
  {
    id: 'kubernetes-secrets-vault-operator',
    slug: 'kubernetes-secrets-vault-operator',
    title: 'Enterprise Secrets Management on Kubernetes with HashiCorp Vault',
    summary: 'Eliminate Kubernetes secret sprawl using the Vault Secrets Operator and Agent Injector for dynamic, automatically rotated credentials.',
    category: 'DevSecOps',
    tags: ['Vault', 'Kubernetes', 'Security', 'Secrets Management', 'HashiCorp'],
    date: '2026-08-14',
    readTime: '5 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Enterprise Secrets Management on Kubernetes with HashiCorp Vault

Base64-encoded Kubernetes secrets stored in etcd are not a comprehensive security strategy. To meet PCI-DSS and SOC-2 compliance, organizations require dynamic lease times, audit logs, and automatic certificate rotation.

---

## 1. Vault Secrets Operator (VSO) vs Agent Injector

The modern standard is the **Vault Secrets Operator (VSO)**. Rather than injecting sidecar containers, VSO synchronizes Vault secrets into native Kubernetes secret objects with automatic synchronization:

\`\`\`yaml
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultStaticSecret
metadata:
  name: database-credentials
  namespace: app-prod
spec:
  type: kv-v2
  mount: secret
  path: production/database
  destination:
    name: db-credentials-secret
    createSecret: true
  refreshAfter: 1h
  vaultAuthRef: vault-auth-k8s
\`\`\`

---

## 2. Ephemeral Dynamic Database Credentials

Instead of static database passwords that never change, configure Vault's database engine to generate short-lived PostgreSQL credentials that expire automatically after 30 minutes.

\`\`\`bash
vault read database/creds/readonly-role
# Returns temporary username (v-token-...) and password with 30m TTL
\`\`\`

---

## Conclusion

Leveraging dynamic secrets and operator-level synchronization isolates developers from having direct access to production secrets, significantly shrinking the attack surface.
`
  },
  {
    id: 'introduction-to-docker-guide',
    slug: 'introduction-to-docker-guide',
    title: 'Demystifying Docker: The Complete Guide Anyone Can Understand (From Bento Boxes to DevSecOps)',
    summary: 'A crystal-clear, illustrated beginner-to-advanced guide to Docker. Understand containers through intuitive real-world metaphors, architectural deep-dives, lifecycle diagrams, and production DevSecOps best practices.',
    category: 'Containers & DevOps',
    tags: ['Docker', 'Containers', 'DevSecOps', 'DevOps', 'Architecture', 'Beginner Guide', 'Linux'],
    date: '2026-10-28',
    readTime: '9 min read',
    featured: true,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Demystifying Docker: The Complete Guide Anyone Can Understand

Imagine you spent three weeks building a magnificent LEGO castle in your bedroom. It is completely finished, every bridge is balanced, and the drawbridge works flawlessly.

Now your friend invites you over and says: *"Hey, bring your castle! We want to play with it at my house!"*

You have two choices:
1. **The Old, Painful Way:** Disassemble all 2,000 bricks, put them in a loose bag, travel to your friend's house, and hope you can rebuild it before dinner. But wait! Your friend's table is smaller, the floor is uneven, and his little dog chews up three critical red bricks. The castle collapses. You scream the oldest phrase in software history:
   > *"Well, it worked perfectly in my bedroom!"*
2. **The Docker Way:** You place the castle inside a magical, unbreakable, transparent shipping box with its own climate control, its own battery, and its own perfectly flat floor. You pick up the box, take it anywhere in the world—to your friend's house, to school, or to a supercomputer in the cloud—and plug it in. It works **identically everywhere**.

That magical, self-contained box is a **Docker Container**.

![Standardized Cargo Ship Analogy for Docker Containers](/assets/img/blog/docker-shipping-analogy.jpg)

---

## 1. The Real-World Mystery: Why Did We Need Docker?

Before Docker arrived in 2013, shipping software was a nightmare. 

A programmer would write an application on their shiny MacBook running Python 3.11, PostgreSQL 15, and special font libraries. When they handed the code over to the Operations team to run on a Linux production server, the server had Python 3.8 and missing dependencies. The application crashed instantly.

Developers and system administrators spent countless nights arguing:
- *"It worked on my laptop!"*
- *"Well, we can't ship your laptop to the cloud, can we?"*

Docker solved this forever by borrowing an idea from **global maritime shipping**. 

Before 1956, dockworkers loaded ships barrel by barrel, sack by sack, and crate by crate. It took days, goods got crushed or stolen, and trains couldn't easily carry ship cargo. Then came the **standardized steel intermodal container**. Whether you're transporting bananas, sports cars, or computer chips, every crane, truck, train, and cargo vessel on Earth accommodates the exact same 20-foot and 40-foot metal box.

**Docker does the exact same thing for software.** It packs your code, your runtime, your system tools, your settings, and your libraries into a single standard container image that runs on any machine with Docker installed.

---

## 2. Core Concepts: The Four Pieces of the Puzzle

Docker sounds intimidating with all its terminal commands, but it actually boils down to four simple concepts. Think of them like baking a chocolate cake:

| Docker Concept | Real-World Analogy | What It Actually Is |
| :--- | :--- | :--- |
| **Dockerfile** | The Recipe Card | A plain text file containing step-by-step instructions on how to build your environment. |
| **Docker Image** | The Packaged Cake Mix | A read-only, frozen snapshot containing the code and libraries. It sits on your disk waiting to be used. |
| **Docker Container** | The Freshly Baked Cake | A live, running process created from an image. You can have 10 identical cakes baked from 1 recipe! |
| **Docker Hub / Registry** | The Grocery Store Shelf | A global cloud library where people share and download pre-made images (like official Node.js, Python, or Ubuntu). |

![The Docker Development Lifecycle: Dockerfile to Image to Container to Registry](/assets/img/blog/docker-workflow-lifecycle.jpg)

### Let's Walk Through the Flow:
1. **You write a \`Dockerfile\`**: *"Start with Linux, install Python, copy my files, and start my website."*
2. **You build an Image**: Docker reads the recipe and freezes it into an immutable blueprint (\`docker build\`).
3. **You run a Container**: Docker takes that blueprint and runs an active, living instance in milliseconds (\`docker run\`).
4. **You push to a Registry**: You upload your blueprint to Docker Hub or AWS ECR so your teammates or production servers can pull it (\`docker push\`).

---

## 3. Containers vs. Virtual Machines: The Hotel vs. The Apartment

People often confuse **Docker Containers** with **Virtual Machines (VMs)** like VMware or VirtualBox. Here is the easiest way to understand the difference:

![Virtual Machines Architecture vs Docker Containers Architecture](/assets/img/blog/docker-vm-vs-containers.jpg)

### The Virtual Machine (A Private Villa Hotel)
Imagine every time you want to sleep in a new city, you construct an entire standalone house with its own private foundation, its own plumbing, its own electrical generator, and its own security guard. 
- In computing, a VM packages a **full guest operating system** (several gigabytes of Windows or Linux) on top of a hypervisor.
- **The downside:** It is heavy, takes 2 to 5 minutes to boot, and consumes gigabytes of RAM before your app even starts.

### The Docker Container (An Apartment in a Skyscraper)
Instead of building a whole house, imagine you rent an apartment in a modern high-rise building. All apartments share the building's central heating, water pipes, and foundation, but your apartment has its own locked front door, its own furniture, and complete privacy.
- A Docker container does **not** install a guest operating system! It shares the **Host Linux Kernel** while isolating the files, processes, and network.
- **The upside:** Containers boot in **under 200 milliseconds**, weigh only tens of megabytes, and you can pack hundreds of them onto a single server.

### Side-by-Side Comparison:

| Feature | Virtual Machines (VMs) | Docker Containers |
| :--- | :--- | :--- |
| **Architecture** | App + Libs + Full Guest OS on Hypervisor | App + Libs isolated on shared Host OS Kernel |
| **Startup Time** | Minutes (boots full operating system) | Milliseconds (starts a standard process) |
| **Disk Size** | Gigabytes (10GB - 50GB typical) | Megabytes (5MB - 500MB typical) |
| **RAM Usage** | Heavy (pre-allocated memory slice) | Lightweight (uses only what the process needs) |
| **Density** | 5 - 20 VMs per physical server | Hundreds to thousands of containers per server |
| **Portability** | Slow to transfer and export | Instant pulling and pushing over standard registries |

---

## 4. Under the Hood: The Secret Linux Superpowers

How can multiple containers share the same computer without interfering with each other? If Container A crashes or gets hacked, why doesn't Container B go down?

Docker is not magic—it is an elegant conductor orchestrating three native superpowers built into the **Linux Kernel**:

\`\`\`
+-------------------------------------------------------------+
|                     YOUR APPLICATIONS                       |
|   [ Container A: Web App ]       [ Container B: Database ]  |
+-------------------------------------------------------------+
|                     DOCKER ENGINE / RUNTIME                 |
|             (containerd, runc, storage drivers)             |
+-------------------------------------------------------------+
|                     LINUX KERNEL SUPERPOWERS                |
|  * Namespaces (Invisible Walls: PID, NET, MNT, IPC, UTS)    |
|  * Control Groups / cgroups (Resource Limits: CPU, RAM)     |
|  * OverlayFS (Layered Stackable File System)                |
+-------------------------------------------------------------+
|                     PHYSICAL HARDWARE                       |
|                 (CPU, RAM, Disks, Network)                  |
+-------------------------------------------------------------+
\`\`\`

### 1. Namespaces (Invisible Walls)
Namespaces provide isolation. When a program runs inside a container, Linux gives it a private view of the world:
- **PID Namespace (Process IDs):** The container thinks its process is Process #1 (the king of the computer), completely unaware of the 200 other programs running on the host.
- **NET Namespace (Networking):** The container gets its own virtual network card, IP address, and port range.
- **MNT Namespace (Mount / Files):** The container only sees its own folder tree (\`/\`). It cannot touch the host's files unless you explicitly allow it.
- **USER Namespace:** You can be root inside the container while being an unprivileged user outside!

### 2. Control Groups / cgroups (The Strict Referee)
What if one container goes crazy and tries to eat 100% of your computer's RAM?
**cgroups** act like a strict referee. You can tell Docker: *"Hey, this web container is never allowed to use more than 512MB of RAM and 1 CPU core."* If it tries to exceed that, the kernel gently throttles or stops it, protecting the rest of your system.

### 3. Layered File System (OverlayFS)
When you build a Docker image, Docker stacks layers like transparent sheets of glass:
- Layer 1: Base Linux OS (e.g. Alpine Linux - 5 MB)
- Layer 2: Node.js runtime (30 MB)
- Layer 3: Your application code (2 MB)

If you have 10 containers based on Alpine Linux, they all **share the exact same base layer on disk**. They don't duplicate it 10 times! This is why Docker is so blazing fast and storage-efficient.

---

## 5. Hands-On: Run Your First Container in 30 Seconds

Let's see Docker in action. Open your terminal and run:

\`\`\`bash
# 1. Verify Docker is running
docker --version

# 2. Launch an isolated NGINX web server on port 8080
docker run -d -p 8080:80 --name my-web-server nginx:alpine
\`\`\`

Open your browser to \`http://localhost:8080\` and you will see the *"Welcome to nginx!"* page!

### What just happened behind the scenes?
- \`docker run\`: Hey Docker, create and start a container.
- \`-d\` (detached mode): Run in the background so our terminal stays free.
- \`-p 8080:80\` (port mapping): Connect **port 8080 on your host laptop** to **port 80 inside the container**.
- \`--name my-web-server\`: Give our container a friendly nickname instead of a random UUID.
- \`nginx:alpine\`: The blueprint image. Since you didn't have it locally, Docker automatically downloaded it from Docker Hub in 3 seconds!

To stop and remove it:
\`\`\`bash
docker stop my-web-server
docker rm my-web-server
\`\`\`

---

## 6. Writing Your First Dockerfile: Recipe for a Real App

Here is a real-world, production-ready \`Dockerfile\` for a Node.js web application. Notice how human-readable and clean it is:

\`\`\`dockerfile
# Step 1: Start with a trusted, lightweight base image
FROM node:20-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy dependency definitions first (takes advantage of layer caching!)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm ci --only=production

# Step 5: Copy our application source code
COPY . .

# Step 6: Create and switch to a secure non-root user (Security Best Practice!)
USER node

# Step 7: Inform Docker which port our app listens on
EXPOSE 3000

# Step 8: Define the command that executes when the container launches
CMD ["node", "server.js"]
\`\`\`

### Building and Running it:
\`\`\`bash
# Build the image and tag it as 'my-app:v1'
docker build -t my-app:v1 .

# Run the container
docker run -d -p 3000:3000 --name running-app my-app:v1
\`\`\`

---

## 7. Multi-Container Orchestration: The Power of Docker Compose

Real applications rarely live in isolation. You usually have a **Web Frontend**, an **API Backend**, a **Database (PostgreSQL)**, and a **Cache (Redis)**.

Launching all of them manually with individual \`docker run\` commands and connecting virtual networks would be exhausting. 

Enter **Docker Compose**. With a single \`docker-compose.yml\` configuration file, you define your entire multi-container architecture like an orchestra score:

\`\`\`yaml
version: '3.8'

services:
  web-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=database
      - REDIS_HOST=cache
    depends_on:
      - database
      - cache

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_PASSWORD: supersecretpassword
    volumes:
      - db-data:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db-data:
\`\`\`

To boot your entire multi-service stack with isolated networks and persistent database storage:
\`\`\`bash
docker compose up -d
\`\`\`
To tear everything down cleanly:
\`\`\`bash
docker compose down
\`\`\`

---

## 8. DevSecOps: 5 Golden Rules for Production Docker Security

As a DevSecOps Architect, I see teams build amazing Docker containers that are unfortunately open to security vulnerabilities. Here are the 5 non-negotiable rules to keep your containers fortress-secure:

### 1. Never Run as Root!
By default, Docker containers run as the \`root\` superuser. If an attacker exploits a remote code execution bug in your app, they might escape the container and compromise the entire host.
\`\`\`dockerfile
# Create an unprivileged user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
\`\`\`

### 2. Use Minimal Base Images (Say Goodbye to Ubuntu)
Don't use a 1GB Ubuntu image just to run a 50-line Python script. Use **Alpine Linux** (5MB) or **Google Distroless** images. Less bloat means fewer pre-installed packages, which drastically reduces your vulnerability surface area.

### 3. Use Multi-Stage Builds
Compile your code in a heavy build stage, then copy only the compiled binary into a pristine, tiny production image:
\`\`\`dockerfile
# Stage 1: Build environment with compilers
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o myapp .

# Stage 2: Final pristine runtime environment
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/myapp /myapp
USER nonroot:nonroot
ENTRYPOINT ["/myapp"]
\`\`\`
*Result: An ultra-secure, 15MB container image containing zero compilers, zero package managers, and zero shell binaries for hackers to exploit!*

### 4. Scan Images in Your CI/CD Pipeline
Never ship an image to production without automated vulnerability scanning. Use open-source tools like **Trivy** or **Docker Scout**:
\`\`\`bash
trivy image --severity HIGH,CRITICAL my-app:v1
\`\`\`

### 5. Never Hardcode Secrets in Dockerfiles!
Never write \`ENV API_KEY="mysecret123"\` in a Dockerfile. Anyone who runs \`docker history my-app:v1\` can inspect every layer and extract your secrets. Always inject secrets at runtime using environment variables, Docker Secrets, or HashiCorp Vault.

---

## 9. Docker Command Quick-Reference Cheat Sheet

Keep these commands handy in your developer toolbox:

| Command | What It Does |
| :--- | :--- |
| \`docker pull <image>\` | Download an image from Docker Hub |
| \`docker build -t <tag> .\` | Build an image from a local \`Dockerfile\` |
| \`docker run -d -p <host>:<container> <image>\` | Run an image as an isolated background container |
| \`docker ps\` | List all currently active running containers |
| \`docker ps -a\` | List all containers (running and stopped) |
| \`docker logs -f <container_name>\` | Stream live console output/logs from a container |
| \`docker exec -it <container_name> sh\` | Open an interactive terminal shell inside a running container |
| \`docker stop <container_name>\` | Gracefully shut down a running container |
| \`docker rm <container_name>\` | Delete a stopped container |
| \`docker rmi <image_name>\` | Delete an image from local storage |
| \`docker system prune -a\` | Clean up all unused images, containers, and networks |

---

## 10. Conclusion & Where to Go Next

Docker revolutionized software engineering because it turned software deployment from an artisanal, fragile craft into an automated, standardized science. 

Whether you are writing a small weekend side-project or operating a massive multi-region Kubernetes cluster, understanding how Docker packages, isolates, and executes your code is the foundational superpower of modern cloud architecture.

Now that you understand the building blocks:
1. Install **Docker Desktop** or Docker Engine on your computer.
2. Containerize a simple application you've built.
3. Test your skills by running a multi-container stack with \`docker-compose\`.

Have questions or want to discuss zero-trust container security? Connect with me on [GitHub](https://github.com/yveyeh) or [LinkedIn](https://linkedin.com/in/yveyeh).
`
  }
]
