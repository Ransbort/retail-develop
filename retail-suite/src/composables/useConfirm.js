// composables/useConfirm.js
import { ref } from 'vue'

const state = ref({
  show: false,
  type: 'submit',
  title: '',
  message: '',
  confirmLabel: '',
  docName: '',
  loading: false,
  resolve: null,
})

export function useConfirmState() {
  return state
}

export function useConfirm() {
  const confirm = ({ type = 'info', title, message, confirmLabel = 'Confirm', docName = '' } = {}) => {
    return new Promise((resolve) => {
      state.value = {
        show: true,
        type,
        title,
        message,
        confirmLabel,
        docName,
        loading: false,
        resolve,
      }
    })
  }

  return { confirm }
}
