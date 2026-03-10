<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

definePageMeta({ layout: 'blank' })

const db = useDatabase()
const { set } = useAppSettings()
const { requestPermission } = useNotifications()
const router = useRouter()

// ── Step state ──────────────────────────────────────────────────────────────
// 0=welcome, 1=tier, 2=zen/power, 3=notifications, 4=first-habit
const step = ref(0)

function next() {
  step.value++
}
function back() {
  step.value--
}

// ── Logo animation ───────────────────────────────────────────────────────────
const logoAnimating = ref(false)
onMounted(() => {
  logoAnimating.value = true
})
function onLogoAnimEnd() {
  logoAnimating.value = false
}
function replayLogo() {
  if (logoAnimating.value) return
  logoAnimating.value = true
}

// ── Feature tier ─────────────────────────────────────────────────────────────
const selectedTier = ref<'simple' | 'standard' | 'everything'>('standard')

const TIERS = [
  {
    id: 'simple' as const,
    icon: 'i-heroicons-list-bullet',
    title: 'Just habits',
    description: 'Track daily habits only. Simple and focused.',
  },
  {
    id: 'standard' as const,
    icon: 'i-heroicons-squares-2x2',
    title: 'Habits + tasks + notes',
    description: 'Adds TODOs, check-ins, and Jots for capturing thoughts.',
    badge: 'Recommended',
  },
  {
    id: 'everything' as const,
    icon: 'i-heroicons-bolt',
    title: 'Everything',
    description: 'Includes timer, oracle suggestions, health tracking, and context filters.',
  },
]

function applyTier() {
  if (selectedTier.value === 'simple') {
    set('enableJournalling', false)
    set('enableTodos', false)
    set('enableBored', false)
    set('enableTimer', false)
    set('enableHealth', false)
    set('enableContextFilter', false)
  } else if (selectedTier.value === 'everything') {
    set('enableJournalling', true)
    set('enableTodos', true)
    set('enableBored', true)
    set('enableTimer', true)
    set('enableHealth', true)
    set('enableContextFilter', true)
  }
  // 'standard' keeps defaults (enableJournalling+enableTodos true, rest false)
}

// ── Display presence (Zen / Power) ───────────────────────────────────────────
const selectedPresence = ref<'zen' | 'power'>('zen')

const PRESENCES = [
  {
    id: 'zen' as const,
    icon: 'i-heroicons-moon',
    title: 'Zen',
    description: 'Clean and distraction-free. Just your habits, front and centre.',
  },
  {
    id: 'power' as const,
    icon: 'i-heroicons-adjustments-horizontal',
    title: 'Power',
    description: 'For the detail-oriented. Labels, notes, and context filtering.',
  },
]

function applyPresence() {
  const on = selectedPresence.value === 'power'
  set('showTagsOnToday', on)
  set('showTagsOnHabits', on)
  set('showAnnotationsOnToday', on)
  set('showAnnotationsOnHabits', on)
}

// ── Notifications ─────────────────────────────────────────────────────────────
const requestingNotif = ref(false)
const isNative = Capacitor.isNativePlatform()

async function handleEnableNotifications() {
  requestingNotif.value = true
  try {
    await requestPermission()
  } finally {
    requestingNotif.value = false
    next()
  }
}

// ── First habit ───────────────────────────────────────────────────────────────
const habitName = ref('')
const habitSchedule = ref<'daily' | 'weekdays'>('daily')
const habitIcon = ref('i-heroicons-star')
const savingHabit = ref(false)

const HABIT_ICONS = [
  { name: 'i-heroicons-sun', label: 'Morning' },
  { name: 'i-heroicons-fire', label: 'Fitness' },
  { name: 'i-heroicons-book-open', label: 'Reading' },
  { name: 'i-heroicons-heart', label: 'Health' },
  { name: 'i-heroicons-sparkles', label: 'Mindfulness' },
  { name: 'i-heroicons-pencil', label: 'Writing' },
  { name: 'i-heroicons-musical-note', label: 'Music' },
  { name: 'i-heroicons-moon', label: 'Sleep' },
  { name: 'i-heroicons-beaker', label: 'Hydration' },
  { name: 'i-heroicons-star', label: 'Goal' },
]

async function completeOnboarding(skip: boolean) {
  applyTier()
  applyPresence()
  localStorage.setItem('habitat-onboarded', '1')
  localStorage.setItem('habitat-permissions-onboarded', '1')

  if (!skip && habitName.value.trim() && db.isAvailable) {
    savingHabit.value = true
    try {
      const newHabit = await db.createHabit({
        name: habitName.value.trim(),
        description: '',
        color: '#06b6d4',
        icon: habitIcon.value,
        frequency: 'daily',
        tags: [],
        annotations: {},
        type: 'BOOLEAN',
        target_value: 1,
        paused_until: null,
      })
      if (habitSchedule.value === 'weekdays' && newHabit.schedule) {
        await db.updateHabitSchedule({
          id: newHabit.schedule.id,
          schedule_type: 'SPECIFIC_DAYS',
          days_of_week: [1, 2, 3, 4, 5],
        })
      }
    } catch (err) {
      console.error('[Onboarding] Failed to create habit:', err)
    } finally {
      savingHabit.value = false
    }
  }

  router.replace('/')
}
</script>

