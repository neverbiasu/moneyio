<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';

defineOptions({ name: 'UserProfileModal' });

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    name: string;
    email: string;
    avatar?: string;
  }>(),
  {
    avatar: '/avatar.png',
  },
);

const emit = defineEmits<{
  close: [];
  saved: [avatar: string];
}>();

const previewAvatar = ref(props.avatar);
const fileError = ref('');

watch(
  () => [props.isOpen, props.avatar],
  () => {
    if (!props.isOpen) {
      return;
    }
    previewAvatar.value = props.avatar;
    fileError.value = '';
  },
);

function handleClose() {
  emit('close');
}

function onFileChange(event: Event) {
  fileError.value = '';
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    fileError.value = 'Please select an image file.';
    target.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    fileError.value = 'Image size must be less than 2MB.';
    target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      previewAvatar.value = reader.result;
    }
    target.value = '';
  };
  reader.readAsDataURL(file);
}

function saveProfile() {
  emit('saved', previewAvatar.value);
  emit('close');
}
</script>

<template>
  <TransitionRoot :show="isOpen">
    <Dialog :open="isOpen" as="div" class="relative z-50" @close="handleClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <DialogTitle as="h2" class="text-xl font-bold text-gray-900 mb-6">
                Personal Profile
              </DialogTitle>

              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <img
                    :src="previewAvatar"
                    alt="Profile avatar"
                    class="size-20 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ name }}</p>
                    <p class="text-xs text-gray-500">{{ email }}</p>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="avatar-file">
                    Avatar
                  </label>
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    class="w-full text-sm text-gray-700"
                    @change="onFileChange"
                  />
                  <p v-if="fileError" class="mt-1 text-sm text-red-600">{{ fileError }}</p>
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  class="duo-btn-secondary px-4 py-2 text-sm font-medium"
                  @click="handleClose"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="duo-btn-primary px-4 py-2 text-sm font-medium"
                  @click="saveProfile"
                >
                  Save
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
