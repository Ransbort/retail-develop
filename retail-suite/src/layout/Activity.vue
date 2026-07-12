<template>
  <div
    class="rounded-xl shadow-sm p-3"
    :style="{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)'
    }"
  >
    <h2 class="text-sm font-semibold mb-2" :style="{ color: 'var(--text-main)' }">
      {{ title }}
    </h2>
    <div class="space-y-1">
      <div
        v-for="activity in recentActivities"
        :key="activity.id"
        class="flex items-center justify-between py-1"
        :style="{ borderBottom: '1px solid var(--card-border)' }"
      >
        <div class="flex items-center gap-2">
          <div :class="['w-6 h-6 rounded-full flex items-center justify-center', activity.bgColor]">
            <component :is="activity.icon" class="w-3 h-3 text-white" />
          </div>
          <div>
            <p class="text-xs font-medium" :style="{ color: 'var(--text-main)' }">
              {{ activity.title }}
            </p>
            <p class="text-xs" :style="{ color: 'var(--text-muted)' }">
              {{ activity.timestamp }}
            </p>
          </div>
        </div>
        <span :class="['text-xs font-medium px-2 py-0.5 rounded', activity.badgeClass]">
          {{ activity.status }}
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  Calendar,
  CheckSquare,
  Users,

} from 'lucide-vue-next'
const props = defineProps({
    title:{type: String, default: "Recent Activity"}
})

    const recentActivities = ref([
      {
        id: 1,
        title: 'New staff added',
        timestamp: '2 hours ago',
        status: 'Added',
        bgColor: 'bg-blue-500',
        icon: Users,
        badgeClass: 'bg-blue-100 text-blue-800'
      },
      {
        id: 2,
        title: 'Shift schedule updated',
        timestamp: '4 hours ago',
        status: 'Updated',
        bgColor: 'bg-purple-500',
        icon: Calendar,
        badgeClass: 'bg-purple-100 text-purple-800'
      },
      {
        id: 3,
        title: 'Leave request approved',
        timestamp: '6 hours ago',
        status: 'Approved',
        bgColor: 'bg-green-500',
        icon: CheckSquare,
        badgeClass: 'bg-green-100 text-green-800'
      }
    ])
</script>
