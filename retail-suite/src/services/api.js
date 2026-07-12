// api.js File //
import { api } from './auth.js'
import { createListResource, call } from 'frappe-ui'

export const getNotifications = async (user) => {
  try {
    const resource = createListResource({
      doctype: 'Notification Log',
      fields: [
        'name', 'subject', 'email_content', 'creation',
        'read', 'type', 'document_type', 'document_name',
        'for_user', 'from_user'
      ],
      filters: { for_user: user },
      orderBy: 'creation desc',
      pageLength: 20,
      debug: 0,
      // make the first request automatically
      auto: true,
    })

    resource.fetch()
    await resource.list.promise
    console.log("API Get Notifications: ", resource.data)
    return resource.data || []
  } catch (err) {
    console.error('Error loading notifications:', err)
    return []
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await call('frappe.client.set_value', {
      doctype: 'Notification Log',
      name: notificationId,
      fieldname: { read: 1 }
    })
    return response.status === 200
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return false
  }
}

export const markAllNotificationsAsRead = async (notificationIds) => {
  try {
    const promises = notificationIds.map(id =>
      call('frappe.client.set_value', {
        doctype: 'Notification Log',
        name: id,
        fieldname: { read: 1 }
      })
    )
    await Promise.all(promises)
    return true
  } catch (err) {
    console.error('Error marking all notifications as read:', err)
    return false
  }
}

export const getMessages = async () => {
  try {
    const resources = createListResource({
        doctype:'Communication',
        fields: [
          'name',
          'subject',
          'content',
          'sender',
          'creation'
        ],
        filters: {
          communication_type: 'Chat'
        },
        order_by: 'creation desc',
        limit_page_length: 10
      })

    resources.fetch()
    await resources.list.promise
    return resources.data || []
  } catch (err) {
    console.error('Error loading messages:', err)
    return []
  }
}

export const getUsers = async () => {
    try {

        const result = createListResource({
            doctype: 'User',
            fields:['name'],
            auto: true,
            limit_page_length: 100
        })
        result.fetch()
        await result.list.promise
        console.log("API Get Users",result.data)
        return result.data || []

    } catch (e) {
        console.log('error API Get Users', e)
    }
}

export const getUserRoles = async (user) => {
  const res = await call(
    'frappe.core.doctype.user.user.get_roles',
    { uid: user }
  )

  console.log("🛡️ Roles raw response:", res)

  const roles = res || []

  console.log("🛡️ Roles parsed:", roles)

  return roles
}

export const createSampleItems = async (sample_products) => {
    try {
        const response = await call('retail.retail.api.setting.create_all_sample_items',
            { sample_products: sample_products }
        )
        console.log("api createSampleItems", response)
        return response
    }
    catch (error) {

    }

}

export const deleteSampleItems = async () => {
    try {
        const response = await call(
            'retail.retail.api.setting.delete_all_sample_items'
        )
        console.log("🗑️ deleteSampleItems:", response)
        return response
    } catch (error) {
        console.error("❌ deleteSampleItems error:", error)
    }
}

