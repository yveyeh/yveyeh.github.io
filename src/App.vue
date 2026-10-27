<script setup>
/**
 * @author Yufenyuy Veyeh Didier <https://yveyeh.github.io>
 * @copyright © 2021. Tenshnova (https://www.tenshnova.com)
 * @license - See the link (https://github.com/yveyeh/yveyeh.github.io/blob/master/LICENSE)
 * @version 3.0
 */
// import { faGithub } from '@fortawesome/free-brands-svg-icons'
import BrandIcon from './components/BrandIcon.vue'
import AppsLauncher from './components/AppsLauncher.vue'
</script>

<template>
  <div class="relative min-h-dvh overflow-hidden bg-navy-900 bg-[url(/assets/img/bg-mobile-fallback.jpg)] bg-cover bg-center font-sans text-white antialiased">
    <!-- Background video (hidden on touch devices, which use the fallback image) -->
    <video
      class="fixed top-1/2 left-1/2 z-0 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover pointer-coarse:hidden"
      playsinline
      autoplay
      muted
      loop
      aria-hidden="true"
    >
      <source src="/assets/video/bg.mp4" type="video/mp4" />
    </video>
    <div class="fixed inset-0 z-[1] bg-umber/70" aria-hidden="true" />

    <AppsLauncher />

    <!-- Masthead -->
    <main class="relative z-[2] flex min-h-dvh items-center md:w-[44rem] lg:w-[46rem]">
      <!-- Skewed panel -->
      <div
        class="absolute inset-0 -skew-y-0 bg-linear-to-br from-navy-800/90 to-navy-900/85 shadow-2xl shadow-black/40 backdrop-blur-[2px] md:origin-top-right md:-skew-x-[8deg]"
        aria-hidden="true"
      />

      <section
        class="relative w-full px-6 py-20 transition duration-700 ease-out starting:translate-y-4 starting:opacity-0 sm:px-10 md:py-12 md:pr-32 md:pl-14"
      >
        <!-- Profile Headshot & Status -->
        <div class="mb-6 flex items-center gap-4">
          <div class="relative group">
            <div class="absolute -inset-1 rounded-full bg-linear-to-r from-gold-300 via-gold-400 to-gold-500 opacity-75 blur-sm transition duration-500 group-hover:opacity-100 animate-pulse"></div>
            <img
              src="/assets/img/didier-headshot.jpg"
              alt="Yufenyuy Veyeh Didier"
              class="relative size-20 sm:size-24 rounded-full object-cover border-2 border-gold-300 shadow-xl"
            />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-sm">
                <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Available for Projects
              </span>
            </div>
            <p class="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">DevSecOps Solutions Architect</p>
          </div>
        </div>

        <h1 class="mb-3 flex items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome!
          <!-- <BrandIcon :icon="faGithub" class="size-9 text-white/90 sm:size-10 md:size-12" /> -->
        </h1>

        <p class="mb-4 text-lg font-light md:text-xl">
          I'm <strong class="font-semibold text-white">Yufenyuy Veyeh Didier</strong>, but call me
          <span class="ml-1 inline-block rounded-full bg-gold-400 px-3 py-0.5 text-sm font-semibold tracking-wide text-navy-900 shadow-md shadow-gold-500/30">Didi</span>
        </p>

        <p class="mb-8 max-w-lg text-base sm:text-lg leading-relaxed font-light text-white/90">
          Welcome to my digital space. I am a DevSecOps Solutions Architect dedicated to engineering secure-by-design cloud infrastructure, automated CI/CD security pipelines, and resilient software systems. Explore my open-source projects, architecture blueprints, and technical publications.
        </p>

        <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <a
            id="browse-code-btn"
            href="https://github.com/yveyeh?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-gold-300 to-gold-500 px-7 py-3 text-sm font-semibold tracking-[0.15em] text-navy-900 uppercase shadow-lg shadow-gold-500/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gold-500/40 focus-visible:ring-4 focus-visible:ring-gold-300/60 focus-visible:outline-none active:translate-y-0"
          >
            Browse My Code
          </a>
          <a
            id="visit-blog-btn"
            href="https://yveyeh.wordpress.com"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gold-400 px-7 py-3 text-sm font-semibold tracking-[0.15em] text-gold-400 uppercase backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-gold-400 hover:text-navy-900 focus-visible:ring-4 focus-visible:ring-gold-300/60 focus-visible:outline-none active:translate-y-0"
          >
            Explore My Blog
          </a>
        </div>
      </section>
    </main>
  </div>
</template>
