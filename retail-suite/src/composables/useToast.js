import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export const useToast = () => {
  const toast = ({ title, message, type = 'success', icon, iconClasses, duration = 3500 }) => {
    const id = ++nextId
    toasts.value.push({ id, title, message, type, icon, iconClasses, duration })
    setTimeout(() => remove(id), duration)
  }

  const remove = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // shortcuts
  toast.success = (title, opts = {}) => toast({ title, type: 'success', icon: 'check',          iconClasses: 'text-green-500', ...opts })
  toast.error   = (title, opts = {}) => toast({ title, type: 'error',   icon: 'x',             iconClasses: 'text-red-500',   ...opts })
  toast.warning = (title, opts = {}) => toast({ title, type: 'warning', icon: 'alert-triangle', iconClasses: 'text-yellow-500',...opts })
  toast.info    = (title, opts = {}) => toast({ title, type: 'info',    icon: 'info',           iconClasses: 'text-blue-500',  ...opts })

  return { toasts, toast, remove }
}
