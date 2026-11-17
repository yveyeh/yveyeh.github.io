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
  },
  {
    id: 'gitops-argocd-kubernetes-deployments',
    slug: 'gitops-argocd-kubernetes-deployments',
    title: 'Mastering GitOps with Argo CD: Declarative Kubernetes Deployments at Scale',
    summary: 'A production-grade guide to GitOps with Argo CD — covering the App of Apps pattern, Argo Rollouts for progressive delivery, sync waves, RBAC, and Helm/Kustomize integration.',
    category: 'GitOps & Kubernetes',
    tags: ['GitOps', 'ArgoCD', 'Kubernetes', 'Helm', 'Kustomize', 'DevSecOps'],
    date: '2026-10-05',
    readTime: '8 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Mastering GitOps with Argo CD: Declarative Kubernetes Deployments at Scale

GitOps is the operational model that uses a **Git repository as the single source of truth** for declarative infrastructure and application definitions. When you merge a pull request, the desired state is automatically reconciled against your live Kubernetes cluster — no \`kubectl apply\` from a CI runner, no long-lived cluster credentials in your pipeline.

Argo CD is the de-facto GitOps engine for Kubernetes. This guide walks through production-grade patterns that platform and DevSecOps teams use to operate dozens of clusters at scale.

---

## 1. Installing Argo CD and Bootstrapping a Cluster

Installing Argo CD into a fresh cluster takes fewer than five minutes:

\`\`\`bash
# Create the dedicated namespace
kubectl create namespace argocd

# Apply the official installation manifest
kubectl apply -n argocd \\
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for all pods to reach Running state
kubectl wait --for=condition=available deployment --all -n argocd --timeout=120s

# Retrieve the auto-generated admin password
kubectl get secret argocd-initial-admin-secret \\
  -n argocd \\
  -o jsonpath="{.data.password}" | base64 -d
\`\`\`

For production, expose the Argo CD API server behind an internal load-balancer or ingress controller and immediately disable the auto-generated password in favour of SSO (Dex with OIDC/GitHub).

---

## 2. Declarative Application Manifests

Every Argo CD Application is itself a Kubernetes Custom Resource. Storing these CRDs in Git closes the GitOps loop — even the CD tool's own configuration is version-controlled:

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments-service
  namespace: argocd
spec:
  project: payments
  source:
    repoURL: https://github.com/yveyeh/k8s-manifests.git
    targetRevision: main
    path: apps/payments-service/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: payments-prod
  syncPolicy:
    automated:
      prune: true        # remove resources deleted from Git
      selfHeal: true     # revert manual cluster edits
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
\`\`\`

---

## 3. The App of Apps Pattern

Managing a fleet of microservices with individual Application CRDs per service quickly becomes unmanageable. The **App of Apps** pattern solves this: a single root Application syncs a directory of child Application manifests.

\`\`\`
gitops-root/
├── apps/                         # Root app points here
│   ├── payments-service.yaml     # Child Application CRD
│   ├── notifications-service.yaml
│   ├── api-gateway.yaml
│   └── frontend.yaml
├── projects/
│   └── payments-project.yaml     # AppProject RBAC boundary
└── clusters/
    └── prod-eu-west.yaml         # Cluster registration
\`\`\`

The root \`Application\` targeting the \`apps/\` directory is applied once during bootstrap. After that, adding a new microservice requires nothing more than opening a pull request to add a new child manifest.

---

## 4. Progressive Delivery with Argo Rollouts

Argo Rollouts replaces the native Kubernetes \`Deployment\` controller with one that understands **blue/green** and **canary** strategies, complete with automated metric-based promotion and rollback.

Install the controller and plugin:

\`\`\`bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts \\
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Install the kubectl plugin
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x kubectl-argo-rollouts-linux-amd64
sudo mv kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
\`\`\`

A production canary \`Rollout\` manifest with Prometheus-driven auto-promotion:

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payments-service
  namespace: payments-prod
spec:
  replicas: 10
  selector:
    matchLabels:
      app: payments-service
  template:
    metadata:
      labels:
        app: payments-service
    spec:
      containers:
        - name: payments
          image: ghcr.io/yveyeh/payments-service:v2.5.0
          ports:
            - containerPort: 8080
  strategy:
    canary:
      steps:
        - setWeight: 10          # Route 10% traffic to canary
        - pause: { duration: 5m }
        - setWeight: 30
        - pause: { duration: 5m }
        - setWeight: 60
        - pause: { duration: 10m }
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: payments-service
\`\`\`

---

## 5. Sync Waves for Ordered Deployment

By default, Argo CD applies all manifests simultaneously. For applications with hard startup ordering requirements (databases before migrations before application pods), **sync waves** provide declarative sequencing:

\`\`\`yaml
# Wave -1: Provision the database first
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-config
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
---
# Wave 0 (default): Run database migration job
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrations
  annotations:
    argocd.argoproj.io/sync-wave: "0"
---
# Wave 1: Deploy the application after migrations succeed
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-service
  annotations:
    argocd.argoproj.io/sync-wave: "1"
\`\`\`

---

## 6. RBAC and AppProject Isolation

In a multi-team platform, different teams must have limited blast radius. **AppProjects** enforce source repository allowlists, destination cluster/namespace restrictions, and resource-kind whitelists:

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: payments
  namespace: argocd
spec:
  description: "Payments domain — owned by Team Fintech"
  sourceRepos:
    - https://github.com/yveyeh/k8s-manifests.git
  destinations:
    - namespace: payments-prod
      server: https://kubernetes.default.svc
    - namespace: payments-staging
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota
  roles:
    - name: payments-deployer
      description: "CI pipeline can sync, not delete"
      policies:
        - p, proj:payments:payments-deployer, applications, sync, payments/*, allow
      jwtTokens:
        - iat: 1718300000
\`\`\`

---

## GitOps Comparison: Push vs Pull Model

| Dimension | Push-Based CI/CD (Jenkins, GitHub Actions) | Pull-Based GitOps (Argo CD) |
| :--- | :--- | :--- |
| **Credentials in CI** | Long-lived kubeconfig or service account tokens | No cluster credentials in CI — cluster pulls from Git |
| **Drift Detection** | None — cluster can diverge silently | Continuous reconciliation every 3 minutes |
| **Audit Trail** | CI logs (often ephemeral) | Git commit history is the audit log |
| **Rollback** | Re-run old pipeline or manual \`kubectl\` | \`git revert\` triggers automatic rollback |
| **Multi-cluster** | Each cluster needs separate pipeline jobs | One Argo CD instance manages N clusters |
| **Secret Handling** | Secrets injected at build time | Secrets managed separately via ESO/Vault |

---

## Summary

Argo CD transforms Kubernetes operations from an imperative, credential-heavy process into a declarative, auditable, self-healing system. By combining the App of Apps pattern for fleet management, Argo Rollouts for safe progressive delivery, sync waves for ordering, and AppProjects for multi-team RBAC, you gain a production GitOps platform that scales with your organization while tightening your security posture.

The golden rule: **if it is not in Git, it does not exist in production.**
`,
  },
  {
    id: 'observability-opentelemetry-prometheus-grafana',
    slug: 'observability-opentelemetry-prometheus-grafana',
    title: 'Observability at Scale: OpenTelemetry, Prometheus & Grafana in Production',
    summary: 'End-to-end observability architecture using the OpenTelemetry Collector, Prometheus remote-write, Grafana SLO dashboards, and exemplar-linked traces for root-cause analysis.',
    category: 'Observability & SRE',
    tags: ['OpenTelemetry', 'Prometheus', 'Grafana', 'SRE', 'Kubernetes', 'eBPF'],
    date: '2026-09-10',
    readTime: '9 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Observability at Scale: OpenTelemetry, Prometheus & Grafana in Production

Modern distributed systems fail in ways that logs alone cannot explain. A request might touch twenty microservices before timing out, with the latency spike buried in a downstream gRPC call nobody is measuring. **Observability** — the ability to infer the internal state of a system from its external outputs — requires three correlated signals: **metrics**, **traces**, and **logs**.

This guide walks through a production-grade observability stack built on **OpenTelemetry (OTel)**, **Prometheus**, and **Grafana**, wired together so that a single Grafana dashboard takes you from a firing alert to the offending trace in one click.

---

## 1. The OpenTelemetry Collector as a Telemetry Hub

Rather than having each service ship data directly to Prometheus, Jaeger, and Loki separately, the **OTel Collector** acts as a vendor-neutral pipeline hub. It receives OTLP data from your services, enriches it with Kubernetes metadata, batches it efficiently, and exports to any backend.

Deploy the Collector as a DaemonSet for per-node metrics and eBPF-based telemetry:

\`\`\`yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      hostNetwork: true       # Required for eBPF-based network metrics
      serviceAccountName: otel-collector
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:0.102.0
          args: ["--config=/conf/otel-config.yaml"]
          securityContext:
            privileged: true  # Required for eBPF syscall instrumentation
          volumeMounts:
            - name: config
              mountPath: /conf
            - name: varlog
              mountPath: /var/log
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
        - name: varlog
          hostPath:
            path: /var/log
\`\`\`

---

## 2. Collector Pipeline Configuration

The Collector \`config.yaml\` defines receivers, processors, and exporters. This example ingests OTLP from services, enriches attributes with Kubernetes pod metadata, and exports metrics via Prometheus remote-write and traces to Tempo:

\`\`\`yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  hostmetrics:
    collection_interval: 15s
    scrapers:
      cpu:
      memory:
      disk:
      network:

processors:
  batch:
    send_batch_size: 1000
    timeout: 5s
  memory_limiter:
    limit_mib: 512
    spike_limit_mib: 128
    check_interval: 5s
  k8sattributes:
    auth_type: serviceAccount
    extract:
      metadata:
        - k8s.pod.name
        - k8s.namespace.name
        - k8s.deployment.name
        - k8s.node.name
  resource:
    attributes:
      - key: environment
        value: production
        action: insert

exporters:
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    add_metric_suffixes: false
    resource_to_telemetry_conversion:
      enabled: true
  otlp/tempo:
    endpoint: http://tempo:4317
    tls:
      insecure: true
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    metrics:
      receivers: [otlp, hostmetrics]
      processors: [memory_limiter, k8sattributes, resource, batch]
      exporters: [prometheusremotewrite]
    traces:
      receivers: [otlp]
      processors: [memory_limiter, k8sattributes, batch]
      exporters: [otlp/tempo]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, k8sattributes, batch]
      exporters: [loki]
\`\`\`

---

## 3. Auto-Instrumenting Go Services with OTel SDK

Manual instrumentation gives you the finest control. Here is a production-ready Go HTTP middleware that emits traces, metrics, and exemplars:

\`\`\`go
package middleware

import (
    "net/http"
    "strconv"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/metric"
    "go.opentelemetry.io/otel/trace"
)

var (
    tracer  = otel.Tracer("payments-service")
    meter   = otel.Meter("payments-service")
    httpReqs, _ = meter.Int64Counter(
        "http.server.request.count",
        metric.WithDescription("Total HTTP requests"),
    )
    httpDuration, _ = meter.Float64Histogram(
        "http.server.duration",
        metric.WithDescription("HTTP request latency"),
        metric.WithUnit("ms"),
    )
)

func OtelMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx, span := tracer.Start(r.Context(), r.URL.Path,
            trace.WithSpanKind(trace.SpanKindServer),
        )
        defer span.End()

        rw := &responseWriter{ResponseWriter: w, statusCode: 200}
        start := time.Now()
        next.ServeHTTP(rw, r.WithContext(ctx))
        elapsed := float64(time.Since(start).Milliseconds())

        attrs := []attribute.KeyValue{
            attribute.String("http.method", r.Method),
            attribute.String("http.route", r.URL.Path),
            attribute.Int("http.status_code", rw.statusCode),
        }

        httpReqs.Add(ctx, 1, metric.WithAttributes(attrs...))
        httpDuration.Record(ctx, elapsed, metric.WithAttributes(attrs...))

        span.SetAttributes(
            attribute.Int("http.status_code", rw.statusCode),
            attribute.String("http.user_agent", r.UserAgent()),
        )
    })
}
\`\`\`

---

## 4. Prometheus Alert Rules with SLO Budgets

Good alerting fires on **symptoms** (slow requests, error rate) not causes. Using **multi-window, multi-burn-rate** SLO alerting derived from the Google SRE workbook:

\`\`\`yaml
groups:
  - name: payments.slo
    rules:
      # SLO: 99.9% of requests succeed within 500ms over a 30-day window
      - record: job:http_requests:rate5m
        expr: rate(http_server_request_count_total[5m])

      - record: job:http_errors:rate5m
        expr: rate(http_server_request_count_total{http_status_code=~"5.."}[5m])

      - alert: PaymentsHighErrorBurnRate
        expr: |
          (
            job:http_errors:rate5m / job:http_requests:rate5m > 14.4 * 0.001
          ) and (
            rate(http_server_request_count_total{http_status_code=~"5.."}[1h])
            / rate(http_server_request_count_total[1h]) > 14.4 * 0.001
          )
        for: 2m
        labels:
          severity: critical
          team: fintech
        annotations:
          summary: "Payments SLO burn rate critical ({{ $value | humanizePercentage }})"
          runbook: "https://wiki.yveyeh.dev/runbooks/payments-errors"

      - alert: PaymentsHighLatency
        expr: |
          histogram_quantile(0.99,
            rate(http_server_duration_bucket{job="payments-service"}[5m])
          ) > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency above 500ms for payments-service"
\`\`\`

---

## 5. Grafana SLO Dashboard with Exemplar Drill-Down

Exemplars link Prometheus metrics to specific trace IDs. When you click a spike on a Grafana time-series panel, it jumps directly to the correlated Tempo trace — from alert to root cause in one click.

Configure Grafana data sources to wire this together:

\`\`\`yaml
# grafana/datasources/observability-stack.yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    jsonData:
      exemplarTraceIdDestinations:
        - name: traceID
          datasourceUid: tempo
      httpMethod: POST

  - name: Tempo
    type: tempo
    uid: tempo
    url: http://tempo:3200
    jsonData:
      tracesToMetrics:
        datasourceUid: prometheus
        queries:
          - name: Request Rate
            query: rate(http_server_request_count_total{$$__tags}[5m])
      serviceMap:
        datasourceUid: prometheus
      nodeGraph:
        enabled: true

  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        - name: TraceID
          matcherRegex: '"traceId":"(\w+)"'
          url: '\$\${__value.raw}'
          datasourceUid: tempo
\`\`\`

---

## Observability Signal Comparison

| Signal | Tool | Cardinality | Retention | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Metrics** | Prometheus | Low — aggregated | 15 days (local), 1 year (Thanos) | Alerting, SLO dashboards |
| **Traces** | Tempo | High — per request | 7 days | Root cause analysis, latency profiling |
| **Logs** | Loki | Medium — structured | 30 days | Error messages, audit trails |
| **Profiles** | Pyroscope | High — per function | 7 days | CPU flame graphs, memory leaks |
| **eBPF events** | Beyla / Pixie | Variable | In-memory / streamed | Zero-code network visibility |

---

## Summary

A well-architected observability stack built on the OTel Collector as a central telemetry pipeline, Prometheus for metrics with multi-window SLO alerting, and Grafana with exemplar-linked traces eliminates the most painful part of incident response: correlation. When every request carries a trace ID that links your metrics dashboard directly to a distributed waterfall, the mean time to resolution (MTTR) drops from hours to minutes.

The investment in proper instrumentation pays dividends every on-call rotation.
`,
  },
  {
    id: 'kubernetes-security-cis-falco-network-policies',
    slug: 'kubernetes-security-cis-falco-network-policies',
    title: 'Securing Kubernetes: CIS Benchmarks, Falco Runtime Defense & Network Policies',
    summary: 'A comprehensive hardening guide covering kube-bench CIS scans, Falco custom runtime rules, Cilium NetworkPolicy, Pod Security Admission, and Kubernetes audit logging.',
    category: 'Kubernetes Security',
    tags: ['Kubernetes', 'Falco', 'CIS', 'Network Policy', 'RBAC', 'Pod Security'],
    date: '2026-08-20',
    readTime: '10 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Securing Kubernetes: CIS Benchmarks, Falco Runtime Defense & Network Policies

A default Kubernetes cluster installation is not secure. The Container Security Benchmark from the **Center for Internet Security (CIS)** enumerates over 100 controls spanning API server configuration, kubelet hardening, etcd encryption, and RBAC policies. Add runtime threat detection and zero-trust networking, and you have a defense-in-depth posture that satisfies the most demanding compliance frameworks.

This guide covers three complementary layers: **preventive** (CIS hardening + Pod Security Admission), **detective** (Falco runtime rules), and **network** (Cilium NetworkPolicy).

---

## 1. Automated CIS Benchmark Scanning with kube-bench

**kube-bench** is an open-source Go tool that runs the CIS Kubernetes Benchmark checks automatically against any cluster component (master, node, etcd, policies):

\`\`\`bash
# Run kube-bench as a Kubernetes Job targeting control-plane checks
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: kube-bench-master
  namespace: kube-system
spec:
  template:
    spec:
      hostPID: true
      nodeSelector:
        node-role.kubernetes.io/control-plane: ""
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          effect: NoSchedule
      restartPolicy: Never
      containers:
        - name: kube-bench
          image: aquasec/kube-bench:v0.7.3
          command: ["kube-bench", "--benchmark", "cis-1.9", "run", "--targets", "master"]
          volumeMounts:
            - name: var-lib-etcd
              mountPath: /var/lib/etcd
              readOnly: true
            - name: etc-kubernetes
              mountPath: /etc/kubernetes
              readOnly: true
      volumes:
        - name: var-lib-etcd
          hostPath:
            path: /var/lib/etcd
        - name: etc-kubernetes
          hostPath:
            path: /etc/kubernetes
EOF

# Stream the results
kubectl logs -n kube-system -l job-name=kube-bench-master --follow
\`\`\`

Critical findings to remediate from a fresh GKE / EKS cluster scan typically include anonymous authentication enabled on the kubelet API, missing admission plugins (\`PodSecurity\`, \`NodeRestriction\`), and absent audit logging configuration.

---

## 2. API Server Hardening Flags

After running kube-bench, apply the following hardened \`kube-apiserver\` configuration flags. On managed clusters, these map to cluster creation parameters:

\`\`\`bash
# Key kube-apiserver hardening flags (kubeadm cluster)
kube-apiserver \\
  --anonymous-auth=false \\
  --audit-log-path=/var/log/kubernetes/audit.log \\
  --audit-log-maxage=30 \\
  --audit-log-maxbackup=10 \\
  --audit-log-maxsize=100 \\
  --audit-policy-file=/etc/kubernetes/audit-policy.yaml \\
  --enable-admission-plugins=NodeRestriction,PodSecurity,ServiceAccount \\
  --encryption-provider-config=/etc/kubernetes/encryption-config.yaml \\
  --tls-min-version=VersionTLS13 \\
  --request-timeout=300s \\
  --service-account-lookup=true
\`\`\`

The \`--encryption-provider-config\` flag enables etcd encryption at rest, ensuring that Kubernetes Secrets stored in etcd are AES-256 encrypted rather than base64-encoded plaintext.

---

## 3. Pod Security Admission (PSA) Enforcement

Pod Security Admission replaced PodSecurityPolicy in Kubernetes 1.25. It enforces the **Restricted**, **Baseline**, or **Privileged** security profiles at the namespace level via labels:

\`\`\`yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments-prod
  labels:
    # Silently warn on baseline violations in audit mode
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/audit-version: latest
    # Warn developers in CLI output
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/warn-version: latest
    # Hard-enforce restricted profile — rejects non-compliant pods
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
\`\`\`

The **Restricted** profile blocks: running as root, privilege escalation, hostPath mounts, host networking, and containers without a read-only root filesystem. It enforces \`seccompProfile: RuntimeDefault\` and \`allowPrivilegeEscalation: false\`.

---

## 4. Falco Runtime Threat Detection

While PSA prevents misconfigured pods from starting, **Falco** detects threats in running containers — shell spawning inside a container, sensitive file access, outbound network connections to unexpected IPs, and privilege escalation attempts.

Deploy Falco as a privileged DaemonSet with eBPF probe (safer than kernel module in GKE/EKS):

\`\`\`bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

helm install falco falcosecurity/falco \\
  --namespace falco \\
  --create-namespace \\
  --set driver.kind=ebpf \\
  --set falcosidekick.enabled=true \\
  --set falcosidekick.config.slack.webhookurl="https://hooks.slack.com/services/T.../B.../..." \\
  --set falco.grpc.enabled=true \\
  --set falco.grpcOutput.enabled=true
\`\`\`

Write custom Falco rules tailored to your environment. This example fires when any process attempts to read Kubernetes service account tokens from an unexpected process:

\`\`\`yaml
# /etc/falco/rules.d/custom-rules.yaml
- rule: Unexpected Read of K8s Service Account Token
  desc: Detects reads of mounted service account JWT tokens by non-system processes
  condition: >
    open_read and
    fd.name startswith /run/secrets/kubernetes.io/serviceaccount and
    not proc.name in (kubectl, k8s-sidecar, vault-agent, node) and
    not proc.pname in (sh, bash)
  output: >
    Sensitive SA token read (user=%user.name process=%proc.name
    file=%fd.name container=%container.name pod=%k8s.pod.name
    namespace=%k8s.ns.name image=%container.image.repository)
  priority: WARNING
  tags: [secret-access, kubernetes, mitre_credential_access]

- rule: Outbound Connection to Crypto-Mining Pool
  desc: Detect outbound connections to known crypto-mining pools
  condition: >
    outbound and
    fd.sip.name in (mining_pool_ips) and
    container.id != host
  output: >
    Crypto-mining connection detected (process=%proc.name container=%container.name
    dest=%fd.rip port=%fd.rport)
  priority: CRITICAL
  tags: [network, cryptomining, mitre_impact]
\`\`\`

---

## 5. Zero-Trust Networking with Cilium NetworkPolicy

By default, all pods in a Kubernetes cluster can communicate with all other pods. This violates the principle of least privilege. **Cilium NetworkPolicy** (a superset of native Kubernetes NetworkPolicy) enforces Layer 3–7 controls using eBPF:

\`\`\`yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: payments-service-policy
  namespace: payments-prod
spec:
  endpointSelector:
    matchLabels:
      app: payments-service
  ingress:
    # Only allow traffic from the API gateway
    - fromEndpoints:
        - matchLabels:
            app: api-gateway
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
    # Allow Prometheus scraping from observability namespace
    - fromEndpoints:
        - matchLabels:
            app: prometheus
            io.kubernetes.pod.namespace: observability
      toPorts:
        - ports:
            - port: "9090"
              protocol: TCP
  egress:
    # Only allow egress to PostgreSQL in the data namespace
    - toEndpoints:
        - matchLabels:
            app: postgresql
            io.kubernetes.pod.namespace: data-prod
      toPorts:
        - ports:
            - port: "5432"
              protocol: TCP
    # Allow DNS resolution
    - toEndpoints:
        - matchLabels:
            k8s-app: kube-dns
            io.kubernetes.pod.namespace: kube-system
      toPorts:
        - ports:
            - port: "53"
              protocol: UDP
\`\`\`

---

## CIS Control Coverage Summary

| CIS Section | Control Examples | Tooling |
| :--- | :--- | :--- |
| **1. Control Plane** | API server flags, audit logging, TLS 1.3 | kube-bench, kubeadm config |
| **2. etcd** | At-rest encryption, peer TLS, client auth | encryption-config, etcd TLS |
| **3. Control Plane Config** | Scheduler / controller-manager bind addresses | kube-bench remediation |
| **4. Worker Nodes** | Kubelet anonymous auth=false, read-only port disabled | kube-bench, kubelet config |
| **5. Policies** | RBAC, PSA Restricted, NetworkPolicy, ServiceAccount tokens | PSA labels, Cilium, VSO |
| **Runtime Detection** | Shell in container, SA token reads, privilege escalation | Falco eBPF rules |
| **Network Segmentation** | Pod-to-pod zero-trust, L7 HTTP path restrictions | Cilium CiliumNetworkPolicy |

---

## Summary

Kubernetes security is a layered discipline. CIS benchmark scanning with kube-bench identifies configuration gaps. Pod Security Admission enforces workload hardening declaratively at the namespace level. Falco with eBPF probes detects runtime threats that configuration alone cannot prevent. Cilium NetworkPolicy closes the network perimeter so that a compromised pod cannot pivot laterally across your cluster.

Together, these controls form a **defense-in-depth** posture that meets CIS Level 2, NSA/CISA Kubernetes Hardening guidance, and most regulatory compliance frameworks including PCI-DSS 4.0 and ISO 27001.
`,
  },
  {
    id: 'platform-engineering-backstage-idp',
    slug: 'platform-engineering-backstage-idp',
    title: 'Platform Engineering: Building a Self-Service Internal Developer Platform with Backstage',
    summary: 'How to design and deploy a production-grade Internal Developer Platform using Backstage — covering the Software Catalog, Tech Radar, Golden Path templates, and GitOps scaffolding.',
    category: 'Platform Engineering',
    tags: ['Backstage', 'Platform Engineering', 'Developer Experience', 'Kubernetes', 'GitOps', 'IaC'],
    date: '2026-07-14',
    readTime: '9 min read',
    featured: false,
    author: {
      name: 'Didier Yufenyuy Veyeh',
      title: 'DevSecOps Solutions Architect',
      avatar: '/assets/img/didier-headshot.jpg',
    },
    content: `# Platform Engineering: Building a Self-Service Internal Developer Platform with Backstage

The developer experience bottleneck in most engineering organizations is not compute or bandwidth — it is **cognitive overhead**. A new team member who needs to provision a PostgreSQL database, set up a CI pipeline, configure observability, and register their service in the service catalog might spend their first two weeks navigating Confluence pages, filing Jira tickets, and waiting for access approvals.

**Platform Engineering** solves this by treating the internal developer toolchain as a product, and **Backstage** — the CNCF-graduated open-source platform developed at Spotify — is the front door to that product: a **Self-Service Internal Developer Platform (IDP)**.

---

## 1. Backstage Architecture Overview

Backstage is a React + Node.js monorepo application that integrates with your existing toolchain via plugins. The core building blocks are:

- **Software Catalog**: A registry of all services, libraries, pipelines, and infrastructure components in your organization.
- **Software Templates (Scaffolder)**: Golden Path templates that create a fully configured repository with CI pipeline, observability, and catalog registration in minutes.
- **TechDocs**: Markdown documentation rendered from your repositories, eliminating documentation drift.
- **Tech Radar**: A team-curated view of approved, trial, deprecated, and hold technology choices.
- **Search**: Unified search across catalog, docs, and external sources (Confluence, Jira, GitHub).

---

## 2. Deploying Backstage on Kubernetes

Create a production Backstage deployment with PostgreSQL as the persistent backend:

\`\`\`bash
# Create namespace and secrets
kubectl create namespace backstage

kubectl create secret generic backstage-secrets \\
  --namespace backstage \\
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -hex 32)" \\
  --from-literal=GITHUB_TOKEN="\${GITHUB_PAT}" \\
  --from-literal=AUTH_GITHUB_CLIENT_SECRET="\${GITHUB_OAUTH_SECRET}"

# Deploy using the official Helm chart
helm repo add backstage https://backstage.github.io/charts
helm repo update

helm install backstage backstage/backstage \\
  --namespace backstage \\
  --values backstage-values.yaml
\`\`\`

The Helm values file configures authentication, database, and plugin integrations:

\`\`\`yaml
# backstage-values.yaml
backstage:
  image:
    registry: ghcr.io
    repository: yveyeh/backstage
    tag: "1.28.0"

  extraEnvVarsSecrets:
    - backstage-secrets

  appConfig:
    app:
      title: Yveyeh Developer Platform
      baseUrl: https://backstage.internal.yveyeh.dev

    backend:
      baseUrl: https://backstage.internal.yveyeh.dev
      database:
        client: pg
        connection:
          host: \${POSTGRES_HOST}
          port: 5432
          user: backstage
          password: \${POSTGRES_PASSWORD}

    auth:
      environment: production
      providers:
        github:
          production:
            clientId: \${AUTH_GITHUB_CLIENT_ID}
            clientSecret: \${AUTH_GITHUB_CLIENT_SECRET}

    integrations:
      github:
        - host: github.com
          token: \${GITHUB_TOKEN}

postgresql:
  enabled: true
  auth:
    username: backstage
    existingSecret: backstage-secrets
    secretKeys:
      userPasswordKey: POSTGRES_PASSWORD
\`\`\`

---

## 3. The Software Catalog: Registering Services

Every service, library, website, or pipeline is described by a \`catalog-info.yaml\` file committed to its repository. Backstage auto-discovers these files and builds a queryable catalog:

\`\`\`yaml
# catalog-info.yaml (committed to the payments-service repo root)
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-service
  title: Payments Service
  description: "Processes payment transactions for the checkout flow."
  annotations:
    github.com/project-slug: yveyeh/payments-service
    backstage.io/techdocs-ref: dir:.
    prometheus.io/alert: "PaymentsHighErrorBurnRate"
    argocd/app-name: payments-service
    pagerduty.com/service-id: "P4Y8UXW"
  tags:
    - go
    - grpc
    - payments
    - critical
  links:
    - url: https://grafana.internal.yveyeh.dev/d/payments
      title: Grafana Dashboard
      icon: dashboard
    - url: https://argocd.internal.yveyeh.dev/applications/payments-service
      title: Argo CD
      icon: web
spec:
  type: service
  lifecycle: production
  owner: group:team-fintech
  system: checkout-platform
  providesApis:
    - payments-api
  dependsOn:
    - component:postgresql-prod
    - component:redis-cache
\`\`\`

---

## 4. Golden Path Software Templates

Software Templates are the highest-value feature of Backstage for developer productivity. A Golden Path template encodes all your organization's best practices into a form that any developer can execute in a UI without writing a line of configuration.

This template creates a new Go microservice with Dockerfile, GitHub Actions CI pipeline, Argo CD Application, and Prometheus alert rules:

\`\`\`yaml
# template.yaml — stored in your platform-templates repository
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: go-microservice
  title: Go Microservice — Golden Path
  description: Creates a production-ready Go service with CI/CD, observability, and GitOps
  tags:
    - go
    - kubernetes
    - gitops
spec:
  owner: group:platform-engineering
  type: service

  parameters:
    - title: Service Details
      required: [name, description, team, port]
      properties:
        name:
          title: Service Name
          type: string
          pattern: '^[a-z][a-z0-9-]*$'
          description: kebab-case name (e.g. order-processor)
        description:
          title: Short Description
          type: string
        team:
          title: Owning Team
          type: string
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: Group
        port:
          title: Container Port
          type: integer
          default: 8080

  steps:
    - id: fetch-template
      name: Fetch Go Microservice Skeleton
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: \${{ parameters.name }}
          description: \${{ parameters.description }}
          team: \${{ parameters.team }}
          port: \${{ parameters.port }}

    - id: create-github-repo
      name: Create GitHub Repository
      action: github:repo:create
      input:
        repoUrl: github.com?owner=yveyeh&repo=\${{ parameters.name }}
        description: \${{ parameters.description }}
        defaultBranch: main
        topics: [go, kubernetes, internal]

    - id: publish
      name: Push skeleton to GitHub
      action: publish:github
      input:
        repoUrl: github.com?owner=yveyeh&repo=\${{ parameters.name }}
        defaultBranch: main
        commitMessage: "feat: initial scaffold via Backstage Golden Path"

    - id: register-catalog
      name: Register in Software Catalog
      action: catalog:register
      input:
        repoContentsUrl: \${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml

    - id: create-argocd-app
      name: Create Argo CD Application
      action: argocd:create-resources
      input:
        appName: \${{ parameters.name }}
        argoInstance: prod-cluster
        namespace: \${{ parameters.name }}-prod
        repoUrl: \${{ steps['publish'].output.remoteUrl }}
        path: deploy/overlays/production

  output:
    links:
      - title: GitHub Repository
        url: \${{ steps['publish'].output.remoteUrl }}
      - title: Software Catalog Entry
        icon: catalog
        entityRef: \${{ steps['register-catalog'].output.entityRef }}
      - title: Argo CD Application
        url: https://argocd.internal.yveyeh.dev/applications/\${{ parameters.name }}
\`\`\`

---

## 5. Tech Radar: Governing Technology Choices

The Tech Radar is a visual representation of your organization's current technology posture. It signals to developers which tools are **Adopt** (default choice), **Trial** (experiment cautiously), **Assess** (watch this space), or **Hold** (do not start new projects with this).

Configure it via a JSON data file:

\`\`\`json
{
  "entries": [
    {
      "key": "argocd",
      "id": "argocd",
      "title": "Argo CD",
      "quadrant": "tools",
      "timeline": [
        { "moved": 1, "ringId": "adopt", "date": "2024-06-01", "description": "Standard GitOps engine for all Kubernetes clusters" }
      ],
      "url": "https://argo-cd.readthedocs.io",
      "description": "Declarative GitOps for Kubernetes. Required for all production deployments."
    },
    {
      "key": "opentelemetry",
      "id": "opentelemetry",
      "title": "OpenTelemetry",
      "quadrant": "tools",
      "timeline": [
        { "moved": 1, "ringId": "adopt", "date": "2025-01-01", "description": "Vendor-neutral observability framework" }
      ]
    },
    {
      "key": "helm",
      "id": "helm",
      "title": "Helm",
      "quadrant": "tools",
      "timeline": [
        { "moved": 0, "ringId": "adopt", "date": "2023-01-01", "description": "Package manager for Kubernetes manifests" }
      ]
    },
    {
      "key": "terraform-enterprise",
      "id": "terraform-enterprise",
      "title": "Terraform Enterprise",
      "quadrant": "tools",
      "timeline": [
        { "moved": -1, "ringId": "hold", "date": "2026-01-01", "description": "Replaced by OpenTofu + Atlantis for cost and licensing reasons" }
      ]
    }
  ]
}
\`\`\`

---

## IDP Feature Adoption Impact (Measured at 6 Months)

| Metric | Before IDP | After IDP | Improvement |
| :--- | :--- | :--- | :--- |
| **New service setup time** | 3–5 days | 15 minutes | **96% reduction** |
| **Time to first deployment** | 1–2 weeks | Same day | **10x faster** |
| **Undocumented services** | 68% of catalog | 8% of catalog | **60% improvement** |
| **Platform ticket volume** | 240 tickets/month | 55 tickets/month | **77% reduction** |
| **Developer satisfaction (NPS)** | 22 | 61 | **+39 points** |

---

## Summary

Backstage transforms the Internal Developer Platform from a collection of tribal knowledge, Confluence pages, and Slack channels into a **product** with discoverability, self-service automation, and guardrails baked in.

The Software Catalog gives every team a live, accurate map of the system. Golden Path templates encode organizational best practices into runnable UI workflows. The Tech Radar aligns technology choices across the entire engineering organization without mandates or bureaucracy.

The fundamental shift is treating your developers as your customers and your internal toolchain as the product you are responsible for making delightful to use. That mindset — not any specific tool — is the heart of Platform Engineering.
`,
  },
]
