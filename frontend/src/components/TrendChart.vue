<script setup lang="ts">
import { computed } from 'vue';
import type { ChartDataPoint } from '@/api/mock-data';

defineOptions({ name: 'TrendChart' });

interface Props {
  points?: ChartDataPoint[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  points: () => [],
  isLoading: false,
});

const width = 680;
const height = 240;
const padding = 24;

const maxValue = computed(() => {
  const values = props.points.flatMap((point) => [point.income, point.expense]);
  const max = Math.max(...values, 1);
  return max;
});

const chartPoints = computed(() => {
  if (props.points.length === 0) {
    return [];
  }

  const stepX = (width - padding * 2) / Math.max(props.points.length - 1, 1);
  return props.points.map((point, index) => {
    const x = padding + index * stepX;
    const incomeY = height - padding - (point.income / maxValue.value) * (height - padding * 2);
    const expenseY = height - padding - (point.expense / maxValue.value) * (height - padding * 2);
    return {
      x,
      incomeY,
      expenseY,
      label: point.date.slice(5),
    };
  });
});

const incomePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.incomeY}`)
    .join(' ');
});

const expensePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.expenseY}`)
    .join(' ');
});

const xTicks = computed(() => {
  if (chartPoints.value.length <= 6) {
    return chartPoints.value;
  }
  const step = Math.floor(chartPoints.value.length / 6);
  return chartPoints.value.filter((_, index) => index % step === 0);
});
</script>

<template>
  <section
    class="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
    aria-label="Income and expense trend chart"
  >
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">30-Day Income vs Expense</h2>
      <div class="flex items-center gap-4 text-sm text-gray-600">
        <span class="flex items-center gap-2"
          ><span class="w-3 h-3 rounded-full bg-green-600"></span>Income</span
        >
        <span class="flex items-center gap-2"
          ><span class="w-3 h-3 rounded-full bg-red-600"></span>Expense</span
        >
      </div>
    </header>

    <div v-if="isLoading" class="h-60 bg-gray-100 rounded-md animate-pulse"></div>
    <p v-else-if="points.length === 0" class="text-sm text-gray-500 py-10 text-center">
      No trend data available.
    </p>
    <div v-else class="w-full overflow-x-auto">
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="min-w-[680px] w-full h-60"
        role="img"
        aria-label="Line chart showing income and expense over 30 days"
      >
        <line
          v-for="tick in [0, 0.25, 0.5, 0.75, 1]"
          :key="tick"
          :x1="padding"
          :y1="height - padding - tick * (height - padding * 2)"
          :x2="width - padding"
          :y2="height - padding - tick * (height - padding * 2)"
          class="stroke-gray-200"
          stroke-width="1"
        />

        <path
          :d="incomePath"
          fill="none"
          class="stroke-green-600"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="expensePath"
          fill="none"
          class="stroke-red-600"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <text
          v-for="tick in xTicks"
          :key="tick.x"
          :x="tick.x"
          :y="height - 6"
          text-anchor="middle"
          class="fill-gray-500 text-[10px]"
        >
          {{ tick.label }}
        </text>
      </svg>
    </div>
  </section>
</template>
