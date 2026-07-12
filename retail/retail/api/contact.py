import frappe
from frappe.contacts.doctype.contact.contact import get_contacts_linking_to

def get_party_contact_info(doctype, party_name):
    if not doctype or not party_name:
        return {}
    contacts = get_contacts_linking_to(doctype, party_name, fields=["*"])
    return contacts or {}

def _contact_dict(doc) -> dict:
    email_ids = frappe.get_all(
        "Contact Email",
        filters={"parenttype": "Contact", "parent": doc.name},
        fields=["email_id", "is_primary"],
        order_by="is_primary DESC",
    )
    phone_nos = frappe.get_all(
        "Contact Phone",
        filters={"parenttype": "Contact", "parent": doc.name},
        fields=["phone", "is_primary_phone", "is_primary_mobile_no"],
        order_by="is_primary_phone DESC, is_primary_mobile_no DESC",
    )

    linked_address = None
    if doc.address and frappe.has_permission("Address", "read"):
        try:
            linked_address = _address_dict(frappe.get_doc("Address", doc.address))
        except Exception:
            pass

    return {
        "name"               : doc.name,
        "first_name"         : doc.first_name,
        "last_name"          : doc.last_name,
        "full_name"          : doc.full_name,
        "designation"        : doc.designation,
        "is_primary_contact" : doc.is_primary_contact,
        "address"            : doc.address,
        "email_ids"          : email_ids,
        "phone_nos"          : phone_nos,
        "linked_address"     : linked_address,
    }


def _parse_email_ids(doc, email_ids):
    doc.email_ids = []
    for e in email_ids:
        if e.get("email_id"):
            doc.append("email_ids", {
                "email_id": e["email_id"],
                "is_primary": int(e.get("is_primary", 0)),
            })


def _parse_phone_nos(doc, phone_nos):
    doc.phone_nos = []
    for p in phone_nos:
        if p.get("phone"):
            doc.append("phone_nos", {
                "phone": p["phone"],
                "is_primary_phone": int(p.get("is_primary_phone", 0)),
                "is_primary_mobile_no": int(p.get("is_primary_mobile_no", 0)),
            })


@frappe.whitelist(allow_guest=False)
def create_contact(customer, first_name, last_name=None, designation=None,
                   is_primary=0, email_ids=None, phone_nos=None, address_name=None):

    if isinstance(email_ids, str): email_ids = frappe.parse_json(email_ids)
    if isinstance(phone_nos, str): phone_nos = frappe.parse_json(phone_nos)

    doc = frappe.new_doc("Contact")
    doc.first_name = first_name
    doc.last_name = last_name or ""
    doc.designation = designation or ""
    doc.is_primary_contact = int(is_primary or 0)

    doc.append("links", {"link_doctype": "Customer", "link_name": customer})

    if email_ids: _parse_email_ids(doc, email_ids)
    if phone_nos: _parse_phone_nos(doc, phone_nos)
    if address_name: doc.address = address_name

    doc.insert(ignore_permissions=False)
    return _contact_dict(doc)


@frappe.whitelist(allow_guest=False)
def update_contact(contact_name, first_name=None, last_name=None, designation=None,
                   is_primary=0, email_ids=None, phone_nos=None, address_name=None):

    if isinstance(email_ids, str): email_ids = frappe.parse_json(email_ids)
    if isinstance(phone_nos, str): phone_nos = frappe.parse_json(phone_nos)

    doc = frappe.get_doc("Contact", contact_name)

    if first_name  is not None: doc.first_name  = first_name
    if last_name   is not None: doc.last_name   = last_name
    if designation is not None: doc.designation = designation
    doc.is_primary_contact = int(is_primary or 0)

    if address_name is not None: doc.address = address_name or None
    if email_ids    is not None: _parse_email_ids(doc, email_ids)
    if phone_nos    is not None: _parse_phone_nos(doc, phone_nos)

    doc.save(ignore_permissions=False)
    return _contact_dict(doc)
