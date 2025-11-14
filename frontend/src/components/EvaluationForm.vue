<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Email Field (Required) -->
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
        Email Address <span class="text-red-500">*</span>
      </label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.email }"
        placeholder="your.email@company.com"
      />
      <p v-if="errors.email" class="mt-1 text-sm text-red-600" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <!-- URL Field (Optional) -->
    <div>
      <label for="url" class="block text-sm font-medium text-gray-700 mb-1">
        Website URL
      </label>
      <input
        id="url"
        v-model="formData.url"
        type="url"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.url }"
        placeholder="https://example.com"
      />
      <p v-if="errors.url" class="mt-1 text-sm text-red-600" role="alert">
        {{ errors.url }}
      </p>
    </div>

    <!-- File Upload Field (Optional) -->
    <div>
      <label for="files" class="block text-sm font-medium text-gray-700 mb-1">
        Upload Files (PDF, PPTX, DOCX)
      </label>
      <input
        id="files"
        type="file"
        multiple
        accept=".pdf,.pptx,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        @change="handleFileChange"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.files }"
      />
      <p v-if="errors.files" class="mt-1 text-sm text-red-600" role="alert">
        {{ errors.files }}
      </p>
      <p class="mt-1 text-xs text-gray-500">
        Maximum file size: 50MB. Supported formats: PDF, PPTX, DOCX
      </p>
      <ul v-if="selectedFiles.length > 0" class="mt-2 text-sm text-gray-600">
        <li v-for="(file, index) in selectedFiles" :key="index">
          {{ file.name }} ({{ formatFileSize(file.size) }})
        </li>
      </ul>
    </div>

    <!-- Target Audience Field (Optional) -->
    <div>
      <label for="targetAudience" class="block text-sm font-medium text-gray-700 mb-1">
        Target Audience (Optional)
      </label>
      <textarea
        id="targetAudience"
        v-model="formData.targetAudience"
        rows="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Target audience (e.g., CFOs at Fortune 500 companies)"
      />
      <p class="mt-1 text-xs text-gray-500">
        Specify a target audience to focus the evaluation (optional)
      </p>
    </div>

    <!-- Validation Error (General) -->
    <div v-if="errors.general" class="p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-600" role="alert">{{ errors.general }}</p>
    </div>

    <!-- Confirmation Message -->
    <div v-if="confirmationMessage" class="p-4 bg-green-50 border border-green-200 rounded-md">
      <p class="text-sm text-green-800" role="alert">{{ confirmationMessage }}</p>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      :disabled="isSubmitting"
      class="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="!isSubmitting">Submit for Evaluation</span>
      <span v-else>Submitting...</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { submitEvaluation, type EvaluationSubmission } from '../services/api';

interface FormData {
  email: string;
  url: string;
  targetAudience: string;
}

interface Errors {
  email?: string;
  url?: string;
  files?: string;
  general?: string;
}

const emit = defineEmits<{
  success: [response: { id: string; message: string }];
  error: [error: string];
}>();

const formData = reactive<FormData>({
  email: '',
  url: '',
  targetAudience: '',
});

const selectedFiles = ref<File[]>([]);
const errors = reactive<Errors>({});
const isSubmitting = ref(false);
const confirmationMessage = ref<string>('');

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files) {
    selectedFiles.value = [];
    return;
  }

  const fileArray = Array.from(files);
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  ];
  const allowedExtensions = ['.pdf', '.pptx', '.docx'];

  // Validate files
  for (const file of fileArray) {
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    // Check file size
    if (file.size > maxSize) {
      errors.files = `File "${file.name}" exceeds 50MB limit`;
      selectedFiles.value = [];
      return;
    }

    // Check file type
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      errors.files = `Unsupported file type. Allowed: PDF, PPTX, DOCX`;
      selectedFiles.value = [];
      return;
    }
  }

  selectedFiles.value = fileArray;
  errors.files = undefined;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(errors).forEach((key) => {
    errors[key as keyof Errors] = undefined;
  });

  // Validate email
  if (!formData.email) {
    errors.email = 'Email is required';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    errors.email = 'Invalid email format';
    return false;
  }

  // Validate URL if provided
  if (formData.url) {
    try {
      new URL(formData.url);
    } catch {
      errors.url = 'Invalid URL format';
      return false;
    }
  }

  // Validate that either URL or files are provided
  if (!formData.url && selectedFiles.value.length === 0) {
    errors.general = 'Either a URL or at least one file must be provided';
    return false;
  }

  return true;
}

async function handleSubmit(): Promise<void> {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  errors.general = undefined;

  try {
    const submission: EvaluationSubmission = {
      email: formData.email,
      files: selectedFiles.value.length > 0 ? selectedFiles.value : undefined,
      targetAudience: formData.targetAudience || undefined,
    };

    if (formData.url) {
      submission.url = formData.url;
    }

    const response = await submitEvaluation(submission);

    // Display confirmation message
    confirmationMessage.value = response.message;

    // Emit success event
    emit('success', {
      id: response.id,
      message: response.message,
    });

    // Reset form after a delay
    setTimeout(() => {
      formData.email = '';
      formData.url = '';
      formData.targetAudience = '';
      selectedFiles.value = [];
      confirmationMessage.value = '';
    }, 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit evaluation';
    errors.general = errorMessage;
    emit('error', errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