<template>
  <div class="min-h-dvh bg-(--ui-bg) text-(--ui-text) flex flex-col">
    <!-- Content area -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 pt-safe-top">
      <div class="w-full max-w-sm">

        <!-- STEP 0: Welcome -->
        <Transition name="step" mode="out-in">
          <div v-if="step === 0" key="welcome" class="flex flex-col items-center text-center gap-6">
            <svg
              class="plant-logo-lg text-primary-400 w-16 h-[4.4rem]"
              :class="{ 'sprout-anim': logoAnimating }"
              viewBox="0 0 40 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Habitat"
              @click="replayLogo"
              @animationend="onLogoAnimEnd"
            >
              <line class="sprout-stem" x1="20" y1="40" x2="20" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" pathLength="1" />
              <path class="sprout-leaf-l" d="M 20,24 C 11,23 4,29 8,34 C 11,37 19,30 20,24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1" />
              <path class="sprout-branch-r" d="M 20,24 C 26,20 32,14 30,8 C 28,5 20,13 20,24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1" />
              <path class="sprout-soil" d="M 8,40 C 12,37 28,37 32,40" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" pathLength="1" />
            </svg>

            <div class="space-y-2">
              <h1 class="text-3xl font-bold tracking-tight">Welcome to Habitat</h1>
              <p class="text-(--ui-text-muted) text-base leading-relaxed">
                Private habit tracking. All your data stays on your device, always.
              </p>
            </div>

            <UButton size="lg" class="w-full mt-2" @click="next">
              Get started
              <template #trailing>
                <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
              </template>
            </UButton>
          </div>
        </Transition>

        <!-- STEP 1: Feature tier -->
        <Transition name="step" mode="out-in">
          <div v-if="step === 1" key="features" class="flex flex-col gap-5">
            <div class="space-y-1">
              <h2 class="text-2xl font-bold tracking-tight">How do you want to use it?</h2>
              <p class="text-sm text-(--ui-text-muted)">You can change this any time in Settings.</p>
            </div>

            <div class="flex flex-col gap-3">
              <button
                v-for="tier in TIERS"
                :key="tier.id"
                class="flex items-start gap-4 p-4 rounded-xl border text-left transition-colors"
                :class="selectedTier === tier.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-accented)'"
                @click="selectedTier = tier.id"
              >
                <div
                  class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                  :class="selectedTier === tier.id ? 'bg-primary-500/20' : 'bg-(--ui-bg-muted)'"
                >
                  <UIcon :name="tier.icon" class="w-5 h-5" :class="selectedTier === tier.id ? 'text-primary-400' : 'text-(--ui-text-muted)'" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-sm">{{ tier.title }}</span>
                    <span
                      v-if="tier.badge"
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 leading-tight"
                    >
                      {{ tier.badge }}
                    </span>
                  </div>
                  <p class="text-xs text-(--ui-text-muted) mt-0.5 leading-relaxed">{{ tier.description }}</p>
                </div>
                <div class="shrink-0 mt-1">
                  <div
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    :class="selectedTier === tier.id ? 'border-primary-500 bg-primary-500' : 'border-(--ui-border-accented)'"
                  >
                    <div v-if="selectedTier === tier.id" class="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </button>
            </div>

            <div class="flex gap-3">
              <UButton variant="ghost" color="neutral" @click="back">
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                Back
              </UButton>
              <UButton class="flex-1" @click="next">Next</UButton>
            </div>
          </div>
        </Transition>

        <!-- STEP 2: Zen / Power display preset -->
        <Transition name="step" mode="out-in">
          <div v-if="step === 2" key="presence" class="flex flex-col gap-5">
            <div class="space-y-1">
              <h2 class="text-2xl font-bold tracking-tight">How should it look?</h2>
              <p class="text-sm text-(--ui-text-muted)">Tags, labels, and annotations can always be toggled later in Settings.</p>
            </div>

            <div class="flex flex-col gap-3">
              <button
                v-for="p in PRESENCES"
                :key="p.id"
                class="flex items-start gap-4 p-4 rounded-xl border text-left transition-colors"
                :class="selectedPresence === p.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-accented)'"
                @click="selectedPresence = p.id"
              >
                <div
                  class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                  :class="selectedPresence === p.id ? 'bg-primary-500/20' : 'bg-(--ui-bg-muted)'"
                >
                  <UIcon :name="p.icon" class="w-5 h-5" :class="selectedPresence === p.id ? 'text-primary-400' : 'text-(--ui-text-muted)'" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="font-semibold text-sm">{{ p.title }}</span>
                  <p class="text-xs text-(--ui-text-muted) mt-0.5 leading-relaxed">{{ p.description }}</p>
                </div>
                <div class="shrink-0 mt-1">
                  <div
                    class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    :class="selectedPresence === p.id ? 'border-primary-500 bg-primary-500' : 'border-(--ui-border-accented)'"
                  >
                    <div v-if="selectedPresence === p.id" class="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </button>
            </div>

            <div class="flex gap-3">
              <UButton variant="ghost" color="neutral" @click="back">
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                Back
              </UButton>
              <UButton class="flex-1" @click="next">Next</UButton>
            </div>
          </div>
        </Transition>

        <!-- STEP 3: Notifications -->
        <Transition name="step" mode="out-in">
          <div v-if="step === 3" key="notifications" class="flex flex-col items-center text-center gap-6">
            <div class="w-20 h-20 rounded-2xl bg-primary-500/15 flex items-center justify-center">
              <UIcon name="i-heroicons-bell" class="w-10 h-10 text-primary-400" />
            </div>

            <div class="space-y-2">
              <h2 class="text-2xl font-bold tracking-tight">Get reminded to check in</h2>
              <p class="text-(--ui-text-muted) text-sm leading-relaxed">
                Enable notifications so Habitat can remind you of habits and tasks at the right time.
                <span v-if="isNative"> On Android, you can also grant exact alarm and battery exemption permissions.</span>
              </p>
            </div>

            <div class="w-full space-y-3">
              <UButton
                class="w-full"
                :loading="requestingNotif"
                @click="handleEnableNotifications"
              >
                <UIcon name="i-heroicons-bell" class="w-4 h-4" />
                Enable notifications
              </UButton>
              <UButton variant="ghost" color="neutral" class="w-full" @click="next">
                Skip for now
              </UButton>
            </div>

            <UButton variant="ghost" color="neutral" size="sm" class="self-start -ml-1" @click="back">
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
              Back
            </UButton>
          </div>
        </Transition>

        <!-- STEP 4: First habit -->
        <Transition name="step" mode="out-in">
          <div v-if="step === 4" key="habit" class="flex flex-col gap-5">
            <div class="space-y-1">
              <h2 class="text-2xl font-bold tracking-tight">Create your first habit</h2>
              <p class="text-sm text-(--ui-text-muted)">You can always add more later.</p>
            </div>

            <!-- Name -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-(--ui-text-muted)">Name</label>
              <UInput
                v-model="habitName"
                placeholder="e.g. Morning walk"
                size="lg"
                autofocus
              />
            </div>

            <!-- Schedule -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-(--ui-text-muted)">Schedule</label>
              <div class="flex gap-2">
                <button
                  class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors"
                  :class="habitSchedule === 'daily'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-accented)'"
                  @click="habitSchedule = 'daily'"
                >
                  Every day
                </button>
                <button
                  class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors"
                  :class="habitSchedule === 'weekdays'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-accented)'"
                  @click="habitSchedule = 'weekdays'"
                >
                  Weekdays
                </button>
              </div>
            </div>

            <!-- Icon picker -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-(--ui-text-muted)">Icon</label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="ic in HABIT_ICONS"
                  :key="ic.name"
                  class="flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors"
                  :class="habitIcon === ic.name
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-accented)'"
                  :title="ic.label"
                  @click="habitIcon = ic.name"
                >
                  <UIcon :name="ic.name" class="w-5 h-5" :class="habitIcon === ic.name ? 'text-primary-400' : 'text-(--ui-text-muted)'" />
                  <span class="text-[10px] text-(--ui-text-dimmed) leading-none">{{ ic.label }}</span>
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-1">
              <UButton variant="ghost" color="neutral" @click="back">
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                Back
              </UButton>
              <UButton
                class="flex-1"
                :loading="savingHabit"
                :disabled="!habitName.trim()"
                @click="completeOnboarding(false)"
              >
                Start Habitat
              </UButton>
            </div>

            <button
              class="text-sm text-(--ui-text-dimmed) hover:text-(--ui-text-muted) transition-colors text-center"
              @click="completeOnboarding(true)"
            >
              Skip — I'll do this later
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Progress dots (5 total) -->
    <div class="pb-safe-bottom flex justify-center gap-2 py-6">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-full transition-all duration-300"
        :class="step === i - 1
          ? 'w-6 h-2 bg-primary-500'
          : 'w-2 h-2 bg-(--ui-border-accented)'"
      />
    </div>
  </div>
</template>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
