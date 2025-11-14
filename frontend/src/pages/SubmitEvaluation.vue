<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white shadow-md rounded-lg px-6 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Submit Content for Evaluation</h1>
        <p class="text-gray-600 mb-8">
          Submit your website URL or upload marketing materials to receive a comprehensive
          storytelling evaluation report.
        </p>

        <!-- Error Display -->
        <ErrorDisplay v-if="errorMessage" :message="errorMessage" :details="errorDetails" />

        <!-- Confirmation Message -->
        <ConfirmationMessage
          v-if="confirmationData"
          :message="confirmationData.message"
          :submission-id="confirmationData.id"
          :estimated-time="estimatedTime"
        />

        <!-- Evaluation Form -->
        <EvaluationForm v-if="!confirmationData" @success="handleSuccess" @error="handleError" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EvaluationForm from '../components/EvaluationForm.vue';
import ConfirmationMessage from '../components/ConfirmationMessage.vue';
import ErrorDisplay from '../components/ErrorDisplay.vue';

interface ConfirmationData {
  id: string;
  message: string;
}

const errorMessage = ref<string>('');
const errorDetails = ref<string>('');
const confirmationData = ref<ConfirmationData | null>(null);
const estimatedTime = ref<string>('5-10 minutes');

function handleSuccess(data: { id: string; message: string }): void {
  confirmationData.value = {
    id: data.id,
    message: data.message,
  };
  errorMessage.value = '';
  errorDetails.value = '';
}

function handleError(message: string): void {
  errorMessage.value = message;
  errorDetails.value = 'Please check your input and try again.';
  confirmationData.value = null;
}
</script>
