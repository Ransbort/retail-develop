<template>
  <div class="fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">
          {{ customer ? 'تعديل العميل' : 'عميل جديد' }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Personal Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">المعلومات الشخصية</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسم العميل"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="البريد الإلكتروني"
              />
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
              <input
                v-model="form.phone"
                type="tel"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="رقم الهاتف"
              />
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input
                v-model="form.address"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="العنوان"
              />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="blocked">محظور</option>
              </select>
            </div>

            <!-- Customer Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">نوع العميل</label>
              <select
                v-model="form.customerType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="individual">فرد</option>
                <option value="business">تجاري</option>
                <option value="corporate">شركة</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Financial Information -->
        <div class="space-y-4 border-t pt-4">
          <h3 class="text-lg font-semibold text-gray-900">المعلومات المالية</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Credit Limit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">حد الائتمان</label>
              <input
                v-model="form.creditLimit"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="حد الائتمان"
              />
            </div>

            <!-- Discount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">خصم (%) </label>
              <input
                v-model="form.discount"
                type="number"
                min="0"
                max="100"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <!-- Payment Terms -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">شروط الدفع (أيام)</label>
              <input
                v-model="form.paymentTerms"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="space-y-4 border-t pt-4">
          <h3 class="text-lg font-semibold text-gray-900">معلومات إضافية</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ملاحظات عن العميل"
            ></textarea>
          </div>

          <!-- Enable Notifications -->
          <div class="flex items-center gap-2">
            <input
              v-model="form.enableNotifications"
              type="checkbox"
              id="notifications"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <label for="notifications" class="text-sm text-gray-700">تفعيل إشعارات الديون</label>
          </div>
        </div>

        <!-- Actions -->
        <div class="border-t pt-6 flex items-center justify-end gap-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {{ customer ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

  const props = defineProps( {
   customer: {
      type: Object,
      default: null
    }
  })
  const emit = defineEmits(['save', 'close'])


    const form = ref({
      id: null,
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      customerType: 'individual',
      creditLimit: 0,
      discount: 0,
      paymentTerms: 0,
      notes: '',
      enableNotifications: true,
      totalPurchases: 0,
      debt: 0,
      createdAt: new Date().toISOString().split('T')[0]
    })

    // Watch for customer changes
    watch(() => props.customer, (newCustomer) => {
      if (newCustomer) {
        form.value = { ...newCustomer }
      } else {
        form.value = {
          id: null,
          name: '',
          email: '',
          phone: '',
          address: '',
          status: 'active',
          customerType: 'individual',
          creditLimit: 0,
          discount: 0,
          paymentTerms: 0,
          notes: '',
          enableNotifications: true,
          totalPurchases: 0,
          debt: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
      }
    }, { immediate: true })

    const handleSubmit = () => {
      // Validation
      if (!form.value.name || !form.value.phone) {
        alert('الرجاء ملء الحقول المطلوبة')
        return
      }

      emit('save', { ...form.value })
    }

</script>
