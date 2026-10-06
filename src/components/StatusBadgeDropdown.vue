<template>
  <div class="d-inline-block position-relative">
    <select
      :value="modelValue"
      :class="['form-select form-select-sm status-badge-select py-1 px-2 border-0 shadow-sm', badgeClass]"
      :disabled="disabled"
      @change="onChange"
      style="font-size: 0.8rem; min-width: 110px;"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        class="bg-white text-dark py-1"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
export default {
  name: 'StatusBadgeDropdown',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'document', // 'document' | 'ba20' | 'penerima'
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    options(): { value: string; label: string }[] {
      if (this.type === 'ba20' || this.type === 'rampasan') {
        return [
          { value: 'tidak_ada', label: 'Tidak Ada' },
          { value: 'ada', label: 'Ada' },
        ];
      }
      if (this.type === 'penerima') {
        return [
          { value: 'belum_dibuat', label: 'Belum Dibuat' },
          { value: 'sudah_dibuat', label: 'Sudah Dibuat' },
        ];
      }
      // Standard document (B-18, BA-21, BA-22, BA-23, Pendapat Hukum)
      return [
        { value: 'tidak_ada', label: 'Tidak Ada' },
        { value: 'belum_dibuat', label: 'Belum Dibuat' },
        { value: 'sudah_dibuat', label: 'Sudah Dibuat' },
      ];
    },
    badgeClass(): string {
      if (this.type === 'ba20') {
        return this.modelValue === 'ada'
          ? 'badge-ada'
          : 'badge-tidak-ada';
      }
      if (this.type === 'rampasan') {
        return this.modelValue === 'ada'
          ? 'badge-rampasan-ada'
          : 'badge-tidak-ada';
      }
      switch (this.modelValue) {
        case 'sudah_dibuat':
          return 'badge-sudah-dibuat';
        case 'belum_dibuat':
          return 'badge-belum-dibuat';
        case 'tidak_ada':
        default:
          return 'badge-tidak-ada';
      }
    },
  },
  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLSelectElement;
      this.$emit('update:modelValue', target.value);
      this.$emit('change', target.value);
    },
  },
};
</script>
