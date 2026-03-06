<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'CategoryPieChart' });

interface PieItem {
  name: string;
  value: number;
}

interface Props {
  items?: PieItem[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  isLoading: false,
});

const colorClasses = [
  'fill-blue-600',
  'fill-green-600',
  'fill-red-600',
  'fill-purple-600',
  'fill-yellow-500',
  'fill-cyan-600',
];

const legendColorClasses = [
  'bg-blue-600',
  'bg-green-600',
  'bg-red-600',
  'bg-purple-600',
  'bg-yellow-500',
  'bg-cyan-600',
];

const outerR = 42;
const innerR = 24;
const cx = 50;
const cy = 50;

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));

const totalLabel = computed(() => {
  if (total.value >= 1000) return `$${(total.value / 1000).toFixed(1)}k`;
  return `$${total.value}`;
});

const slices = computed(() => {
  if (!total.value) return [];

  let cumulative = 0;
  return props.items.map((item, index) => {
    // Clamp portion to 0.9999 to handle the case where a single category is 100%
    // (SVG arc coincidence when start angle === end angle)
    const portion = Math.min(item.value / total.value, 0.9999);
    const start = cumulative;
    cumulative += portion;
    const end = cumulative;

    const startAngle = start * Math.PI * 2 - Math.PI / 2;
    const endAngle = end * Math.PI * 2 - Math.PI / 2;

    const ox1 = cx + Math.cos(startAngle) * outerR;
    const oy1 = cy + Math.sin(startAngle) * outerR;
    const ox2 = cx + Math.cos(endAngle) * outerR;
    const oy2 = cy + Math.sin(endAngle) * outerR;
    const ix1 = cx + Math.cos(startAngle) * innerR;
    const iy1 = cy + Math.sin(startAngle) * innerR;
    const ix2 = cx + Math.cos(endAngle) * innerR;
    const iy2 = cy + Math.sin(endAngle) * innerR;

    const largeArcFlag = portion > 0.5 ? 1 : 0;
    // Outer arc CW, then inner arc CCW to form donut slice
    const path = `M ${ox1.toFixed(2)} ${oy1.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;

    return {
      ...item,
      path,
      percent: Math.round(portion * 100),
      colorClass: colorClasses[index % colorClasses.length],
      legendColorClass: legendColorClasses[index % legendColorClasses.length],
    };
  });
});
</script>

<template>
  <section
    class="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
    aria-label="Expense category pie chart"
  >
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Category Spending</h2>

    <div v-if="isLoading" class="h-64 bg-gray-100 rounded-md animate-pulse"></div>
    <p v-else-if="items.length === 0" class="text-sm text-gray-500 py-10 text-center">
      No category expense data available.
    </p>
    <div v-else class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
      <svg
        viewBox="0 0 100 100"
        class="w-56 h-56 mx-auto"
        role="img"
        aria-label="Donut chart for expense categories"
      >
        <path
          v-for="slice in slices"
          :key="slice.name"
          :d="slice.path"
          :class="slice.colorClass"
          class="stroke-white"
          stroke-width="0.8"
        />
        <text x="50" y="47" text-anchor="middle" class="fill-gray-900 font-semibold text-[8px]">
          Total
        </text>
        <text x="50" y="56" text-anchor="middle" class="fill-gray-900 font-bold text-[7px]">
          {{ totalLabel }}
        </text>
      </svg>

      <ul class="space-y-2">
        <li
          v-for="slice in slices"
          :key="`legend-${slice.name}`"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="flex items-center gap-2 text-gray-700">
            <span class="w-3 h-3 rounded-full" :class="slice.legendColorClass"></span>
            {{ slice.name }}
          </span>
          <span class="text-gray-900 font-medium">{{ slice.percent }}%</span>
        </li>
      </ul>
    </div>
  </section>
</template>
