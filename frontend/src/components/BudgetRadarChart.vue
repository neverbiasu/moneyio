<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'BudgetRadarChart' });

interface RadarItem {
  name: string;
  value: number;
  maxValue: number;
}

interface Props {
  items?: RadarItem[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  isLoading: false,
});

const center = 110;
const radius = 80;
const levels = 4;

const points = computed(() => {
  if (props.items.length === 0) {
    return [];
  }

  return props.items.map((item, index) => {
    const angle = (Math.PI * 2 * index) / props.items.length - Math.PI / 2;
    const ratio = item.maxValue > 0 ? Math.min(item.value / item.maxValue, 1) : 0;
    const valueRadius = ratio * radius;

    return {
      ...item,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      valueX: center + Math.cos(angle) * valueRadius,
      valueY: center + Math.sin(angle) * valueRadius,
      labelX: center + Math.cos(angle) * (radius + 18),
      labelY: center + Math.sin(angle) * (radius + 18),
      percent: Math.round(ratio * 100),
    };
  });
});

const polygonPoints = computed(() => {
  return points.value.map((point) => `${point.valueX},${point.valueY}`).join(' ');
});

const levelPolygons = computed(() => {
  return Array.from({ length: levels }, (_, level) => {
    const currentRadius = ((level + 1) / levels) * radius;
    const polygon = props.items
      .map((_, index) => {
        const angle = (Math.PI * 2 * index) / props.items.length - Math.PI / 2;
        const x = center + Math.cos(angle) * currentRadius;
        const y = center + Math.sin(angle) * currentRadius;
        return `${x},${y}`;
      })
      .join(' ');
    return polygon;
  });
});
</script>

<template>
  <section
    class="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
    aria-label="Budget execution radar chart"
  >
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Budget Usage Radar</h2>

    <div v-if="isLoading" class="h-64 bg-gray-100 rounded-md animate-pulse"></div>
    <p v-else-if="items.length === 0" class="text-sm text-gray-500 py-10 text-center">
      No budget data available.
    </p>
    <div v-else class="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-center">
      <svg
        viewBox="0 0 220 220"
        class="w-60 h-60 mx-auto"
        role="img"
        aria-label="Radar chart showing budget usage by category"
      >
        <polygon
          v-for="polygon in levelPolygons"
          :key="polygon"
          :points="polygon"
          fill="none"
          class="stroke-gray-200"
          stroke-width="1"
        />

        <line
          v-for="point in points"
          :key="`axis-${point.name}`"
          :x1="center"
          :y1="center"
          :x2="point.axisX"
          :y2="point.axisY"
          class="stroke-gray-300"
          stroke-width="1"
        />

        <polygon
          :points="polygonPoints"
          class="fill-blue-600/20 stroke-blue-600"
          stroke-width="2"
        />

        <circle
          v-for="point in points"
          :key="`dot-${point.name}`"
          :cx="point.valueX"
          :cy="point.valueY"
          r="3"
          class="fill-blue-600"
        />

        <text
          v-for="point in points"
          :key="`label-${point.name}`"
          :x="point.labelX"
          :y="point.labelY"
          text-anchor="middle"
          class="fill-gray-600 text-[10px]"
        >
          {{ point.name }}
        </text>
      </svg>

      <ul class="space-y-2">
        <li
          v-for="point in points"
          :key="`stat-${point.name}`"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-700">{{ point.name }}</span>
          <span class="text-gray-900 font-medium">{{ point.percent }}%</span>
        </li>
      </ul>
    </div>
  </section>
</template>
